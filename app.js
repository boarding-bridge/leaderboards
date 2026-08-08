// リワードテーブルデータ（RISEx提案書 v2 Revised 準拠・4ティア）
// 両部門（ROI / Volume）とも同一の賞金構成のため prizes を共用する
const REWARD_TIERS = [
  {
    label: "Total Volume ≥ $75M",
    threshold: 75_000_000,
    prizes: [1500, 1000, 700, 400, 400, 250, 250, 250, 250, 250, 150, 150, 150, 150, 150],
  },
  {
    label: "$50M 〜 $75M",
    threshold: 50_000_000,
    prizes: [1000, 650, 450, 300, 300, 300, 125, 125, 125, 125, 125, 125],
  },
  {
    label: "$25M 〜 $50M",
    threshold: 25_000_000,
    prizes: [900, 500, 350, 110, 110, 110, 110, 110],
  },
  {
    label: "Total Volume < $25M",
    threshold: 0,
    prizes: [450, 300, 200, 175, 175],
  },
];

// 資格条件（提案書 Appendix: Eligibility thresholds）
const MIN_DEPOSIT_USDC = 200;            // リワード獲得の入金ゲート
const ROI_VOLUME_THRESHOLD = 50_000;     // ROI部門のランキング対象条件
const WAGYU_TOP_N = 3;                   // 各部門上位3名にWagyuギフト
const WAGYU_YEN = 10_000;

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const INITIAL_DISPLAY_COUNT = 10;

// ---- i18n -------------------------------------------------------------

const I18N = {
  ja: {
    overviewTitle: "大会概要",
    entryPeriod: "エントリー期間：調整中",
    compPeriod: "大会期間：2026年8月（2週間・日程調整中）",
    entryForm: '大会エントリーは<a href="#" target="_blank" rel="noopener">こちらのフォーム（準備中）</a>より行ってください。',
    formNote: "※賞品発送連絡のためフォーム記入時間違いがないようご注意ください。",
    tradingTitle: "取引条件",
    condReferral: "公式リファラルコード（準備中）を登録したRISExアカウントによる取引のみが対象となります。",
    condMinDeposit: "最低入金額は 200 USDC となります。",
    condRoiVolume: "ROI部門のランキング対象となるには $50,000 以上の取引量が必要です。",
    bannerPlaceholder: "🖼️ バナー画像（準備中）",
    rewardCurrentVol: "現在の Total Volume: ",
    rewardNote: "※賞金プールは大会期間中の総取引量（対象アカウントのみ）に応じて4ティアで変動します。<br>※各部門の上位3名にはWagyuギフト（¥10,000相当）が贈られます。",
    refresh: "🔄 更新",
    roiNote: "✅ … ROI部門の最低取引量（$50,000）を達成すると名前に ✅ がつきます。未達成の方はランキング下部に表示されます。<br>Capital … ROI計算の分母（大会開始時のエクイティ＋期間中の入金）。<span class=\"baseline-warn\">赤字</span>は最低入金額（200 USDC）未達です。",
    volTotalLabel: "Total Volume: ",
    volNote: "<span class=\"baseline-warn\">赤字</span>は最低入金額（200 USDC）未達のためリワード対象外です。",
    rulesTitle: "大会規約",
    rule1: "大会期間は2026年8月の2週間（日程調整中）となります。",
    rule2: "公式リファラルコードを登録したアカウントによる取引のみがランキング・賞金ティア判定の対象となります。",
    rule3: "リワード獲得には最低 200 USDC の入金が必要です。",
    rule4: "ROI部門のランキング対象となるには $50,000 以上の取引量が必要です。",
    rule5: "ROIは「PnL ÷（大会開始時エクイティ＋期間中入金）」で算出します。期間中の出金はPnLに加算され、分母からは差し引かれません。",
    rule6: "同率の場合、ROI部門は取引量、Volume部門は対象資本により順位を決定します。",
    rule7: "ウォッシュトレード・自己約定と判断された取引はランキング対象外となります。",
    rule8: "最終的な入賞者の確定および失格の判断はRISExが行います。",
    rule9: 'ギフトコードは<a href="https://x.com/wagyuinternat?s=20" target="_blank" rel="noopener">wagyu international</a>の近江牛と引き換えることができます。',
    rule10: '賞品発送連絡はXのDMを通じて<a href="https://x.com/bb_jpdao" target="_blank" rel="noopener">bb_jpdao</a>より連絡します。',
    rule11: "Xで連絡がとれない受賞者は送付時点レートで同額の $JPYC を提出されたウォレットへ送付します。",
    rule12: "海外在住の受賞者は送付時点レートで同額の $JPYC を提出されたウォレットへ送付します。",
    rule13: "本大会は、仮想通貨取引の技術向上と楽しみを目的としたイベントです。",
    rule14: "実際の資金を用いたトレードが行われますが参加者自身の責任において参加ください。",
    rule15: "仮想通貨の価格は常に変動しており、元本の損失を含むリスクがあります。運営は取引による損失やトラブル等について一切の責任を負いません。",
    rule16: "RISExの利用規約や法令を遵守のうえ、ご参加ください。規約違反が確認された場合は、参加資格の剥奪や賞品授与の取り消しとなる場合があります。",
    rule17: "本イベントの内容やルールは、予告なく変更・中止となる場合があります。あらかじめご了承ください。",
    rule18: "同一人物の複数アカウントでの参加、複数口座間の両建て等の不正行為が確認された場合は、順位や賞品授与の対象から除外します。",
    // 動的テキスト
    statusLoading: "データを読み込んでいます...",
    statusFetching: "データを取得しています...",
    statusNoData: "データが見つかりません。risex-backend でデータが生成されるまでお待ちください。",
    statusError: "エラーが発生しました。詳細はコンソールを確認してください。",
    lastUpdated: "最終更新",
    currentTier: " ◀ 現在",
    thRank: "Rank",
    thPrize: "賞金",
    thWagyu: "Wagyu",
    roiTrack: "ROI 部門",
    volTrack: "Trading Vol. 部門",
    qualifyTitle: "Vol. $50,000+ 達成",
  },
  en: {
    overviewTitle: "Overview",
    entryPeriod: "Entry period: TBD",
    compPeriod: "Competition period: August 2026 (2 weeks, dates TBD)",
    entryForm: 'Please enter the competition via <a href="#" target="_blank" rel="noopener">this form (coming soon)</a>.',
    formNote: "* Please double-check your form entries; they will be used to contact winners for prize delivery.",
    tradingTitle: "Trading Requirements",
    condReferral: "Only trades made with a RISEx account registered with the official referral code (coming soon) are eligible.",
    condMinDeposit: "The minimum deposit is 200 USDC.",
    condRoiVolume: "A minimum traded volume of $50,000 is required to be ranked in the ROI track.",
    bannerPlaceholder: "🖼️ Banner (coming soon)",
    rewardCurrentVol: "Current Total Volume: ",
    rewardNote: "* The prize pool varies across four tiers based on the total trading volume (coded accounts only) during the competition.<br>* The top three in each track will also receive a Wagyu gift (worth ¥10,000).",
    refresh: "🔄 Refresh",
    roiNote: "✅ … Shown next to traders who have reached the ROI-track minimum volume ($50,000). Traders below the threshold are listed at the bottom.<br>Capital … The ROI denominator (starting equity + deposits during the competition). <span class=\"baseline-warn\">Red</span> indicates the minimum deposit (200 USDC) has not been met.",
    volTotalLabel: "Total Volume: ",
    volNote: "<span class=\"baseline-warn\">Red</span> indicates the minimum deposit (200 USDC) has not been met and the trader is not eligible for rewards.",
    rulesTitle: "Terms & Conditions",
    rule1: "The competition will run for two weeks in August 2026 (dates TBD).",
    rule2: "Only trades made by accounts registered with the official referral code count toward the rankings and prize tier determination.",
    rule3: "A minimum deposit of 200 USDC is required to be eligible for rewards.",
    rule4: "A minimum traded volume of $50,000 is required to be ranked in the ROI track.",
    rule5: "ROI is calculated as PnL ÷ (starting equity + deposits during the competition). Withdrawals during the competition are added back to PnL and are not deducted from the denominator.",
    rule6: "Ties are broken by traded volume in the ROI track and by qualifying capital in the Volume track.",
    rule7: "Trades deemed wash trading or self-matching will be excluded from the rankings.",
    rule8: "RISEx holds final authority on winner determination and disqualification.",
    rule9: 'Gift codes can be exchanged for Omi beef from <a href="https://x.com/wagyuinternat?s=20" target="_blank" rel="noopener">wagyu international</a>.',
    rule10: 'Winners will be contacted by <a href="https://x.com/bb_jpdao" target="_blank" rel="noopener">bb_jpdao</a> via X DM regarding prize delivery.',
    rule11: "Winners who cannot be reached on X will receive the equivalent amount in $JPYC (at the rate at the time of sending) to the submitted wallet.",
    rule12: "Winners residing outside Japan will receive the equivalent amount in $JPYC (at the rate at the time of sending) to the submitted wallet.",
    rule13: "This competition is an event intended to improve trading skills and to be enjoyed.",
    rule14: "Trades involve real funds; please participate at your own risk.",
    rule15: "Cryptocurrency prices fluctuate constantly and there is a risk of loss, including loss of principal. The organizers accept no responsibility for any losses or issues arising from trading.",
    rule16: "Please comply with RISEx's terms of service and applicable laws. Violations may result in disqualification or forfeiture of prizes.",
    rule17: "The content and rules of this event are subject to change or cancellation without notice.",
    rule18: "Participation with multiple accounts by the same person, hedging across accounts, or other fraudulent activity will result in exclusion from the rankings and prizes.",
    // 動的テキスト
    statusLoading: "Loading data...",
    statusFetching: "Fetching data...",
    statusNoData: "No data found. Please wait until risex-backend generates it.",
    statusError: "An error occurred. See the browser console for details.",
    lastUpdated: "Last updated",
    currentTier: " ◀ Current",
    thRank: "Rank",
    thPrize: "Prize",
    thWagyu: "Wagyu",
    roiTrack: "ROI Track",
    volTrack: "Volume Track",
    qualifyTitle: "Vol. $50,000+ reached",
  },
};

let currentLang = localStorage.getItem("risexLang") || "ja";

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.ja[key] ?? key;
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  const btn = document.getElementById("lang-toggle");
  if (btn) btn.textContent = currentLang === "ja" ? "EN" : "日本語";
}

function toggleLang() {
  currentLang = currentLang === "ja" ? "en" : "ja";
  localStorage.setItem("risexLang", currentLang);
  applyI18n();
  render();
  setStatus(lastStatus.key, lastStatus.arg);
}

// ---- 状態 -------------------------------------------------------------

let lastJson = null;    // 取得済みの data.json
let lastBlind = null;   // blind.json（有効時のみ）
let lastStatus = { key: "statusLoading", arg: null };

function setStatus(key, arg = null) {
  lastStatus = { key, arg };
  const el = document.getElementById("status");
  if (!el) return;
  if (key === "lastUpdated" && arg) {
    const locale = currentLang === "ja" ? "ja-JP" : "en-US";
    el.innerText = `${t("lastUpdated")}: ${new Date(arg).toLocaleString(locale)}`;
  } else {
    el.innerText = t(key);
  }
}

// ---- ヘルパー ---------------------------------------------------------

function getActiveTierIndex(totalVolume) {
  for (let i = 0; i < REWARD_TIERS.length; i++) {
    if (totalVolume >= REWARD_TIERS[i].threshold) return i;
  }
  return REWARD_TIERS.length - 1;
}

function rankCell(index) {
  const medal = RANK_MEDALS[index];
  return medal ? `${medal} ${index + 1}` : `${index + 1}`;
}

// 最低入金200 USDCの達成判定。backendのフラグを優先し、無ければ期間中入金合計で代替
function minDepositMet(item) {
  if (typeof item.minDepositMet === "boolean") return item.minDepositMet;
  return (item.deposits || 0) >= MIN_DEPOSIT_USDC;
}

// ROI部門のランキング対象（入金ゲート＋最低取引量）
function isRoiEligible(item) {
  return minDepositMet(item) && (item.tradedVolume || 0) >= ROI_VOLUME_THRESHOLD;
}

// ---- リワードテーブル -------------------------------------------------

function renderRewardTables(totalVolume) {
  const volEl = document.getElementById("reward-vol");
  if (volEl && totalVolume != null) {
    volEl.textContent = `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  const activeIdx = totalVolume != null ? getActiveTierIndex(totalVolume) : -1;

  // タブ
  const tabsEl = document.getElementById("tier-tabs");
  const tierColors = ["tier-tab--red", "tier-tab--orange", "tier-tab--green", "tier-tab--blue"];
  tabsEl.innerHTML = REWARD_TIERS.map((tier, i) =>
    `<button class="tier-tab ${tierColors[i]}${i === activeIdx ? " tier-tab--active tier-tab--selected" : ""}" data-tier="${i}">${tier.label}${i === activeIdx ? t("currentTier") : ""}</button>`
  ).join("");

  // テーブル
  const tablesEl = document.getElementById("reward-tables");
  renderTierDetail(tablesEl, activeIdx >= 0 ? activeIdx : REWARD_TIERS.length - 1);

  // 再描画のたびにリスナーが積み重ならないよう onclick で上書きする
  tabsEl.onclick = (e) => {
    const btn = e.target.closest(".tier-tab");
    if (!btn) return;
    const idx = parseInt(btn.dataset.tier, 10);
    tabsEl.querySelectorAll(".tier-tab").forEach((b, i) => {
      b.classList.toggle("tier-tab--selected", i === idx);
    });
    renderTierDetail(tablesEl, idx);
  };
}

function renderTierDetail(container, tierIdx) {
  const tier = REWARD_TIERS[tierIdx];

  function makeRows(arr) {
    const groups = [];
    let i = 0;
    while (i < arr.length) {
      const usdc = arr[i];
      let j = i;
      while (j < arr.length && arr[j] === usdc) j++;
      const rankLabel = j - 1 === i ? `${i + 1}` : `${i + 1}-${j}`;
      const wagyu = i < WAGYU_TOP_N ? `¥${WAGYU_YEN.toLocaleString()}` : "—";
      groups.push(`<tr><td>${rankLabel}</td><td>${usdc.toLocaleString()} USDC</td><td>${wagyu}</td></tr>`);
      i = j;
    }
    return groups.join("");
  }

  container.innerHTML = `
    <div class="reward-pair">
      <div class="reward-col">
        <h3>${t("roiTrack")}</h3>
        <table class="reward-table">
          <thead><tr><th>${t("thRank")}</th><th>${t("thPrize")}</th><th>${t("thWagyu")}</th></tr></thead>
          <tbody>${makeRows(tier.prizes)}</tbody>
        </table>
      </div>
      <div class="reward-col">
        <h3>${t("volTrack")}</h3>
        <table class="reward-table">
          <thead><tr><th>${t("thRank")}</th><th>${t("thPrize")}</th><th>${t("thWagyu")}</th></tr></thead>
          <tbody>${makeRows(tier.prizes)}</tbody>
        </table>
      </div>
    </div>`;
}

// ---- blindモード ------------------------------------------------------

async function fetchBlindMode() {
  try {
    const res = await fetch(`blind.json?t=${Date.now()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.blindStartISO) return null;
    const startMs = Date.parse(data.blindStartISO);
    if (isNaN(startMs)) return null;
    return Date.now() >= startMs ? data : null;
  } catch {
    return null;
  }
}

function applyBlindMode(blindData) {
  const roiBlind = document.getElementById("roi-blind");
  const volBlind = document.getElementById("vol-blind");
  const roiContent = document.getElementById("roi-content");
  const volContent = document.getElementById("vol-content");

  if (blindData) {
    const msg = (currentLang === "en" && blindData.message_en) ? blindData.message_en : (blindData.message || "");
    roiBlind.textContent = msg;
    volBlind.textContent = msg;
    roiBlind.style.display = "";
    volBlind.style.display = "";
    roiContent.style.display = "none";
    volContent.style.display = "none";
    return true;
  }
  roiBlind.style.display = "none";
  volBlind.style.display = "none";
  roiContent.style.display = "";
  volContent.style.display = "";
  return false;
}

// ---- データ取得・描画 -------------------------------------------------

async function fetchData() {
  setStatus("statusFetching");

  try {
    lastBlind = await fetchBlindMode();

    const dataResponse = await fetch(`data.json?t=${Date.now()}`);
    if (!dataResponse.ok) {
      lastJson = null;
      render();
      setStatus("statusNoData");
      return;
    }

    lastJson = await dataResponse.json();
    render();
    setStatus("lastUpdated", lastJson.meta.fetchedAtUTC);
  } catch (error) {
    console.error(error);
    setStatus("statusError");
  }
}

// 取得済みデータから全体を描画する（言語切り替え時にも再利用）
function render() {
  const isBlind = applyBlindMode(lastBlind);

  if (!lastJson) {
    renderRewardTables(null);
    return;
  }

  const participants = lastJson.participants;
  const totalVolume = lastJson.meta.totalVolumeUSD;
  const tierIdx = totalVolume != null ? getActiveTierIndex(totalVolume) : REWARD_TIERS.length - 1;
  const tier = REWARD_TIERS[tierIdx];

  if (!isBlind) {
    // ROIランキング: 対象者（入金200 USDC＋Vol $50k達成）をROI降順で上位に、
    // 未達者はその下に参考表示。同率は取引量で決定（提案書 Notes）
    const byRoi = (a, b) => (b.roi - a.roi) || ((b.tradedVolume || 0) - (a.tradedVolume || 0));
    const eligible = participants.filter(isRoiEligible).sort(byRoi);
    const rest = participants.filter((p) => !isRoiEligible(p)).sort(byRoi);
    renderRoiRanking([...eligible, ...rest], eligible.length, tier.prizes.length);

    // Volumeランキング（Volume降順）
    // TODO: 同率時は qualifying capital で決定とあるが大小の方向が未確定（要RISEx確認）。暫定で小さい方を上位とする
    const byVol = (a, b) =>
      ((b.tradedVolume || 0) - (a.tradedVolume || 0)) ||
      ((a.qualifyingCapital || 0) - (b.qualifyingCapital || 0));
    const volSorted = [...participants].sort(byVol);
    renderVolRanking(volSorted, totalVolume, tier.prizes.length);
  }

  // リワードテーブル
  renderRewardTables(totalVolume);
}

function traderCell(item) {
  const nameLabel = item.displayName || item.address;
  const qualified = (item.tradedVolume || 0) >= ROI_VOLUME_THRESHOLD;
  const badge = qualified ? ` <span class="qualify-badge" title="${t("qualifyTitle")}">✅</span>` : "";
  const xLink = item.xAccount
    ? `<a href="https://x.com/${item.xAccount.replace('@', '')}" target="_blank" rel="noopener" style="color: var(--text-secondary); font-size: 0.85em; text-decoration: none;">${item.xAccount}</a>`
    : "";
  return `${nameLabel}${badge}${xLink ? `<br>${xLink}` : ""}`;
}

function buildPageTabs(container, totalCount, activePage, onSelect) {
  const pageSize = INITIAL_DISPLAY_COUNT;
  const pageCount = Math.ceil(totalCount / pageSize);
  if (pageCount <= 1) return;

  let tabsEl = container.querySelector(".page-tabs");
  if (!tabsEl) {
    tabsEl = document.createElement("div");
    tabsEl.className = "page-tabs";
    container.querySelector(".table-responsive").before(tabsEl);
  }

  tabsEl.innerHTML = Array.from({ length: pageCount }, (_, i) => {
    const from = i * pageSize + 1;
    const to = Math.min((i + 1) * pageSize, totalCount);
    return `<button class="page-tab${i === activePage ? " page-tab--active" : ""}" data-page="${i}">${from}-${to}</button>`;
  }).join("");

  tabsEl.onclick = (e) => {
    const btn = e.target.closest(".page-tab");
    if (!btn) return;
    onSelect(parseInt(btn.dataset.page, 10));
  };
}

function renderRoiPage(body, data, page, eligibleCount, prizeCount) {
  body.innerHTML = "";
  const start = page * INITIAL_DISPLAY_COUNT;
  const slice = data.slice(start, start + INITIAL_DISPLAY_COUNT);

  slice.forEach((item, i) => {
    const index = start + i;
    const tr = document.createElement("tr");
    tr.className = "animate-fade-in";
    tr.style.animationDelay = `${i * 0.03}s`;
    // 入賞圏ハイライトはランキング対象者のみ
    if (index < prizeCount && index < eligibleCount) tr.classList.add("rank-prize");

    const roiClass = item.roi >= 0 ? "roi-positive" : "roi-negative";
    const pnl = item.pnl || 0;
    const pnlClass = pnl >= 0 ? "roi-positive" : "roi-negative";

    const capital = item.qualifyingCapital || 0;
    const warnClass = minDepositMet(item) ? "" : " baseline-warn";

    tr.innerHTML = `
      <td>${rankCell(index)}</td>
      <td class="${warnClass}">${traderCell(item)}</td>
      <td class="${warnClass}">$${capital.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="${roiClass}">${(item.roi || 0).toFixed(2)}%</td>
      <td class="${pnlClass}">$${pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    `;
    body.appendChild(tr);
  });
}

function renderRoiRanking(data, eligibleCount, prizeCount) {
  const body = document.getElementById("roi-ranking-body");
  const card = body.closest(".dashboard-card");

  const showPage = (page) => {
    renderRoiPage(body, data, page, eligibleCount, prizeCount);
    buildPageTabs(card, data.length, page, showPage);
  };
  showPage(0);
}

function renderVolPage(body, data, page, prizeCount) {
  body.innerHTML = "";
  const start = page * INITIAL_DISPLAY_COUNT;
  const slice = data.slice(start, start + INITIAL_DISPLAY_COUNT);

  slice.forEach((item, i) => {
    const index = start + i;
    const tr = document.createElement("tr");
    tr.className = "animate-fade-in";
    tr.style.animationDelay = `${i * 0.03}s`;
    if (index < prizeCount) tr.classList.add("rank-prize");

    const vol = item.tradedVolume || 0;
    const warnClass = minDepositMet(item) ? "" : " baseline-warn";

    tr.innerHTML = `
      <td>${rankCell(index)}</td>
      <td class="${warnClass}">${traderCell(item)}</td>
      <td>$${vol.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    `;
    body.appendChild(tr);
  });
}

function renderVolRanking(data, totalVolume, prizeCount) {
  const totalEl = document.getElementById("vol-total");
  if (totalEl && totalVolume != null) {
    totalEl.textContent = `$${totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  const body = document.getElementById("vol-ranking-body");
  const card = body.closest(".dashboard-card");

  const showPage = (page) => {
    renderVolPage(body, data, page, prizeCount);
    buildPageTabs(card, data.length, page, showPage);
  };
  showPage(0);
}

// 起動時に言語を適用し、リワードテーブルをデフォルト表示してからデータを取得
window.onload = () => {
  applyI18n();
  setStatus("statusLoading");
  renderRewardTables(null);
  fetchData();
};
