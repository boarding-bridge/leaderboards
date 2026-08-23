// 運営用 参加者調査ページ
// data.json の参加者リストからアドレスを解決し、RISEx 公開API・Blockscout・
// LayerZero Scan をブラウザから直接照会する（サーバー・秘密情報なし）。

const API_BASE = "https://api.rise.trade";
const EXPLORER_BASE = "https://explorer.risechain.com";
const LZ_SCAN_BASE = "https://scan.layerzero-api.com";
const COMPETITION_SLUG = "bbdao";

// 出来高の合算条件（risex-backend の INCLUDE_LIQUIDATIONS=false に合わせる）
const INCLUDE_LIQUIDATIONS = false;
const WITHDRAW_FEE_USDC = 1; // イベントから fee が取れない場合のフォールバック値
const RECENT_TRADES_SHOWN = 50;
const MAX_PAGES = 30; // ページング暴走防止（1ページ1000件 × 30）

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

let DB = null;          // 読み込んだ data.json
let currentAddr = null; // 表示中のアドレス（小文字）
let loadSeq = 0;        // 古い非同期レスポンスの描画を防ぐトークン
let MARKETS = null;     // market_id → シンボルのキャッシュ（/v1/markets）

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

// RISEx API: {data, request_id} 形式。"error" キーがあれば失敗扱い
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

// ---- マーケット名解決 -------------------------------------------------

// trade-history 等は market_id しか持たないため、/v1/markets を1回だけ取得して変換する
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
  return MARKETS?.[marketId] ?? `ID:${marketId}`;
}

// ---- 大会期間 ---------------------------------------------------------

function competitionRangeNs() {
  const meta = DB?.meta ?? {};
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

// ---- 参加者リスト（検索） ---------------------------------------------

async function init() {
  const statusEl = document.getElementById("roster-status");
  try {
    DB = await fetchJson(`data.json?t=${Date.now()}`);
  } catch (err) {
    statusEl.className = "error-note";
    statusEl.textContent = `data.json の読み込みに失敗しました: ${err.message}（ローカルではHTTPサーバー経由で開いてください）`;
    return;
  }
  const meta = DB.meta ?? {};
  statusEl.textContent =
    `参加者 ${DB.participants?.length ?? 0} 名 / データ取得: ${fmtJst(Date.parse(meta.fetchedAtUTC))} JST` +
    ` / 大会期間: ${fmtJst(Date.parse(meta.competitionStartISO))} 〜 ${fmtJst(Date.parse(meta.competitionEndISO))} JST`;

  renderRoster("");
  marketsMap(); // マーケット名マップを先行取得（失敗しても各表示はIDにフォールバック）
  document.getElementById("admin-search").addEventListener("input", (ev) => {
    renderRoster(ev.target.value);
  });

  // URLハッシュ #0x... で直接表示（運営間の共有用）
  const hashAddr = location.hash.replace(/^#/, "");
  if (/^0x[0-9a-fA-F]{40}$/.test(hashAddr)) selectAddress(hashAddr);
}

function filterParticipants(query) {
  const q = query.trim().toLowerCase();
  const list = DB?.participants ?? [];
  if (!q) return list;
  return list.filter((p) =>
    (p.displayName ?? "").toLowerCase().includes(q) ||
    (p.xAccount ?? "").toLowerCase().includes(q) ||
    (p.address ?? "").toLowerCase().includes(q)
  );
}

function renderRoster(query) {
  const body = document.getElementById("roster-body");
  const matches = filterParticipants(query);
  const rows = matches.map((p) => {
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

  // 0x アドレス全文が入力されたら、未登録アドレスでも調査できる行を出す
  const q = query.trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(q) &&
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

// ---- 参加者選択・詳細読み込み -----------------------------------------

function selectAddress(address) {
  currentAddr = address.toLowerCase();
  const token = ++loadSeq;
  location.hash = address;
  renderRoster(document.getElementById("admin-search").value);

  const participant = (DB?.participants ?? [])
    .find((p) => p.address?.toLowerCase() === currentAddr) ?? null;

  document.getElementById("detail-root").style.display = "";
  renderProfile(participant, address);
  setContent("summary-content", loadingHtml("portfolio / transfer-history を取得中..."));
  setContent("transfers-content", loadingHtml("transfer-history を取得中..."));
  setContent("positions-content", loadingHtml("positions を取得中..."));
  setContent("trades-content", loadingHtml("trade-history を取得中...（取引が多い場合は時間がかかります）"));
  setContent("leaderboard-content", loadingHtml("leaderboard/me を取得中..."));
  document.getElementById("card-profile").scrollIntoView({ behavior: "smooth", block: "start" });

  // 各セクションは独立に取得・描画する（1つの失敗が他を巻き込まない）
  // portfolio/details はサマリとポジションで共用（positions も同梱されている）
  const portfolioPromise = apiGet("/v1/portfolio/details", { account: address });
  const transfersPromise = loadTransfers(address, token);
  loadSummary(portfolioPromise, participant, transfersPromise, token);
  loadPositions(portfolioPromise, token);
  loadTrades(address, token);
  loadLeaderboardMe(address, token);
}

// ---- 参加者情報 -------------------------------------------------------

function renderProfile(p, address) {
  if (!p) {
    setContent("profile-content", `
      <p class="loading-note">data.json に未登録のアドレスです（エントリー外の可能性）。API情報のみ表示します。</p>
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
    ["アドレス", riseAddrLink(p.address)],
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

async function loadSummary(portfolioPromise, participant, transfersPromise, token) {
  try {
    const [portfolio, transfers] = await Promise.all([portfolioPromise, transfersPromise]);
    if (token !== loadSeq) return;

    const s = portfolio?.summary ?? {};
    const endEquity = Number(pick(s, ["total_account_value"]));
    const periodDeposits = transfers?.periodDeposits ?? null;
    const periodWithdrawals = transfers?.periodWithdrawals ?? null;

    // data.json selfCheck と同じ式: PnL = (endEquity + withdrawals) - qualifyingCapital
    const qc = participant?.qualifyingCapital;
    let pnlHtml = "—";
    let roiHtml = "—";
    if (qc != null && isFinite(endEquity) && periodWithdrawals != null) {
      const pnl = (endEquity + periodWithdrawals) - qc;
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
      `<p class="section-sub" style="margin-top:10px;">※ data.json 側の集計値（selfCheck）はスナップショット時点、ここはリアルタイム値です。</p>` +
      rawDetails("portfolio/details", portfolio));
  } catch (err) {
    if (token !== loadSeq) return;
    setContent("summary-content", errorHtml(err));
  }
}

// ---- 入出金履歴 -------------------------------------------------------

async function loadTransfers(address, token) {
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

    renderTransfers(items, { periodDeposits, periodWithdrawals, capped }, token);
    return { items, periodDeposits, periodWithdrawals };
  } catch (err) {
    if (token === loadSeq) setContent("transfers-content", errorHtml(err));
    return null;
  }
}

function renderTransfers(items, { periodDeposits, periodWithdrawals, capped }, token) {
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
    const trace = isWithdraw
      ? `<span id="wd-trace-${i}" class="loading-note">⏳ 追跡中...</span>`
      : "—";
    return `<tr class="${inPeriod ? "" : "row-out-of-period"}">
      <td>${fmtJst(ms)}${inPeriod ? "" : " <span class=\"badge badge--dim\">期間外</span>"}</td>
      <td>${typeBadge}</td>
      <td style="text-align:right;">${fmtUsd(it.amount)}</td>
      <td>${it.transaction_hash ? riseTxLink(it.transaction_hash) : "—"}</td>
      <td class="trace-cell">${trace}</td>
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

  // 出金行を順番にトレース（explorer / LayerZero Scan への負荷を抑えるため直列）
  (async () => {
    for (let i = 0; i < items.length; i++) {
      if (token !== loadSeq) return;
      if (items[i].type !== "WITHDRAW" || !items[i].transaction_hash) continue;
      await traceWithdrawal(items[i], `wd-trace-${i}`, token);
    }
  })();
}

// 出金tx → WithdrawalProcessed/OFTSent イベント → LayerZero Scan で着金確認
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
    const oft = findEvent("OFTSent");
    if (!wp) { setCell('<span class="badge badge--dim">イベント未検出</span>'); return; }

    const dstAddress = normalizeAddr(param(wp, "dstAddress"));
    const dstEid = Number(param(wp, "dstEid"));
    const chain = LZ_EID_CHAINS[dstEid];
    const chainName = chain?.name ?? (isFinite(dstEid) ? `EID ${dstEid}` : "不明");

    // イベントの amount / fee は USDC 6 decimals の生値。取れなければ一律1 USDCで概算
    const evAmount = Number(param(wp, "amount"));
    const evFee = Number(param(wp, "fee"));
    const hasEventAmounts = isFinite(evAmount) && evAmount > 0 && isFinite(evFee);
    const arriveAmount = hasEventAmounts
      ? (evAmount - evFee) / 1e6
      : Number(item.amount) - WITHDRAW_FEE_USDC;
    const feeUsdc = hasEventAmounts ? evFee / 1e6 : WITHDRAW_FEE_USDC;

    let html = `→ ${chainName} / ${dstAddress ? `<span class="mono">${esc(shortAddr(dstAddress))}</span>` : "—"}<br>` +
      `着金額 ${fmtUsd(arriveAmount)}（手数料 ${fmtNum(feeUsdc)} USDC控除後）<br>`;

    const guid = param(oft, "guid");
    if (!guid) {
      setCell(html + '<span class="badge badge--dim">GUID未検出（LZ照会不可）</span>');
      return;
    }

    const lz = await fetchJson(`${LZ_SCAN_BASE}/v1/messages/guid/${guid}`);
    const msg = Array.isArray(lz?.data) ? lz.data[0] : null;
    const status = msg?.destination?.status ?? "UNKNOWN";
    const dstTxHash = msg?.destination?.tx?.txHash;
    const arriveMs = toMs(msg?.destination?.tx?.blockTimestamp ?? msg?.destination?.blockTimestamp);

    if (status === "SUCCEEDED" || status === "DELIVERED") {
      html += `<span class="badge badge--ok">✅ 着金済み</span> ${arriveMs != null ? esc(fmtJst(arriveMs)) : ""}`;
      if (dstTxHash && chain?.txUrl) {
        html += ` <a class="addr-link mono" href="${chain.txUrl}${esc(dstTxHash)}" target="_blank" rel="noopener">着金tx</a>`;
      } else if (dstTxHash) {
        html += ` <span class="mono">${esc(shortAddr(dstTxHash))}</span>`;
      }
    } else if (status === "FAILED" || status === "BLOCKED") {
      html += `<span class="badge badge--ng">⚠ ${esc(status)}</span>`;
    } else {
      // 未着金 = ブリッジ中（所要時間は数秒〜数時間とばらつく）
      html += `<span class="badge badge--warn">🔄 ブリッジ中（${esc(status)}）</span>`;
    }
    html += ` <a class="addr-link" href="https://layerzeroscan.com/tx/${esc(item.transaction_hash)}" target="_blank" rel="noopener" style="font-size:0.72rem;">LZ Scan</a>`;
    setCell(html);
  } catch (err) {
    setCell(`<span class="badge badge--dim">追跡失敗</span> <span class="loading-note">${esc(err.message)}</span>`);
  }
}

// ---- ポジション -------------------------------------------------------

// /v1/positions は1e18固定小数の生値のため使わず、portfolio/details 同梱の
// positions（人間単位・mark_price / unrealized_pnl / liquidation_price 込み）を使う
async function loadPositions(portfolioPromise, token) {
  try {
    const data = await portfolioPromise;
    if (token !== loadSeq) return;
    // 全マーケット分（フラット含む）が返るため、建玉があるものだけに絞る
    const positions = (data?.positions ?? []).filter((p) => Number(p.size) !== 0);
    if (!positions.length) {
      setContent("positions-content",
        '<p class="loading-note">現在オープン中のポジションはありません。</p>');
      return;
    }
    const rows = positions.map((p) => {
      // side は数値（0=LONG を実測確認済み。それ以外はSHORT扱い、詳細は生JSON参照）
      const side = p.side != null
        ? (Number(p.side) === 0 ? "LONG" : "SHORT")
        : "—";
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
      </div>` + rawDetails("オープン中ポジション（portfolio/details より）", positions));
  } catch (err) {
    if (token === loadSeq) setContent("positions-content", errorHtml(err));
  }
}

// ---- 取引履歴 ---------------------------------------------------------

async function loadTrades(address, token) {
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
    await marketsMap(); // market_id → シンボル変換用
    if (token !== loadSeq) return;

    // 期間中出来高（price × size、清算約定は INCLUDE_LIQUIDATIONS=false に合わせ除外）
    let volume = 0;
    let liqCount = 0;
    for (const t of trades) {
      if (t.is_liquidation) { liqCount++; if (!INCLUDE_LIQUIDATIONS) continue; }
      const v = Number(t.price) * Number(t.size);
      if (isFinite(v)) volume += v;
    }

    // time はナノ秒string（timestamp/block_time は存在しない、実スキーマ確認済み）
    const tradeMs = (t) => toMs(pick(t, ["time", "timestamp", "created_at"]));
    const sorted = [...trades].sort((a, b) => (tradeMs(b) ?? 0) - (tradeMs(a) ?? 0));
    const recent = sorted.slice(0, RECENT_TRADES_SHOWN);

    const rows = recent.map((t) => {
      const notional = Number(t.price) * Number(t.size);
      const txHash = t.blockchain_data?.tx_hash;
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
        <div class="kv-item"><div class="kv-label">約定件数</div><div class="kv-value">${trades.length.toLocaleString()}${capped ? "（上限打ち切り）" : ""}</div></div>
        <div class="kv-item"><div class="kv-label">うち清算約定</div><div class="kv-value">${liqCount.toLocaleString()}</div></div>
      </div>
      ${trades.length ? `
      <p class="section-sub">直近 ${recent.length} 件を表示</p>
      <div class="table-responsive">
        <table class="leaderboard-table">
          <thead><tr>
            <th>日時（JST）</th><th>Market</th><th>Side</th><th>Price</th><th>Size</th><th>金額</th><th>実現PnL</th><th>tx</th><th></th>
          </tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>` : '<p class="loading-note">大会期間中の取引はありません。</p>'}
      ${recent.length ? rawDetails(`直近${recent.length}件`, recent) : ""}`);
  } catch (err) {
    if (token === loadSeq) setContent("trades-content", errorHtml(err));
  }
}

// ---- 公式リーダーボード -----------------------------------------------

async function loadLeaderboardMe(address, token) {
  try {
    const data = await apiGet(`/v1/competitions/${COMPETITION_SLUG}/leaderboard/me`, { wallet: address });
    if (token !== loadSeq) return;
    setContent("leaderboard-content",
      '<p class="section-sub">公式API（slug: bbdao）の本人ステータスです。</p>' +
      rawDetails("leaderboard/me", data));
  } catch (err) {
    if (token === loadSeq) setContent("leaderboard-content", errorHtml(err));
  }
}

// ---- 簡易ログインロック -----------------------------------------------
// クライアントサイドのみの抑止用ロック（ソース閲覧で突破可能）。
// 認証情報は平文で置かず、"user:pass" の SHA-256 ハッシュで照合する。

const LOCK_HASH = "051a76ca995eedd7c1c784cb3ed7231f88172aedea088f01d558b212a4d756f7";
const LOCK_STORAGE_KEY = "risexAdminUnlocked";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function unlockAndStart() {
  document.getElementById("lock-overlay").style.display = "none";
  document.getElementById("admin-container").style.display = "";
  init();
}

function setupLock() {
  // 同一タブ内は再入力不要（タブを閉じるとロックに戻る）
  let stored = null;
  try { stored = sessionStorage.getItem(LOCK_STORAGE_KEY); } catch { /* 私的モード等では毎回入力 */ }
  if (stored === LOCK_HASH) {
    unlockAndStart();
    return;
  }

  const form = document.getElementById("lock-form");
  const errorEl = document.getElementById("lock-error");
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    errorEl.style.display = "none";
    if (!crypto?.subtle) {
      errorEl.textContent = "この環境では認証を利用できません。HTTPS（またはlocalhost）で開いてください。";
      errorEl.style.display = "";
      return;
    }
    const user = document.getElementById("lock-user").value.trim();
    const pass = document.getElementById("lock-pass").value;
    const hash = await sha256Hex(`${user}:${pass}`);
    if (hash === LOCK_HASH) {
      try { sessionStorage.setItem(LOCK_STORAGE_KEY, hash); } catch { /* 保存不可でも続行 */ }
      unlockAndStart();
    } else {
      errorEl.textContent = "ユーザー名またはパスワードが違います。";
      errorEl.style.display = "";
      document.getElementById("lock-pass").value = "";
      document.getElementById("lock-pass").focus();
    }
  });
  document.getElementById("lock-user").focus();
}

// ---- 起動 -------------------------------------------------------------

setupLock();
