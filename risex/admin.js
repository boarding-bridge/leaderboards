// 運営用 参加者調査ページ
//
// 2モードで動作する:
//   - live  (localhost): RISEx 公開API・Blockscout・LayerZero Scan をブラウザから
//     直接照会（api.rise.trade のCORSは localhost を許可）。任意アドレスの調査も可。
//   - enc   (それ以外/GitHub Pages): 運営バックエンドが生成・暗号化した
//     admin_data.enc をパスフレーズで復号し、静的表示する（CORS不要）。
//
// enc モードでは api.rise.trade へは一切アクセスしない。公開 data.json は両モードで
// 参加者リスト・プロフィール・大会期間の取得に使う（同一オリジンのためCORS不要）。

const API_BASE = "https://api.rise.trade"; // live(localhost) モードでのみ使用
const EXPLORER_BASE = "https://explorer.risechain.com";
const LZ_SCAN_BASE = "https://scan.layerzero-api.com";
const COMPETITION_SLUG = "bbdao";
const ENC_FILE = "admin_data.enc";

const IS_LOCALHOST = location.hostname === "localhost";
const MODE = IS_LOCALHOST ? "live" : "enc";

// 出来高の合算条件（risex-backend の INCLUDE_LIQUIDATIONS=false に合わせる）
const INCLUDE_LIQUIDATIONS = false;
const WITHDRAW_FEE_USDC = 1; // イベントから fee が取れない場合のフォールバック値
const RECENT_TRADES_SHOWN = 50;
const MAX_PAGES = 30; // ページング暴走防止（1ページ1000件 × 30）

// RISEチェーン内 vault 預け替え先プロキシ（出金パターン(b)判定用）
const VAULT_PROXY = "0xf17cca821a2c3e6d41c740a46ca0a937c7097dcf";

// LayerZero v2 EID → チェーン名・explorer のtxリンク
const LZ_EID_CHAINS = {
  30101: { name: "Ethereum", txUrl: "https://etherscan.io/tx/" },
  30102: { name: "BNB Chain", txUrl: "https://bscscan.com/tx/" },
  30109: { name: "Polygon", txUrl: "https://polygonscan.com/tx/" },
  30110: { name: "Arbitrum One", txUrl: "https://arbiscan.io/tx/" },
  30111: { name: "Optimism", txUrl: "https://optimistic.etherscan.io/tx/" },
  30184: { name: "Base", txUrl: "https://basescan.org/tx/" },
};

// ---- 状態 -------------------------------------------------------------

let DB = null;          // 公開 data.json（両モードで参照）
let COMP_META = null;   // 大会期間などのメタ（data.json.meta）
let ROSTER = [];        // 参加者リスト（data.json.participants）
let STATIC = null;      // enc モードで復号した admin_data.json
let MARKETS = null;     // market_id → シンボル
let currentAddr = null; // 表示中のアドレス（小文字）
let loadSeq = 0;        // 古い非同期レスポンスの描画を防ぐトークン（live モード）
let PASSPHRASE = null;  // enc モードの復号パスフレーズ（メモリのみ・データ更新に再利用）
let rosterPage = 0;     // 参加者リストの表示ページ（0始まり）
let rosterSort = "default"; // 参加者リストの並び順（default / roi / volume）

const ROSTER_PER_PAGE = 10;

// ---- 汎用ヘルパー -----------------------------------------------------

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function fmtUsd(n, digits = 2) {
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return "$" + v.toLocaleString(undefined, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
}

function fmtNum(n, digits = 2) {
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
}

// 0〜1の割合と百分率のどちらで返ってきても % 表示に揃える
function fmtRatioPercent(v) {
  const n = Number(v);
  if (v == null || !isFinite(n)) return "—";
  return fmtNum(n <= 1 ? n * 100 : n) + "%";
}

function signClass(n) {
  const v = Number(n);
  if (!isFinite(v) || v === 0) return "";
  return v > 0 ? "pos-num" : "neg-num";
}

// 秒/ミリ秒/マイクロ秒/ナノ秒/ISO文字列をミリ秒に正規化する
function toMs(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!isFinite(n) || n <= 0) {
    const d = Date.parse(v);
    return isNaN(d) ? null : d;
  }
  if (n > 1e17) return n / 1e6; // ナノ秒
  if (n > 1e14) return n / 1e3; // マイクロ秒
  if (n > 1e11) return n;       // ミリ秒
  return n * 1000;              // 秒
}

function fmtJst(ms) {
  if (ms == null) return "—";
  return new Date(ms).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function shortAddr(addr) {
  if (!addr || addr.length < 12) return addr ?? "—";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// bytes32 埋め込みアドレス（LayerZero形式）を通常の0xアドレスに戻す
function normalizeAddr(v) {
  if (typeof v !== "string" || !v.startsWith("0x")) return v;
  if (v.length === 66 && /^0x0{24}/i.test(v)) return "0x" + v.slice(26);
  return v;
}

function riseAddrLink(addr) {
  return `<a class="addr-link mono" href="${EXPLORER_BASE}/address/${esc(addr)}" target="_blank" rel="noopener">${esc(shortAddr(addr))}</a>`;
}

function riseTxLink(hash) {
  return `<a class="addr-link mono" href="${EXPLORER_BASE}/tx/${esc(hash)}" target="_blank" rel="noopener">${esc(shortAddr(hash))}</a>`;
}

// オブジェクトから最初に見つかった候補キーの値を返す（APIスキーマ差異の吸収用）
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return null;
}

function rawDetails(label, obj) {
  return `<details class="raw-details"><summary>${esc(label)}（生データ）</summary><pre>${esc(JSON.stringify(obj, null, 2))}</pre></details>`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// RISEx API: {data, request_id} 形式。"error" キーがあれば失敗扱い（live モード専用）
async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const json = await fetchJson(`${API_BASE}${path}${qs ? "?" + qs : ""}`);
  if (json.error) throw new Error(`API error: ${JSON.stringify(json.error)}`);
  return json.data;
}

function setContent(id, html) {
  document.getElementById(id).innerHTML = html;
}

function loadingHtml(msg) {
  return `<p class="loading-note">⏳ ${esc(msg)}</p>`;
}

function errorHtml(err) {
  return `<p class="error-note">取得に失敗しました: ${esc(err && err.message ? err.message : err)}</p>`;
}

function searchValue() {
  return document.getElementById("admin-search").value;
}

// ---- マーケット名解決 -------------------------------------------------

// live モードでは /v1/markets を1回だけ取得。enc モードは meta.marketMap を使う。
async function marketsMap() {
  if (MARKETS) return MARKETS;
  try {
    const d = await apiGet("/v1/markets");
    const map = {};
    for (const m of d?.markets ?? []) {
      map[m.market_id] = m.base_asset_symbol ?? m.display_name ?? String(m.market_id);
    }
    MARKETS = map;
  } catch {
    MARKETS = {}; // 取得失敗時は market_id をそのまま表示
  }
  return MARKETS;
}

function marketLabel(marketId, fallbackName) {
  if (fallbackName) return fallbackName;
  if (marketId == null) return "—";
  return MARKETS?.[marketId] ?? MARKETS?.[String(marketId)] ?? `ID:${marketId}`;
}

// ---- 大会期間 ---------------------------------------------------------

function competitionRangeNs() {
  const meta = COMP_META ?? {};
  const startMs = meta.competitionStartISO ? Date.parse(meta.competitionStartISO) : null;
  const endMs = meta.competitionEndISO ? Date.parse(meta.competitionEndISO) : null;
  return {
    startNs: startMs != null ? startMs * 1e6 : null,
    endNs: endMs != null ? endMs * 1e6 : null,
    startMs, endMs,
  };
}

function inCompetitionPeriod(ms) {
  const { startMs, endMs } = competitionRangeNs();
  if (ms == null || startMs == null || endMs == null) return true;
  return ms >= startMs && ms < endMs;
}

// ---- 起動（復号後 / ライブ認証後に共通で呼ぶ） ------------------------

async function startApp() {
  const statusEl = document.getElementById("roster-status");
  try {
    DB = await fetchJson(`data.json?t=${Date.now()}`);
  } catch (err) {
    statusEl.className = "error-note";
    statusEl.textContent = `data.json の読み込みに失敗しました: ${err.message}`;
    return;
  }
  COMP_META = DB.meta ?? {};
  ROSTER = DB.participants ?? [];

  if (MODE === "enc") {
    MARKETS = STATIC?.meta?.marketMap ?? {};
  } else {
    marketsMap(); // 先行取得（失敗しても market_id 表示にフォールバック）
  }

  updateStatusLine();
  renderRoster("");

  // 各コントロールのリスナーは初回のみ登録（データ更新では再登録しない）
  document.getElementById("admin-search").addEventListener("input", (ev) => {
    rosterPage = 0;
    renderRoster(ev.target.value);
  });
  document.getElementById("roster-sort").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".sort-tab");
    if (!btn) return;
    rosterSort = btn.dataset.sort;
    rosterPage = 0;
    document.querySelectorAll("#roster-sort .sort-tab").forEach((b) =>
      b.classList.toggle("sort-tab--active", b === btn));
    renderRoster(searchValue());
  });
  document.getElementById("refresh-btn").addEventListener("click", refreshData);

  // URLハッシュ #0x... で直接表示（運営間の共有用）
  const hashAddr = location.hash.replace(/^#/, "");
  if (/^0x[0-9a-fA-F]{40}$/.test(hashAddr)) selectAddress(hashAddr);
}

function updateStatusLine() {
  const statusEl = document.getElementById("roster-status");
  const genLine = (MODE === "enc" && STATIC?.meta?.generatedAtUTC)
    ? `調査データ生成: ${fmtJst(Date.parse(STATIC.meta.generatedAtUTC))} JST / `
    : "";
  const modeLine = MODE === "enc" ? "（静的・暗号化データ）" : "（localhost ライブ取得）";
  statusEl.className = "loading-note";
  statusEl.textContent =
    `参加者 ${ROSTER.length} 名 / ${genLine}` +
    `data.json取得: ${fmtJst(Date.parse(COMP_META.fetchedAtUTC))} JST / ` +
    `大会期間: ${fmtJst(Date.parse(COMP_META.competitionStartISO))} 〜 ${fmtJst(Date.parse(COMP_META.competitionEndISO))} JST ${modeLine}`;
}

// データだけ再取得して再描画する（F5と違いパスフレーズ再入力が不要）
async function refreshData() {
  const btn = document.getElementById("refresh-btn");
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "更新中...";
  try {
    if (MODE === "enc") {
      const encObj = await fetchJson(`${ENC_FILE}?t=${Date.now()}`);
      STATIC = await decryptEnc(encObj, PASSPHRASE);
      MARKETS = STATIC?.meta?.marketMap ?? {};
    }
    DB = await fetchJson(`data.json?t=${Date.now()}`);
    COMP_META = DB.meta ?? {};
    ROSTER = DB.participants ?? [];
    updateStatusLine();
    renderRoster(searchValue());
    if (currentAddr) selectAddress(currentAddr); // 表示中の詳細も更新
  } catch (err) {
    const statusEl = document.getElementById("roster-status");
    statusEl.className = "error-note";
    statusEl.textContent = `データ更新に失敗しました: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

// ---- 参加者リスト（検索） ---------------------------------------------

function filterParticipants(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ROSTER;
  return ROSTER.filter((p) =>
    (p.displayName ?? "").toLowerCase().includes(q) ||
    (p.xAccount ?? "").toLowerCase().includes(q) ||
    (p.address ?? "").toLowerCase().includes(q)
  );
}

// ROI順位 / Vol順位でソート（順位なし null は末尾）。default は元の順序。
function sortRoster(list) {
  if (rosterSort === "default") return list;
  const key = rosterSort === "roi" ? "roiRank" : "volumeRank";
  return [...list].sort((a, b) => {
    const va = a[key] == null ? Infinity : Number(a[key]);
    const vb = b[key] == null ? Infinity : Number(b[key]);
    return va - vb;
  });
}

function renderPager(totalPages) {
  const pager = document.getElementById("roster-pager");
  if (totalPages <= 1) { pager.innerHTML = ""; return; }
  pager.innerHTML = Array.from({ length: totalPages }, (_, i) =>
    `<button type="button" class="page-tab${i === rosterPage ? " page-tab--active" : ""}" data-page="${i}">${i + 1}</button>`
  ).join("");
  pager.querySelectorAll(".page-tab").forEach((b) => {
    b.addEventListener("click", () => {
      rosterPage = Number(b.dataset.page);
      renderRoster(searchValue());
    });
  });
}

function renderRoster(query) {
  const body = document.getElementById("roster-body");
  const matches = sortRoster(filterParticipants(query));

  // ページング（10人刻み）。ページ範囲外になったら丸める。
  const totalPages = Math.max(1, Math.ceil(matches.length / ROSTER_PER_PAGE));
  if (rosterPage >= totalPages) rosterPage = totalPages - 1;
  if (rosterPage < 0) rosterPage = 0;
  const pageItems = matches.slice(rosterPage * ROSTER_PER_PAGE, (rosterPage + 1) * ROSTER_PER_PAGE);
  renderPager(totalPages);

  const rows = pageItems.map((p) => {
    const active = currentAddr && p.address?.toLowerCase() === currentAddr ? " roster-row--active" : "";
    const dep = p.minDepositMet
      ? '<span class="badge badge--ok">達成</span>'
      : '<span class="badge badge--warn">未達</span>';
    return `<tr class="roster-row${active}" data-addr="${esc(p.address)}">
      <td>${esc(p.displayName)}</td>
      <td>${p.xAccount ? `@${esc(p.xAccount)}` : "—"}</td>
      <td class="mono">${esc(shortAddr(p.address))}</td>
      <td>${p.roiRank ?? "—"}</td>
      <td>${p.volumeRank ?? "—"}</td>
      <td>${dep}</td>
    </tr>`;
  });

  // アドホック調査（未登録アドレス）は live モードのみ（enc は静的データに無いため不可）
  const q = query.trim();
  if (MODE === "live" && /^0x[0-9a-fA-F]{40}$/.test(q) &&
      !matches.some((p) => p.address?.toLowerCase() === q.toLowerCase())) {
    rows.push(`<tr class="roster-row" data-addr="${esc(q)}">
      <td colspan="6">🔍 未登録アドレスとして調査: <span class="mono">${esc(q)}</span></td>
    </tr>`);
  }

  body.innerHTML = rows.length
    ? rows.join("")
    : '<tr><td colspan="6" class="loading-note">該当する参加者がいません</td></tr>';

  body.querySelectorAll(".roster-row").forEach((tr) => {
    tr.addEventListener("click", () => selectAddress(tr.dataset.addr));
  });
}

// data.json から該当プロフィールを引く（enc エントリの displayName/xAccount をフォールバック）
function profileFor(address, encEntry) {
  const addr = address.toLowerCase();
  const fromDb = (DB?.participants ?? []).find((p) => p.address?.toLowerCase() === addr);
  if (fromDb) return fromDb;
  if (encEntry) return { address, displayName: encEntry.displayName, xAccount: encEntry.xAccount };
  return null;
}

// ---- 参加者選択（モード分岐） -----------------------------------------

function selectAddress(address) {
  currentAddr = address.toLowerCase();
  location.hash = address;
  renderRoster(searchValue());
  document.getElementById("detail-root").style.display = "";
  document.getElementById("card-profile").scrollIntoView({ behavior: "smooth", block: "start" });
  if (MODE === "enc") selectEnc(address);
  else selectLive(address);
}

// enc モード: 復号済み静的データから同期描画
function selectEnc(address) {
  const entry = STATIC?.participants?.[address.toLowerCase()] ?? null;
  const profile = profileFor(address, entry);
  renderProfile(profile, address);

  if (!entry) {
    const msg = '<p class="loading-note">この参加者の調査データが admin_data.enc に含まれていません（生成対象外か、生成時にエラー）。</p>';
    ["summary", "transfers", "positions", "trades", "leaderboard"].forEach((s) => setContent(`${s}-content`, msg));
    return;
  }

  // 各セクションは取得失敗時に <key>Error（文字列）が入る（バックエンド仕様）
  if (entry.summaryError) {
    setContent("summary-content", errorHtml(entry.summaryError));
  } else {
    renderSummary(entry.summary ?? {}, profile, {
      periodDeposits: entry.periodDeposits, periodWithdrawals: entry.periodWithdrawals,
    });
  }

  if (entry.transfersError) {
    setContent("transfers-content", errorHtml(entry.transfersError));
  } else {
    renderTransfers(entry.transfers ?? [], {
      periodDeposits: entry.periodDeposits, periodWithdrawals: entry.periodWithdrawals, capped: false,
    }, false);
  }

  // positions は portfolio/details 由来（summaryError なら合わせて取得失敗扱い）
  if (Array.isArray(entry.positions)) {
    renderPositions(entry.positions.filter((p) => Number(p.size) !== 0));
  } else if (entry.summaryError) {
    setContent("positions-content", errorHtml(entry.summaryError));
  } else {
    setContent("positions-content", '<p class="loading-note">現在オープン中のポジションはありません。</p>');
  }

  if (entry.tradesError) {
    setContent("trades-content", errorHtml(entry.tradesError));
  } else {
    renderTrades({
      recent: entry.recentTrades ?? [], volume: entry.tradeVolume,
      count: entry.tradeCount, liq: entry.liqCount, capped: entry.tradePagesCapped,
    });
  }

  if (entry.leaderboardMeError) {
    setContent("leaderboard-content", errorHtml(entry.leaderboardMeError));
  } else {
    renderLeaderboard(entry.leaderboardMe);
  }
}

// live モード: RISEx API からリアルタイム取得（各セクション独立）
function selectLive(address) {
  const token = ++loadSeq;
  const participant = profileFor(address, null);

  renderProfile(participant, address);
  setContent("summary-content", loadingHtml("portfolio / transfer-history を取得中..."));
  setContent("transfers-content", loadingHtml("transfer-history を取得中..."));
  setContent("positions-content", loadingHtml("positions を取得中..."));
  setContent("trades-content", loadingHtml("trade-history を取得中...（取引が多い場合は時間がかかります）"));
  setContent("leaderboard-content", loadingHtml("leaderboard/me を取得中..."));

  // portfolio/details はサマリとポジションで共用（positions も同梱されている）
  const portfolioPromise = apiGet("/v1/portfolio/details", { account: address });
  const transfersPromise = loadTransfersLive(address, token);
  loadSummaryLive(portfolioPromise, participant, transfersPromise, token);
  loadPositionsLive(portfolioPromise, token);
  loadTradesLive(address, token);
  loadLeaderboardMeLive(address, token);
}

// ---- 参加者情報 -------------------------------------------------------

function renderProfile(p, address) {
  if (!p) {
    setContent("profile-content", `
      <p class="loading-note">data.json に未登録のアドレスです（エントリー外の可能性）。</p>
      <div class="kv-grid">
        <div class="kv-item"><div class="kv-label">アドレス</div><div class="kv-value">${riseAddrLink(address)}</div></div>
      </div>`);
    return;
  }
  // discord フィールドは将来エントリーフォーム連携で追加予定（現状は未連携表示）
  const discord = pick(p, ["discord", "discordId", "discordUsername"]);
  const kv = [
    ["参加者名", esc(p.displayName ?? "—")],
    ["Xアカウント", p.xAccount
      ? `<a class="addr-link" href="https://x.com/${esc(p.xAccount)}" target="_blank" rel="noopener">@${esc(p.xAccount)}</a>`
      : "—"],
    ["Discord", discord ? esc(discord) : '<span class="badge badge--dim">未連携</span>'],
    ["アドレス", riseAddrLink(p.address ?? address)],
    ["入金条件（期間中200 USDC+）", p.minDepositMet
      ? '<span class="badge badge--ok">達成</span>'
      : '<span class="badge badge--warn">未達</span>'],
    ["公式レジスト", p.officialRegistered
      ? '<span class="badge badge--ok">登録済み</span>'
      : '<span class="badge badge--ng">未登録</span>'],
    ["ROI順位", p.roiRank != null ? `${p.roiRank}位 ${p.roiQualified ? "" : "（対象外）"}` : "—"],
    ["Volume順位", p.volumeRank != null ? `${p.volumeRank}位 ${p.volumeQualified ? "" : "（対象外）"}` : "—"],
    ["現在のリワード見込み", fmtUsd(p.totalRewardUsd, 0)],
  ];
  setContent("profile-content",
    `<div class="kv-grid">${kv.map(([l, v]) =>
      `<div class="kv-item"><div class="kv-label">${l}</div><div class="kv-value">${v}</div></div>`).join("")}</div>` +
    rawDetails("data.json エントリー", p));
}

// ---- 資産サマリ -------------------------------------------------------

function renderSummary(s, participant, { periodDeposits, periodWithdrawals }) {
  s = s ?? {};
  const endEquity = Number(pick(s, ["total_account_value"]));

  // data.json selfCheck と同じ式: PnL = (endEquity + withdrawals) - qualifyingCapital
  const qc = participant?.qualifyingCapital;
  let pnlHtml = "—";
  let roiHtml = "—";
  if (qc != null && isFinite(endEquity) && periodWithdrawals != null) {
    const pnl = (endEquity + Number(periodWithdrawals)) - qc;
    pnlHtml = `<span class="${signClass(pnl)}">${fmtUsd(pnl)}</span>`;
    if (qc > 0) {
      const roi = (pnl / qc) * 100;
      roiHtml = `<span class="${signClass(roi)}">${fmtNum(roi)}%</span>`;
    }
  }

  const kv = [
    ["現在の総資産（endEquity）", fmtUsd(endEquity)],
    ["USDC残高", fmtUsd(pick(s, ["usdc_balance"]))],
    ["余剰証拠金", fmtUsd(pick(s, ["free_collateral"]))],
    ["証拠金使用率", fmtRatioPercent(pick(s, ["margin_usage"]))],
    ["アカウントレバレッジ", pick(s, ["account_leverage"]) != null ? fmtNum(pick(s, ["account_leverage"])) + "x" : "—"],
    ["建玉総額", fmtUsd(pick(s, ["total_notional"]))],
    ["未実現PnL合計", `<span class="${signClass(s.total_unrealized_pnl)}">${fmtUsd(s.total_unrealized_pnl)}</span>`],
    ["実現PnL", `<span class="${signClass(s.realized_pnl)}">${fmtUsd(s.realized_pnl)}</span>`],
    ["証拠金健全度", fmtRatioPercent(s.margin_health)],
    ["リスクレベル", s.risk_level
      ? (s.risk_level === "NORMAL"
        ? `<span class="badge badge--ok">${esc(s.risk_level)}</span>`
        : `<span class="badge badge--warn">${esc(s.risk_level)}</span>`)
      : "—"],
    ["清算中", s.in_liquidation
      ? '<span class="badge badge--ng">清算中</span>'
      : '<span class="badge badge--ok">なし</span>'],
    ["期間中の入金合計", periodDeposits != null ? fmtUsd(periodDeposits) : "—"],
    ["期間中の出金合計", periodWithdrawals != null ? fmtUsd(periodWithdrawals) : "—"],
    ["Qualifying Capital", qc != null ? fmtUsd(qc) : "—（未登録）"],
    ["PnL（式: endEquity+出金−QC）", pnlHtml],
    ["ROI（PnL ÷ QC）", roiHtml],
  ];
  setContent("summary-content",
    `<div class="kv-grid">${kv.map(([l, v]) =>
      `<div class="kv-item"><div class="kv-label">${l}</div><div class="kv-value">${v}</div></div>`).join("")}</div>` +
    rawDetails("portfolio/details summary", s));
}

async function loadSummaryLive(portfolioPromise, participant, transfersPromise, token) {
  try {
    const [portfolio, transfers] = await Promise.all([portfolioPromise, transfersPromise]);
    if (token !== loadSeq) return;
    renderSummary(portfolio?.summary ?? {}, participant, {
      periodDeposits: transfers?.periodDeposits, periodWithdrawals: transfers?.periodWithdrawals,
    });
  } catch (err) {
    if (token === loadSeq) setContent("summary-content", errorHtml(err));
  }
}

// ---- 入出金履歴 -------------------------------------------------------

function renderTransfers(items, { periodDeposits, periodWithdrawals, capped }, live) {
  if (!items.length) {
    setContent("transfers-content", '<p class="loading-note">入出金の記録がありません。</p>');
    return;
  }
  const rows = items.map((it, i) => {
    const ms = toMs(it.block_time);
    const inPeriod = inCompetitionPeriod(ms);
    const isWithdraw = it.type === "WITHDRAW";
    const typeBadge = isWithdraw
      ? '<span class="badge badge--warn">出金</span>'
      : '<span class="badge badge--ok">入金</span>';
    let traceCell;
    if (!isWithdraw) {
      traceCell = "—";
    } else if (live) {
      traceCell = `<span id="wd-trace-${i}" class="loading-note">⏳ 追跡中...</span>`;
    } else {
      // enc モード: 焼き込み済み trace を表示
      traceCell = formatTrace(it.trace, it);
    }
    return `<tr class="${inPeriod ? "" : "row-out-of-period"}">
      <td>${fmtJst(ms)}${inPeriod ? "" : " <span class=\"badge badge--dim\">期間外</span>"}</td>
      <td>${typeBadge}</td>
      <td style="text-align:right;">${fmtUsd(it.amount)}</td>
      <td>${it.transaction_hash ? riseTxLink(it.transaction_hash) : "—"}</td>
      <td class="trace-cell">${traceCell}</td>
    </tr>`;
  });

  setContent("transfers-content", `
    <div class="kv-grid" style="margin-bottom: 14px;">
      <div class="kv-item"><div class="kv-label">期間中の入金合計</div><div class="kv-value">${fmtUsd(periodDeposits)}</div></div>
      <div class="kv-item"><div class="kv-label">期間中の出金合計</div><div class="kv-value">${fmtUsd(periodWithdrawals)}</div></div>
      <div class="kv-item"><div class="kv-label">総レコード数</div><div class="kv-value">${items.length}${capped ? "（上限打ち切り）" : ""}</div></div>
    </div>
    <div class="table-responsive">
      <table class="leaderboard-table">
        <thead><tr>
          <th>日時（JST）</th><th>種別</th><th>金額</th><th>RISE tx</th><th>出金先 / 着金状況</th>
        </tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>`);

  // live モードのみ、出金行を順番にライブ追跡（外部APIへの負荷を抑えるため直列）
  if (live) {
    const token = loadSeq;
    (async () => {
      for (let i = 0; i < items.length; i++) {
        if (token !== loadSeq) return;
        if (items[i].type !== "WITHDRAW" || !items[i].transaction_hash) continue;
        await traceWithdrawal(items[i], `wd-trace-${i}`, token);
      }
    })();
  }
}

// trace オブジェクト → 表示HTML（live計算・enc焼き込みの両方で共用）
// trace 形: { internal?, dstEid, dstChainName?, dstAddress, arriveAmount, fee,
//             status, dstTxHash, arriveTimeMs }
function formatTrace(trace, item) {
  const lzLink = item?.transaction_hash
    ? ` <a class="addr-link" href="https://layerzeroscan.com/tx/${esc(item.transaction_hash)}" target="_blank" rel="noopener" style="font-size:0.72rem;">LZ Scan</a>`
    : "";

  if (!trace) return '<span class="badge badge--dim">未追跡</span>';

  // (b) RISEチェーン内の vault 預け替え（internal フラグ or status "INTERNAL"）
  if (trace.internal || trace.status === "INTERNAL") {
    return `<span class="badge badge--dim">チェーン内移動</span> ${esc(trace.dstChainName ?? "RISE Chain内 (vault預け替え)")}`;
  }

  // 照会自体が失敗（バックエンドのトレース例外）
  if (trace.status === "TRACE_ERROR") {
    return '<span class="badge badge--dim">追跡失敗（再試行待ち）</span>' + lzLink;
  }

  const status = trace.status ?? "UNKNOWN";
  const chain = LZ_EID_CHAINS[Number(trace.dstEid)];
  const chainName = trace.dstChainName ?? chain?.name ?? (trace.dstEid != null ? `EID ${trace.dstEid}` : null);

  // (c) イベント未検出（宛先情報が全く無い）
  if (chainName == null && trace.dstAddress == null && status === "UNKNOWN") {
    return '<span class="badge badge--dim">イベント未検出/不明</span>' + lzLink;
  }

  const dstAddress = trace.dstAddress ? normalizeAddr(trace.dstAddress) : null;
  let html = `→ ${esc(chainName ?? "不明")} / ${dstAddress ? `<span class="mono">${esc(shortAddr(dstAddress))}</span>` : "—"}<br>`;
  if (trace.arriveAmount != null) {
    html += `着金額 ${fmtUsd(trace.arriveAmount)}` +
      (trace.fee != null ? `（手数料 ${fmtNum(trace.fee)} USDC控除後）` : "") + "<br>";
  }

  const arriveMs = trace.arriveTimeMs != null ? toMs(trace.arriveTimeMs) : null;
  if (status === "SUCCEEDED" || status === "DELIVERED") {
    html += `<span class="badge badge--ok">✅ 着金済み</span> ${arriveMs != null ? esc(fmtJst(arriveMs)) : ""}`;
    if (trace.dstTxHash && chain?.txUrl) {
      html += ` <a class="addr-link mono" href="${chain.txUrl}${esc(trace.dstTxHash)}" target="_blank" rel="noopener">着金tx</a>`;
    } else if (trace.dstTxHash) {
      html += ` <span class="mono">${esc(shortAddr(trace.dstTxHash))}</span>`;
    }
  } else if (status === "FAILED" || status === "BLOCKED") {
    html += `<span class="badge badge--ng">⚠ ${esc(status)}</span>`;
  } else if (status === "UNKNOWN") {
    html += `<span class="badge badge--dim">状況不明</span>`;
  } else {
    // 未着金 = ブリッジ中（所要時間は数秒〜数時間とばらつく）
    html += `<span class="badge badge--warn">🔄 ブリッジ中（${esc(status)}）</span>`;
  }
  return html + lzLink;
}

async function loadTransfersLive(address, token) {
  try {
    const items = [];
    let page = 1;
    let capped = false;
    while (true) {
      const d = await apiGet("/v1/account/transfer-history", { account: address, page });
      items.push(...(d?.items ?? []));
      if (!d?.has_next_page) break;
      if (++page > MAX_PAGES) { capped = true; break; }
    }
    if (token !== loadSeq) return null;

    items.sort((a, b) => (toMs(b.block_time) ?? 0) - (toMs(a.block_time) ?? 0));

    // 期間中の合算（total_deposit/total_withdraw はAPIバグで常に0のため自前合算）
    let periodDeposits = 0;
    let periodWithdrawals = 0;
    for (const it of items) {
      const ms = toMs(it.block_time);
      if (!inCompetitionPeriod(ms)) continue;
      const amount = Number(it.amount);
      if (!isFinite(amount)) continue;
      if (it.type === "DEPOSIT") periodDeposits += amount;
      else if (it.type === "WITHDRAW") periodWithdrawals += amount;
    }

    renderTransfers(items, { periodDeposits, periodWithdrawals, capped }, true);
    return { items, periodDeposits, periodWithdrawals };
  } catch (err) {
    if (token === loadSeq) setContent("transfers-content", errorHtml(err));
    return null;
  }
}

// live: 出金tx → Blockscout logs → LayerZero Scan で着金確認し trace を組み立てる
async function traceWithdrawal(item, cellId, token) {
  const setCell = (html) => {
    if (token !== loadSeq) return;
    const el = document.getElementById(cellId);
    if (el) el.innerHTML = html;
  };
  try {
    const logs = await fetchJson(`${EXPLORER_BASE}/api/v2/transactions/${item.transaction_hash}/logs`);
    const decoded = (logs?.items ?? []).map((x) => x.decoded).filter(Boolean);
    const findEvent = (name) => decoded.find((d) =>
      (d.method_call ?? d.method_id ?? "").startsWith(name));
    const param = (d, name) => d?.parameters?.find((p) => p.name === name)?.value;

    const wp = findEvent("WithdrawalProcessed");
    if (!wp) {
      // (b) vault 預け替え: DepositRequested があれば内部移動
      if (findEvent("DepositRequested")) {
        setCell(formatTrace({ internal: true, dstChainName: "RISE Chain内 (vault預け替え)" }, item));
      } else {
        setCell(formatTrace({ status: "UNKNOWN" }, item));
      }
      return;
    }

    const oft = findEvent("OFTSent");
    const evAmount = Number(param(wp, "amount"));
    const evFee = Number(param(wp, "fee"));
    const hasEv = isFinite(evAmount) && evAmount > 0 && isFinite(evFee);
    const trace = {
      dstEid: Number(param(wp, "dstEid")),
      dstAddress: normalizeAddr(param(wp, "dstAddress")),
      arriveAmount: hasEv ? (evAmount - evFee) / 1e6 : Number(item.amount) - WITHDRAW_FEE_USDC,
      fee: hasEv ? evFee / 1e6 : WITHDRAW_FEE_USDC,
      status: "UNKNOWN",
    };

    const guid = param(oft, "guid");
    if (guid) {
      try {
        const lz = await fetchJson(`${LZ_SCAN_BASE}/v1/messages/guid/${guid}`);
        const msg = Array.isArray(lz?.data) ? lz.data[0] : null;
        trace.status = msg?.destination?.status ?? "UNKNOWN";
        trace.dstTxHash = msg?.destination?.tx?.txHash;
        trace.arriveTimeMs = toMs(msg?.destination?.tx?.blockTimestamp ?? msg?.destination?.blockTimestamp);
      } catch { /* LZ照会失敗は status UNKNOWN のまま */ }
    }
    setCell(formatTrace(trace, item));
  } catch (err) {
    setCell(`<span class="badge badge--dim">追跡失敗</span> <span class="loading-note">${esc(err.message)}</span>`);
  }
}

// ---- ポジション -------------------------------------------------------

// /v1/positions は1e18固定小数の生値のため使わず、portfolio/details 同梱の
// positions（人間単位・mark_price / unrealized_pnl / liquidation_price 込み）を使う
function renderPositions(positions) {
  if (!positions.length) {
    setContent("positions-content", '<p class="loading-note">現在オープン中のポジションはありません。</p>');
    return;
  }
  const rows = positions.map((p) => {
    // side は数値（0=LONG を実測確認済み。それ以外はSHORT扱い、詳細は生JSON参照）
    const side = p.side != null ? (Number(p.side) === 0 ? "LONG" : "SHORT") : "—";
    return `<tr>
      <td>${esc(marketLabel(p.market_id, p.market_name))}</td>
      <td>${esc(side)}</td>
      <td style="text-align:right;">${fmtNum(p.size, 6)}</td>
      <td style="text-align:right;">${fmtUsd(p.avg_entry_price)}</td>
      <td style="text-align:right;">${fmtUsd(p.mark_price)}</td>
      <td style="text-align:right;" class="${signClass(p.unrealized_pnl)}">${fmtUsd(p.unrealized_pnl)}</td>
      <td style="text-align:right;">${fmtUsd(p.liquidation_price)}</td>
      <td style="text-align:right;">${fmtNum(p.leverage)}x</td>
    </tr>`;
  });
  setContent("positions-content", `
    <div class="table-responsive">
      <table class="leaderboard-table">
        <thead><tr>
          <th>Market</th><th>Side</th><th>Size</th><th>Entry</th><th>Mark</th><th>uPnL</th><th>清算価格</th><th>Leverage</th>
        </tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>` + rawDetails("オープン中ポジション", positions));
}

async function loadPositionsLive(portfolioPromise, token) {
  try {
    const data = await portfolioPromise;
    if (token !== loadSeq) return;
    renderPositions((data?.positions ?? []).filter((p) => Number(p.size) !== 0));
  } catch (err) {
    if (token === loadSeq) setContent("positions-content", errorHtml(err));
  }
}

// ---- 取引履歴 ---------------------------------------------------------

function tradeMs(t) {
  return toMs(pick(t, ["time", "timestamp", "created_at"]));
}

function renderTrades({ recent, volume, count, liq, capped }) {
  const sorted = [...(recent ?? [])].sort((a, b) => (tradeMs(b) ?? 0) - (tradeMs(a) ?? 0));
  const shown = sorted.slice(0, RECENT_TRADES_SHOWN);
  const hasTrades = (count ?? shown.length) > 0;

  const rows = shown.map((t) => {
    const notional = Number(t.price) * Number(t.size);
    const txHash = t.blockchain_data?.tx_hash ?? t.tx_hash;
    return `<tr>
      <td>${fmtJst(tradeMs(t))}</td>
      <td>${esc(marketLabel(t.market_id, t.market))}</td>
      <td>${esc(t.side ?? "—")}</td>
      <td style="text-align:right;">${fmtNum(t.price, 6)}</td>
      <td style="text-align:right;">${fmtNum(t.size, 6)}</td>
      <td style="text-align:right;">${fmtUsd(notional)}</td>
      <td style="text-align:right;" class="${signClass(t.realized_pnl)}">${fmtUsd(t.realized_pnl)}</td>
      <td>${txHash ? riseTxLink(txHash) : "—"}</td>
      <td>${t.is_liquidation ? '<span class="badge badge--ng">清算</span>' : ""}</td>
    </tr>`;
  });

  setContent("trades-content", `
    <div class="kv-grid" style="margin-bottom: 14px;">
      <div class="kv-item"><div class="kv-label">期間中出来高（清算除外）</div><div class="kv-value">${fmtUsd(volume, 0)}</div></div>
      <div class="kv-item"><div class="kv-label">約定件数</div><div class="kv-value">${(count ?? shown.length).toLocaleString()}${capped ? "（上限打ち切り）" : ""}</div></div>
      <div class="kv-item"><div class="kv-label">うち清算約定</div><div class="kv-value">${(liq ?? 0).toLocaleString()}</div></div>
    </div>
    ${hasTrades ? `
    <p class="section-sub">直近 ${shown.length} 件を表示</p>
    <div class="table-responsive">
      <table class="leaderboard-table">
        <thead><tr>
          <th>日時（JST）</th><th>Market</th><th>Side</th><th>Price</th><th>Size</th><th>金額</th><th>実現PnL</th><th>tx</th><th></th>
        </tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>` : '<p class="loading-note">大会期間中の取引はありません。</p>'}
    ${shown.length ? rawDetails(`直近${shown.length}件`, shown) : ""}`);
}

async function loadTradesLive(address, token) {
  try {
    const { startNs, endNs } = competitionRangeNs();
    const trades = [];
    let page = 1;
    let capped = false;
    while (true) {
      const params = { account: address, page, limit: 1000 };
      if (startNs != null) params.start_time = Math.round(startNs);
      if (endNs != null) params.end_time = Math.round(endNs);
      const d = await apiGet("/v1/trade-history", params);
      trades.push(...(d?.trades ?? []));
      if (!d?.has_next_page) break;
      if (++page > MAX_PAGES) { capped = true; break; }
    }
    await marketsMap();
    if (token !== loadSeq) return;

    // 期間中出来高（price × size、清算約定は INCLUDE_LIQUIDATIONS=false に合わせ除外）
    let volume = 0;
    let liq = 0;
    for (const t of trades) {
      if (t.is_liquidation) { liq++; if (!INCLUDE_LIQUIDATIONS) continue; }
      const v = Number(t.price) * Number(t.size);
      if (isFinite(v)) volume += v;
    }
    renderTrades({ recent: trades, volume, count: trades.length, liq, capped });
  } catch (err) {
    if (token === loadSeq) setContent("trades-content", errorHtml(err));
  }
}

// ---- 公式リーダーボード -----------------------------------------------

function renderLeaderboard(data) {
  if (data == null) {
    setContent("leaderboard-content", '<p class="loading-note">リーダーボード情報がありません。</p>');
    return;
  }
  setContent("leaderboard-content",
    '<p class="section-sub">公式API（slug: bbdao）の本人ステータスです。</p>' +
    rawDetails("leaderboard/me", data));
}

async function loadLeaderboardMeLive(address, token) {
  try {
    const data = await apiGet(`/v1/competitions/${COMPETITION_SLUG}/leaderboard/me`, { wallet: address });
    if (token !== loadSeq) return;
    renderLeaderboard(data);
  } catch (err) {
    if (token === loadSeq) setContent("leaderboard-content", errorHtml(err));
  }
}

// ---- 復号（enc モード） -----------------------------------------------
// admin_data.enc 形式: {v,kdf,iter,salt(b64),iv(b64:12B),ct(b64:暗号文+16B GCMタグ)}
// 平文は UTF-8 の JSON 文字列、AAD 無し、PBKDF2-HMAC-SHA256 → AES-256-GCM。

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function decryptEnc(encObj, passphrase) {
  const salt = b64ToBytes(encObj.salt);
  const iv = b64ToBytes(encObj.iv);
  const ct = b64ToBytes(encObj.ct);
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: encObj.iter ?? 600000, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const ptBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(ptBuf));
}

// ---- 認証／ロック -----------------------------------------------------
// live モード: 簡易ユーザー名/パスワード（"user:pass" の SHA-256 照合）
// enc モード : 復号パスフレーズ（復号成功＝認証成功。ハッシュ照合は行わない）

const LOCK_HASH = "051a76ca995eedd7c1c784cb3ed7231f88172aedea088f01d558b212a4d756f7";
const LOCK_STORAGE_KEY = "risexAdminUnlocked";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unlockAndStart() {
  document.getElementById("lock-overlay").style.display = "none";
  document.getElementById("admin-container").style.display = "";
  startApp();
}

function showLockError(msg) {
  const el = document.getElementById("lock-error");
  el.textContent = msg;
  el.style.display = "";
}

function setupLock() {
  const form = document.getElementById("lock-form");
  const userEl = document.getElementById("lock-user");
  const passEl = document.getElementById("lock-pass");

  if (MODE === "enc") {
    // パスフレーズ1本の入力に切り替える
    userEl.style.display = "none";
    passEl.placeholder = "復号パスフレーズ";
    const note = document.querySelector(".lock-note");
    if (note) note.textContent = "運営用の内部ページです。データの復号パスフレーズを入力してください。";
  } else {
    // live: 同一タブ内は再入力不要
    let stored = null;
    try { stored = sessionStorage.getItem(LOCK_STORAGE_KEY); } catch { /* 私的モード等 */ }
    if (stored === LOCK_HASH) { unlockAndStart(); return; }
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    document.getElementById("lock-error").style.display = "none";
    if (!crypto?.subtle) {
      showLockError("この環境では認証を利用できません。HTTPS（またはlocalhost）で開いてください。");
      return;
    }

    if (MODE === "enc") {
      const btn = form.querySelector("button");
      const orig = btn.textContent;
      btn.disabled = true; btn.textContent = "復号中...";
      try {
        const encObj = await fetchJson(`${ENC_FILE}?t=${Date.now()}`);
        STATIC = await decryptEnc(encObj, passEl.value);
        PASSPHRASE = passEl.value; // データ更新ボタンで再利用（メモリのみ）
        unlockAndStart();
      } catch (err) {
        // 復号失敗（パスフレーズ違い）とファイル取得失敗を区別
        const isFetch = /HTTP \d+/.test(err.message || "");
        showLockError(isFetch
          ? `調査データ(${ENC_FILE})を取得できませんでした: ${err.message}`
          : "パスフレーズが違うか、データを復号できませんでした。");
        passEl.value = ""; passEl.focus();
      } finally {
        btn.disabled = false; btn.textContent = orig;
      }
    } else {
      const hash = await sha256Hex(`${userEl.value.trim()}:${passEl.value}`);
      if (hash === LOCK_HASH) {
        try { sessionStorage.setItem(LOCK_STORAGE_KEY, hash); } catch { /* 保存不可でも続行 */ }
        unlockAndStart();
      } else {
        showLockError("ユーザー名またはパスワードが違います。");
        passEl.value = ""; passEl.focus();
      }
    }
  });

  (MODE === "enc" ? passEl : userEl).focus();
}

// ---- 起動 -------------------------------------------------------------

setupLock();
