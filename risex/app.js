// リワードテーブルデータ（RISEx提案書 v3 準拠・4ティア）
// 両部門（ROI / Volume）とも同一の賞金構成のため prizes を共用する
const REWARD_TIERS = [
  {
    label: "Total Volume ≥ $75M",
    threshold: 75_000_000,
    prizes: [1200, 800, 550, 300, 300, 200, 200, 200, 200, 200, 120, 120, 120, 120, 120],
  },
  {
    label: "$50M 〜 $75M",
    threshold: 50_000_000,
    prizes: [800, 520, 360, 240, 240, 240, 100, 100, 100, 100, 100, 100],
  },
  {
    label: "$25M 〜 $50M",
    threshold: 25_000_000,
    prizes: [700, 400, 250, 80, 80, 80, 80, 80],
  },
  {
    label: "Total Volume < $25M",
    threshold: 0,
    prizes: [350, 250, 150, 125, 125],
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
    heroSubtitle: "ROI・Volumeの2部門で賞金を獲得！",
    statPoolLabel: "リワード総額（最大）",
    statPoolNote1: "Wagyuギフト+Giveaway等総額",
    statPoolNote2: "現在ティア: {n} USDC",
    statPeriodLabel: "大会期間",
    statPeriodValue: "8/18 - 9/7",
    statPeriodNote: "2026年・9月7日 23:59 JSTまで",
    statWagyuLabel: "Wagyuギフト",
    statWagyuValue: "各部門 上位3名",
    statWagyuNote: "¥10,000相当の近江牛",
    ctaJoin: "トレード大会に参加する →",
    ctaNote: "エントリーフォームが開きます",
    overviewTitle: "大会概要",
    entryPeriod: "エントリー期間：本日〜9月5日 23:59 JST",
    compPeriod: "大会期間：2026年8月18日〜9月7日 23:59 JST",
    entryForm: '大会エントリーは<a href="#" onclick="openEntryModal(); return false;">こちらのエントリーフォーム</a>より行ってください。',
    formNote: "※賞品発送連絡のためフォーム記入時間違いがないようご注意ください。",
    // エントリーフォーム
    entryModalTitle: "大会エントリー",
    entryNameLabel: "参加名",
    entryNamePh: "リーダーボードでの表示名",
    entryAddressLabel: "RISExアドレス",
    entryAddressNote: 'リファラルの種類は問いません。他のリファラルで作成したアカウントでもエントリー可能です。未登録の場合は<a href="https://www.rise.trade/en/invite/risexjp" target="_blank" rel="noopener">公式リファラル（招待コード: risexjp）</a>からの登録で15%ポイントブーストが適用されます。',
    entryXLabel: "Xアカウント",
    entryXAuthBtn: "Xで認証する",
    entryXVerified: "認証済み: ",
    entrySubmit: "エントリーする",
    entrySubmitting: "送信中...",
    entrySuccess: "✅ エントリーを受け付けました！",
    entrySuccessNote: "賞品発送等の連絡は認証済みXアカウントのDMに行います。",
    entryClose: "閉じる",
    entryErrName: "参加名を入力してください。",
    entryErrAddress: "RISExアドレスは 0x から始まる42文字のEVMアドレスを入力してください。",
    entryErrX: "Xアカウントの認証を完了してください。",
    entryErrXFailed: "X認証に失敗しました。再度お試しください。",
    entryErrPopup: "ポップアップがブロックされました。ブラウザの設定をご確認ください。",
    entryErrNetwork: "送信に失敗しました。時間をおいて再度お試しください。",
    entryErrApiUnset: "エントリー受付は現在準備中です。しばらくお待ちください。",
    tradingTitle: "取引条件",
    condEntry: '大会への参加には、本ページのエントリーフォームからのエントリーが必要です。',
    condReferral: 'リファラルの種類は問わず、他のリファラルやリファラルなしで作成したRISExアカウントでも参加できます。',
    condBoost: '公式リファラル（招待コード: risexjp）から登録すると、15%のポイントブーストが適用されます。<br><a href="https://www.rise.trade/en/invite/risexjp" target="_blank" rel="noopener">https://www.rise.trade/en/invite/risexjp</a>',
    condMinDeposit: "最低入金額は 200 USDC となります。",
    condRoiVolume: "ROI部門のランキング対象となるには $50,000 以上の取引量が必要です。",
    bannerPlaceholder: "🖼️ バナー画像（準備中）",
    rewardCurrentVol: "現在の Total Volume: ",
    rewardNote: "●賞金プールは大会期間中の総取引量（対象アカウントのみ）に応じて4ティアで変動します。<br>●各部門の上位3名にはWagyuギフト（¥10,000相当）が贈られます。",
    refresh: "🔄 更新",
    roiNote: "●CapitalはROI計算の分母となり、計算式は（大会開始時のエクイティ＋期間中の入金）です。<br>●最低取引量（$50,000）を達成すると名前に ✅ がつきます。<br>●最低入金額（200 USDC）を下回っている場合、名前がグレーで表示されます。<br>●両条件を満たした場合、ランキング内に表示されます。",
    roiNotePre: "●大会開始前のエントリー確認表示です。Depositはこれまでの累計入金額です（200 USDC以上でリワード対象）。<br>●最低入金額（200 USDC）を下回っている場合、名前がグレーで表示されます。<br>●ランキング・ROI等の数値は大会開始後に表示されます。",
    volTotalLabel: "Total Volume: ",
    volNote: "●最低入金額（200 USDC）を下回っている場合、名前がグレーで表示されます。<br>●条件を満たした場合、ランキング内に表示されます。",
    rulesTitle: "大会規約",
    rule1: "大会期間は2026年8月18日〜9月7日 23:59 JSTとなります。",
    rule2: "本ページのエントリーフォームからエントリーしたアカウントによる取引のみがランキング・賞金ティア判定の対象となります。登録時のリファラルの種類は問いません。",
    rule3: "リワード獲得には最低 200 USDC の入金が必要です。",
    rule4: "ROI部門のランキング対象となるには $50,000 以上の取引量が必要です。",
    rule5: "ROIは「PnL ÷（大会開始時エクイティ＋期間中入金）」で算出します。期間中の出金はPnLに加算され、分母からは差し引かれません。",
    rule6: "同率の場合、ROI部門は取引量、Volume部門は対象資本（大会開始時エクイティ＋期間中入金の合計）により順位を決定します。",
    rule7: "ウォッシュトレード・自己約定と判断された取引はランキング対象外となります。",
    rule8: "最終的な入賞者の確定および失格の判断はRISExが行います。",
    rule9: 'ギフトコードは<a href="https://x.com/wagyuinternat?s=20" target="_blank" rel="noopener">wagyu international</a>の近江牛と引き換えることができます。',
    rule10: '賞品発送連絡はXのDMを通じて<a href="https://x.com/bb_jpdao" target="_blank" rel="noopener">bb_jpdao</a>より連絡します。',
    rule11: "Xで連絡がとれない受賞者は送付時点レートで同額の $USDC を提出されたウォレットへ送付します。",
    rule12: "本大会は、仮想通貨取引の技術向上と楽しみを目的としたイベントです。",
    rule13: "実際の資金を用いたトレードが行われますが参加者自身の責任において参加ください。",
    rule14: "仮想通貨の価格は常に変動しており、元本の損失を含むリスクがあります。運営は取引による損失やトラブル等について一切の責任を負いません。",
    rule15: "RISExの利用規約や法令を遵守のうえ、ご参加ください。規約違反が確認された場合は、参加資格の剥奪や賞品授与の取り消しとなる場合があります。",
    rule16: "本イベントの内容やルールは、予告なく変更・中止となる場合があります。あらかじめご了承ください。",
    rule17: "同一人物の複数アカウントでの参加、複数口座間の両建て等の不正行為が確認された場合は、順位や賞品授与の対象から除外します。",
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
    heroSubtitle: "Win prizes across the ROI and Volume tracks!",
    statPoolLabel: "Total Rewards (max)",
    statPoolNote1: "Total incl. Wagyu gifts + giveaways",
    statPoolNote2: "Current tier: {n} USDC",
    statPeriodLabel: "Period",
    statPeriodValue: "Aug 18 - Sep 7",
    statPeriodNote: "2026, until Sep 7 23:59 JST",
    statWagyuLabel: "Wagyu Gift",
    statWagyuValue: "Top 3 in each track",
    statWagyuNote: "Omi beef worth ¥10,000",
    ctaJoin: "Join the Trading Competition →",
    ctaNote: "Opens the entry form",
    overviewTitle: "Overview",
    entryPeriod: "Entry period: Today - Sep 5, 2026, 23:59 JST",
    compPeriod: "Competition period: Aug 18 - Sep 7, 2026, 23:59 JST",
    entryForm: 'Please enter the competition via <a href="#" onclick="openEntryModal(); return false;">this entry form</a>.',
    formNote: "* Please double-check your form entries; they will be used to contact winners for prize delivery.",
    // Entry form
    entryModalTitle: "Competition Entry",
    entryNameLabel: "Display Name",
    entryNamePh: "Name shown on the leaderboard",
    entryAddressLabel: "RISEx Address",
    entryAddressNote: 'Any referral is accepted — accounts created with other referrals can also enter. If you have not registered yet, signing up via the <a href="https://www.rise.trade/en/invite/risexjp" target="_blank" rel="noopener">official referral link (code: risexjp)</a> grants a 15% point boost.',
    entryXLabel: "X Account",
    entryXAuthBtn: "Verify with X",
    entryXVerified: "Verified: ",
    entrySubmit: "Submit Entry",
    entrySubmitting: "Submitting...",
    entrySuccess: "✅ Your entry has been received!",
    entrySuccessNote: "Winners will be contacted via DM on the verified X account.",
    entryClose: "Close",
    entryErrName: "Please enter your display name.",
    entryErrAddress: "Please enter a valid 42-character EVM address starting with 0x.",
    entryErrX: "Please verify your X account first.",
    entryErrXFailed: "X verification failed. Please try again.",
    entryErrPopup: "The popup was blocked. Please check your browser settings.",
    entryErrNetwork: "Failed to submit. Please try again later.",
    entryErrApiUnset: "Entry submission is being prepared. Please check back soon.",
    tradingTitle: "Trading Requirements",
    condEntry: 'Entry via the entry form on this page is required to participate.',
    condReferral: 'Any referral is accepted — accounts created with other referrals or without a referral are also eligible.',
    condBoost: 'Registering via the official referral (invite code: risexjp) grants a 15% point boost.<br><a href="https://www.rise.trade/en/invite/risexjp" target="_blank" rel="noopener">https://www.rise.trade/en/invite/risexjp</a>',
    condMinDeposit: "The minimum deposit is 200 USDC.",
    condRoiVolume: "A minimum traded volume of $50,000 is required to be ranked in the ROI track.",
    bannerPlaceholder: "🖼️ Banner (coming soon)",
    rewardCurrentVol: "Current Total Volume: ",
    rewardNote: "●The prize pool varies across four tiers based on the total trading volume (entered accounts only) during the competition.<br>●The top three in each track will also receive a Wagyu gift (worth ¥10,000).",
    refresh: "🔄 Refresh",
    roiNote: "●Capital is the ROI denominator, calculated as (starting equity + deposits during the competition).<br>●Traders who reach the minimum volume ($50,000) get a ✅ next to their name.<br>●Traders below the minimum deposit (200 USDC) are shown with a gray name.<br>●Traders meeting both conditions are shown in the ranking.",
    roiNotePre: "●Pre-competition entry check. Deposit shows your total deposits so far (at least 200 USDC is required for rewards).<br>●Traders below the minimum deposit (200 USDC) are shown with a gray name.<br>●Rankings, ROI and other stats will appear once the competition starts.",
    volTotalLabel: "Total Volume: ",
    volNote: "●Traders below the minimum deposit (200 USDC) are shown with a gray name.<br>●Traders meeting the condition are shown in the ranking.",
    rulesTitle: "Terms & Conditions",
    rule1: "The competition will run from Aug 18 to Sep 7, 2026, until 23:59 JST.",
    rule2: "Only trades made by accounts entered via the entry form on this page count toward the rankings and prize tier determination. Any referral used at registration is accepted.",
    rule3: "A minimum deposit of 200 USDC is required to be eligible for rewards.",
    rule4: "A minimum traded volume of $50,000 is required to be ranked in the ROI track.",
    rule5: "ROI is calculated as PnL ÷ (starting equity + deposits during the competition). Withdrawals during the competition are added back to PnL and are not deducted from the denominator.",
    rule6: "Ties are broken by traded volume in the ROI track and by qualifying capital (starting equity + deposits during the competition) in the Volume track.",
    rule7: "Trades deemed wash trading or self-matching will be excluded from the rankings.",
    rule8: "RISEx holds final authority on winner determination and disqualification.",
    rule9: 'Gift codes can be exchanged for Omi beef from <a href="https://x.com/wagyuinternat?s=20" target="_blank" rel="noopener">wagyu international</a>.',
    rule10: 'Winners will be contacted by <a href="https://x.com/bb_jpdao" target="_blank" rel="noopener">bb_jpdao</a> via X DM regarding prize delivery.',
    rule11: "Winners who cannot be reached on X will receive the equivalent amount in $USDC (at the rate at the time of sending) to the submitted wallet.",
    rule12: "This competition is an event intended to improve trading skills and to be enjoyed.",
    rule13: "Trades involve real funds; please participate at your own risk.",
    rule14: "Cryptocurrency prices fluctuate constantly and there is a risk of loss, including loss of principal. The organizers accept no responsibility for any losses or issues arising from trading.",
    rule15: "Please comply with RISEx's terms of service and applicable laws. Violations may result in disqualification or forfeiture of prizes.",
    rule16: "The content and rules of this event are subject to change or cancellation without notice.",
    rule17: "Participation with multiple accounts by the same person, hedging across accounts, or other fraudulent activity will result in exclusion from the rankings and prizes.",
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
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  const btn = document.getElementById("lang-toggle");
  if (btn) btn.textContent = currentLang === "ja" ? "EN" : "日本語";
  updateXAuthStatus();
  // 表示中のエントリーフォームエラーも言語に追従させる
  const errEl = document.getElementById("entry-error");
  if (errEl && errEl.dataset.errKey) errEl.textContent = t(errEl.dataset.errKey);
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

// ---- エントリーフォーム -----------------------------------------------

// エントリー登録先（Supabase）。X認証はSupabase Auth（X OAuth 2.0）、
// 登録は entries テーブルへのinsert（RLSにより認証済みユーザーのみ可）
const SUPABASE_URL = "https://zynxzpbcqqwhumggdama.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Hiqpq_pT03YIH4oR-cDbBA_htuy8FKd";
const sbClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { flowType: "pkce" } })
  : null;

const X_AUTH_POPUP_NAME = "risex-x-auth";

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

// 認証済みXアカウント（{ username } または null）
let xAuth = null;
let entrySubmitting = false;

function xUsernameFromSession(session) {
  const m = (session && session.user && session.user.user_metadata) || {};
  return m.user_name || m.preferred_username || m.name || "";
}

function setXAuthFromSession(session) {
  xAuth = session ? { username: xUsernameFromSession(session) } : null;
  updateXAuthStatus();
}

if (sbClient) {
  sbClient.auth.onAuthStateChange((event, session) => {
    // 認証ポップアップとして開かれている場合: 認証成功を親に伝えて閉じる
    if (window.opener && window.name === X_AUTH_POPUP_NAME) {
      if (session) {
        try {
          window.opener.postMessage({ type: "risex-x-auth", ok: true }, location.origin);
        } catch (e) { /* opener が閉じられていた場合は無視 */ }
        window.close();
      }
      return;
    }
    setXAuthFromSession(session);
  });
}

function openEntryModal() {
  const modal = document.getElementById("entry-modal");
  if (modal) modal.classList.add("active");
}

function closeEntryModal() {
  const modal = document.getElementById("entry-modal");
  if (modal) modal.classList.remove("active");
}

document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  closeEntryModal();
  const posterModal = document.getElementById("poster-modal");
  if (posterModal) posterModal.classList.remove("active");
});

function showEntryError(key) {
  const el = document.getElementById("entry-error");
  if (!el) return;
  if (key) {
    el.textContent = t(key);
    el.dataset.errKey = key;
    el.style.display = "block";
  } else {
    el.textContent = "";
    delete el.dataset.errKey;
    el.style.display = "none";
  }
}

// X認証状態の表示を更新する（言語切替時にも呼ばれる）
function updateXAuthStatus() {
  const statusEl = document.getElementById("x-auth-status");
  const btn = document.getElementById("x-auth-btn");
  if (!statusEl || !btn) return;
  if (xAuth) {
    statusEl.textContent = `${t("entryXVerified")}@${xAuth.username}`;
    statusEl.classList.add("verified");
    btn.style.display = "none";
  } else {
    statusEl.textContent = "";
    statusEl.classList.remove("verified");
    btn.style.display = "";
  }
}

async function startXAuth() {
  if (!sbClient) {
    showEntryError("entryErrNetwork");
    return;
  }
  showEntryError(null);
  try {
    // 認可URLだけ取得し、ページ遷移せずポップアップで開く
    const { data, error } = await sbClient.auth.signInWithOAuth({
      provider: "x",  // Supabase の「X / Twitter (OAuth 2.0)」プロバイダ
      options: {
        redirectTo: location.origin + location.pathname,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    const w = 500;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      data.url,
      X_AUTH_POPUP_NAME,
      `width=${w},height=${h},left=${left},top=${top}`
    );
    if (!popup) showEntryError("entryErrPopup");
  } catch (e) {
    console.error("x auth failed:", e);
    showEntryError("entryErrXFailed");
  }
}

// 認証ポップアップからの完了通知を受け取り、セッションを反映する
window.addEventListener("message", async (ev) => {
  if (ev.origin !== location.origin) return;
  if (!ev.data || ev.data.type !== "risex-x-auth" || !sbClient) return;
  const { data } = await sbClient.auth.getSession();
  setXAuthFromSession(data.session);
  if (data.session) showEntryError(null);
  else showEntryError("entryErrXFailed");
});

async function submitEntry(ev) {
  ev.preventDefault();
  if (entrySubmitting) return;

  const name = document.getElementById("entry-name").value.trim();
  const address = document.getElementById("entry-address").value.trim();

  // 空欄・形式チェック（DB側でも CHECK 制約・RLS で同条件が強制される）
  if (!name) return showEntryError("entryErrName");
  if (!EVM_ADDRESS_RE.test(address)) return showEntryError("entryErrAddress");
  if (!sbClient) return showEntryError("entryErrNetwork");

  const { data: sess } = await sbClient.auth.getSession();
  if (!sess.session) {
    setXAuthFromSession(null);
    return showEntryError("entryErrX");
  }

  showEntryError(null);
  entrySubmitting = true;
  const submitBtn = document.getElementById("entry-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = t("entrySubmitting");

  try {
    const { error } = await sbClient.from("entries").insert({ name, address });
    if (error) {
      console.error("entry insert failed:", error);
      if (error.code === "23514") {
        // CHECK 制約違反（アドレス形式 or 名前長）
        showEntryError("entryErrAddress");
      } else if (error.code === "42501") {
        // RLS 拒否（セッション切れ等）
        setXAuthFromSession(null);
        showEntryError("entryErrX");
      } else {
        showEntryError("entryErrNetwork");
      }
      return;
    }
    document.getElementById("entry-form").style.display = "none";
    document.getElementById("entry-success").style.display = "block";
  } catch (e) {
    console.error("entry submit failed:", e);
    showEntryError("entryErrNetwork");
  } finally {
    entrySubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = t("entrySubmit");
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

// ティアのリワードプール総額（USDC・2部門合計）
function tierPoolTotal(tier) {
  return tier.prizes.reduce((sum, p) => sum + p, 0) * 2;
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

// ヒーローの賞金プールカード: 主表示は最大額($10,000・HTML静的)、
// 補助表示(note)に現在ティアのプール総額を出す
function updateHeroPool(totalVolume) {
  const noteEl = document.getElementById("hero-pool-note");
  if (!noteEl) return;
  const idx = totalVolume != null ? getActiveTierIndex(totalVolume) : REWARD_TIERS.length - 1;
  const total = tierPoolTotal(REWARD_TIERS[idx]);
  noteEl.innerHTML = `${t("statPoolNote1")}<br>${t("statPoolNote2").replace("{n}", total.toLocaleString())}`;
}

function renderRewardTables(totalVolume) {
  updateHeroPool(totalVolume);

  const volEl = document.getElementById("reward-vol");
  if (volEl && totalVolume != null) {
    volEl.textContent = `$${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  const activeIdx = totalVolume != null ? getActiveTierIndex(totalVolume) : -1;

  // タブ
  const tabsEl = document.getElementById("tier-tabs");
  const tierColors = ["tier-tab--green", "tier-tab--teal", "tier-tab--yellow", "tier-tab--purple"];
  tabsEl.innerHTML = REWARD_TIERS.map((tier, i) =>
    `<button class="tier-tab ${tierColors[i]}${i === activeIdx ? " tier-tab--active tier-tab--selected" : ""}" data-tier="${i}">` +
    `<span class="tier-tab-label">${tier.label}${i === activeIdx ? t("currentTier") : ""}</span>` +
    `<span class="tier-tab-pool">${tierPoolTotal(tier).toLocaleString()} USDC</span>` +
    `</button>`
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
// 大会開始前か（エントリー確認表示の判定）
function isPreStart() {
  const startISO = lastJson && lastJson.meta && lastJson.meta.competitionStartISO;
  if (!startISO) return false;
  const startMs = Date.parse(startISO);
  return Number.isFinite(startMs) && Date.now() < startMs;
}

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

  // 大会開始前はエントリー確認表示（累計入金のみ。ROI・Capital等は出さない）
  const preStart = isPreStart();

  if (!isBlind) {
    if (preStart) {
      // 入金額の大きい順に表示（順位・入賞ハイライトなし）
      const byDeposit = (a, b) => (b.totalDeposits || 0) - (a.totalDeposits || 0);
      const sorted = [...participants].sort(byDeposit);
      renderRoiRanking(sorted, 0, tier.prizes.length, true);
      renderVolRanking(sorted, totalVolume, tier.prizes.length, true);
    } else {
      // ROIランキング: 対象者（入金200 USDC＋Vol $50k達成）をROI降順で上位に、
      // 未達者はその下に参考表示。同率は取引量で決定（提案書 Notes）
      const byRoi = (a, b) => (b.roi - a.roi) || ((b.tradedVolume || 0) - (a.tradedVolume || 0));
      const eligible = participants.filter(isRoiEligible).sort(byRoi);
      const rest = participants.filter((p) => !isRoiEligible(p)).sort(byRoi);
      renderRoiRanking([...eligible, ...rest], eligible.length, tier.prizes.length, false);

      // Volumeランキング（Volume降順）
      // TODO: 同率時は qualifying capital で決定（RISEx仕様 v3）。大小の方向が未確定のため暫定で小さい方を上位とする
      const byVol = (a, b) =>
        ((b.tradedVolume || 0) - (a.tradedVolume || 0)) ||
        ((a.qualifyingCapital || 0) - (b.qualifyingCapital || 0));
      const volSorted = [...participants].sort(byVol);
      renderVolRanking(volSorted, totalVolume, tier.prizes.length, false);
    }
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

function renderRoiPage(body, data, page, eligibleCount, prizeCount, preStart) {
  body.innerHTML = "";
  const start = page * INITIAL_DISPLAY_COUNT;
  const slice = data.slice(start, start + INITIAL_DISPLAY_COUNT);

  slice.forEach((item, i) => {
    const index = start + i;
    const tr = document.createElement("tr");
    tr.className = "animate-fade-in";
    tr.style.animationDelay = `${i * 0.03}s`;

    const warnClass = minDepositMet(item) ? "" : " baseline-warn";

    // 開始前はエントリー確認表示: 累計入金のみ（順位・入賞ハイライトなし）
    if (preStart) {
      const deposit = item.totalDeposits || 0;
      tr.innerHTML = `
        <td>-</td>
        <td class="${warnClass}">${traderCell(item)}</td>
        <td class="${warnClass}">$${deposit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      `;
      body.appendChild(tr);
      return;
    }

    // 入賞圏ハイライトはランキング対象者のみ
    if (index < prizeCount && index < eligibleCount) tr.classList.add("rank-prize");

    const roiClass = item.roi >= 0 ? "roi-positive" : "roi-negative";
    const pnl = item.pnl || 0;
    const pnlClass = pnl >= 0 ? "roi-positive" : "roi-negative";

    const capital = item.qualifyingCapital || 0;

    tr.innerHTML = `
      <td>${index < eligibleCount ? rankCell(index) : "-"}</td>
      <td class="${warnClass}">${traderCell(item)}</td>
      <td class="${warnClass}">$${capital.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      <td class="${roiClass}">${(item.roi || 0).toFixed(2)}%</td>
      <td class="${pnlClass}">$${pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    `;
    body.appendChild(tr);
  });
}

function renderRoiRanking(data, eligibleCount, prizeCount, preStart) {
  const body = document.getElementById("roi-ranking-body");
  const card = body.closest(".dashboard-card");

  // 開始前はヘッダを Rank / Trader / Deposit の3列に差し替える
  const theadRow = card.querySelector("thead tr");
  theadRow.innerHTML = preStart
    ? "<th>Rank</th><th>Trader</th><th>Deposit</th>"
    : "<th>Rank</th><th>Trader</th><th>Capital</th><th>ROI</th><th>PnL</th>";

  // 注記も開始前用に切り替える（言語切替時は render() 経由で再設定される）
  const noteEl = card.querySelector("[data-i18n-html]");
  if (noteEl) {
    const key = preStart ? "roiNotePre" : "roiNote";
    noteEl.setAttribute("data-i18n-html", key);
    noteEl.innerHTML = t(key);
  }

  const showPage = (page) => {
    renderRoiPage(body, data, page, eligibleCount, prizeCount, preStart);
    buildPageTabs(card, data.length, page, showPage);
  };
  showPage(0);
}

function renderVolPage(body, data, page, prizeCount, preStart) {
  body.innerHTML = "";
  const start = page * INITIAL_DISPLAY_COUNT;
  const slice = data.slice(start, start + INITIAL_DISPLAY_COUNT);

  // 順位は最低入金達成者のみで採番し、未達者は "-" 表示（リワード対象外）
  let qualifiedRank = data.slice(0, start).filter(minDepositMet).length;

  slice.forEach((item, i) => {
    const tr = document.createElement("tr");
    tr.className = "animate-fade-in";
    tr.style.animationDelay = `${i * 0.03}s`;

    const met = minDepositMet(item);
    if (met) qualifiedRank++;
    // 開始前は順位・入賞ハイライトを出さない（エントリー確認表示）
    if (!preStart && met && qualifiedRank <= prizeCount) tr.classList.add("rank-prize");

    const vol = item.tradedVolume || 0;
    const warnClass = met ? "" : " baseline-warn";

    tr.innerHTML = `
      <td>${!preStart && met ? rankCell(qualifiedRank - 1) : "-"}</td>
      <td class="${warnClass}">${traderCell(item)}</td>
      <td>$${vol.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
    `;
    body.appendChild(tr);
  });
}

function renderVolRanking(data, totalVolume, prizeCount, preStart) {
  const totalEl = document.getElementById("vol-total");
  if (totalEl && totalVolume != null) {
    totalEl.textContent = `$${totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  const body = document.getElementById("vol-ranking-body");
  const card = body.closest(".dashboard-card");

  const showPage = (page) => {
    renderVolPage(body, data, page, prizeCount, preStart);
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
