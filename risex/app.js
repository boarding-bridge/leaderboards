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
    prizes: [800, 520, 360, 280, 260, 180, 100, 100, 100, 100, 100, 100],
  },
  {
    label: "$25M 〜 $50M",
    threshold: 25_000_000,
    prizes: [700, 400, 250, 80, 80, 80, 80, 80],
  },
  {
    label: "Total Volume < $25M",
    threshold: 0,
    prizes: [350, 250, 150, 50, 50, 50, 50, 50],
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
    entryPeriod: "エントリー期間：〜9月5日 23:59 JST",
    compPeriod: "大会期間：2026年8月18日〜9月7日 23:59 JST",
    entryForm: '大会エントリーは<a href="#" onclick="openEntryModal(); return false;">こちらのエントリーフォーム</a>より行ってください。',
    formNote: "※賞品発送連絡のためフォーム記入時間違いがないようご注意ください。",
    // エントリーフォーム
    entryModalTitle: "大会エントリー",
    entryNameLabel: "参加名",
    entryNamePh: "リーダーボードでの表示名",
    entryNameNote: "使用できるのは半角英数字とアンダースコア（_）のみ、3〜20文字です。",
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
    entryErrNameFormat: "参加名は半角英数字とアンダースコア（_）3〜20文字で入力してください。",
    entryErrAddress: "RISExアドレスは 0x から始まる42文字のEVMアドレスを入力してください。",
    entryErrX: "Xアカウントの認証を完了してください。",
    entryErrXFailed: "X認証に失敗しました。再度お試しください。",
    entryErrPopup: "ポップアップがブロックされました。ブラウザの設定をご確認ください。",
    entryErrDupUser: "このXアカウントでは既にエントリー済みです。",
    entryErrDupAddress: "このRISExアドレスは既に別のエントリーで使用されています。",
    entryErrDupName: "この参加名は既に使用されています。別の名前を入力してください。",
    entryErrNetwork: "送信に失敗しました。時間をおいて再度お試しください。",
    entryErrApiUnset: "エントリー受付は現在準備中です。しばらくお待ちください。",
    // Discord連携
    discordPerk1: "優勝者にはboarding bridgeで「和牛王」ロールを付与！",
    discordPerk2: "「和牛王」ロール保持者への特典も検討中です。",
    discordPerk3: "boarding bridgeでは大会状況を随時実況中！一緒に盛り上がりましょう！",
    discordLinkLead: "「和牛王」ロール付与をスムーズに行うため、大会参加者はDiscordアカウントの連携にご協力ください（連携は任意です）。",
    discordLinkBtn: "Discordアカウントを連携する",
    discordLinked: "連携済み: ",
    discordLinkNote: "エントリー時に認証したXアカウントに紐付けて連携されます。X未認証の場合は先に認証ポップアップが開きます。",
    discordErrLink: "Discord連携に失敗しました。時間をおいて再度お試しください。",
    discordErrAlreadyLinked: "このDiscordアカウントは既に別の参加者と連携されています。",
    discordJoinBtn: "boarding bridgeに参加する",
    tradingTitle: "取引条件",
    condEntry: '大会への参加には、本ページのエントリーフォームからのエントリーが必要です。',
    condReferral: 'リファラルの種類は問わず、他のリファラルやリファラルなしで作成したRISExアカウントでも参加できます。',
    condBoost: '公式リファラル（招待コード: risexjp）から登録すると、15%のポイントブーストが適用されます。<br><a href="https://www.rise.trade/en/invite/risexjp" target="_blank" rel="noopener">https://www.rise.trade/en/invite/risexjp</a>',
    condMinDeposit: "大会期間中に 200 USDC以上の入金が必要です。",
    condRoiVolume: "ROI部門のランキング対象となるには $50,000 以上の取引量が必要です。",
    bannerPlaceholder: "🖼️ バナー画像（準備中）",
    rewardCurrentVol: "現在の Total Volume: ",
    rewardNote: "●賞金プールは大会期間中の総取引量（対象アカウントのみ）に応じて4ティアで変動します。<br>●各部門の上位3名にはWagyuギフト（¥10,000相当）が贈られます。",
    refresh: "🔄 更新",
    sortLabel: "ランキング表示:",
    rankingNote: "●CapitalはROI計算の分母となり、計算式は（大会開始時のエクイティ＋期間中の入金）です。<br>●最低取引量（$50,000）を達成すると名前に ✅ がつきます。<br>●入金条件（大会期間中に 200 USDC以上）を満たしていない場合、行が黄色の枠・背景、名前がグレーで表示されます。<br>●ROIランキングは入金条件と最低取引量、Volumeランキングは入金条件を満たすと順位が表示されます。<br>●入賞圏の順位には現在ティアのリワード額を表示しています。🥩は上位3名へのWagyuギフト（¥10,000相当の和牛チケット）です。",
    rankingNotePre: "●大会開始前のエントリー確認表示です。Depositはこれまでの累計入金額です（参考表示）。<br>●リワード対象の判定は大会期間中の入金 200 USDC以上で行われます（大会開始後に期間中の入金で判定されます）。<br>●大会開始後はDeposit欄に代わりCAPITAL（大会開始時エクイティ＋期間中入金の合計）が表示されます。<br>●ランキング・ROI等の数値は大会開始後に表示されます。",
    volTotalLabel: "Total Volume: ",
    rulesTitle: "大会規約",
    rule1: "大会期間は2026年8月18日〜9月7日 23:59 JSTとなります。",
    rule2: "本ページのエントリーフォームからエントリーしたアカウントによる取引のみがランキング・賞金ティア判定の対象となります。登録時のリファラルの種類は問いません。",
    rule3: "リワード獲得には大会期間中に 200 USDC以上の入金が必要です。",
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
    wagyuTicket: "Wagyuギフト（¥10,000相当の和牛チケット）",
    capitalPreparing: "準備中",
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
    entryPeriod: "Entry period: Until Sep 5, 2026, 23:59 JST",
    compPeriod: "Competition period: Aug 18 - Sep 7, 2026, 23:59 JST",
    entryForm: 'Please enter the competition via <a href="#" onclick="openEntryModal(); return false;">this entry form</a>.',
    formNote: "* Please double-check your form entries; they will be used to contact winners for prize delivery.",
    // Entry form
    entryModalTitle: "Competition Entry",
    entryNameLabel: "Display Name",
    entryNamePh: "Name shown on the leaderboard",
    entryNameNote: "3-20 characters; letters, digits, and underscores (_) only.",
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
    entryErrNameFormat: "Display name must be 3-20 characters using only letters, digits, and underscores (_).",
    entryErrAddress: "Please enter a valid 42-character EVM address starting with 0x.",
    entryErrX: "Please verify your X account first.",
    entryErrXFailed: "X verification failed. Please try again.",
    entryErrPopup: "The popup was blocked. Please check your browser settings.",
    entryErrDupUser: "This X account has already entered the competition.",
    entryErrDupAddress: "This RISEx address is already used by another entry.",
    entryErrDupName: "This display name is already taken. Please choose another.",
    entryErrNetwork: "Failed to submit. Please try again later.",
    entryErrApiUnset: "Entry submission is being prepared. Please check back soon.",
    // Discord linking
    discordPerk1: "The winner will receive the \"Wagyu King\" role on boarding bridge!",
    discordPerk2: "Perks for \"Wagyu King\" role holders are also under consideration.",
    discordPerk3: "Live competition updates are posted on boarding bridge — come join the fun!",
    discordLinkLead: "To help us assign the \"Wagyu King\" role smoothly, participants are encouraged to link their Discord account (linking is optional).",
    discordLinkBtn: "Link Discord Account",
    discordLinked: "Linked: ",
    discordLinkNote: "Your Discord account will be linked to the X account verified at entry. If not verified yet, the X verification popup opens first.",
    discordErrLink: "Failed to link Discord. Please try again later.",
    discordErrAlreadyLinked: "This Discord account is already linked to another participant.",
    discordJoinBtn: "Join boarding bridge",
    tradingTitle: "Trading Requirements",
    condEntry: 'Entry via the entry form on this page is required to participate.',
    condReferral: 'Any referral is accepted — accounts created with other referrals or without a referral are also eligible.',
    condBoost: 'Registering via the official referral (invite code: risexjp) grants a 15% point boost.<br><a href="https://www.rise.trade/en/invite/risexjp" target="_blank" rel="noopener">https://www.rise.trade/en/invite/risexjp</a>',
    condMinDeposit: "A deposit of 200 USDC or more during the competition period is required.",
    condRoiVolume: "A minimum traded volume of $50,000 is required to be ranked in the ROI track.",
    bannerPlaceholder: "🖼️ Banner (coming soon)",
    rewardCurrentVol: "Current Total Volume: ",
    rewardNote: "●The prize pool varies across four tiers based on the total trading volume (entered accounts only) during the competition.<br>●The top three in each track will also receive a Wagyu gift (worth ¥10,000).",
    refresh: "🔄 Refresh",
    sortLabel: "Rank by:",
    rankingNote: "●Capital is the ROI denominator, calculated as (starting equity + deposits during the competition).<br>●Traders who reach the minimum volume ($50,000) get a ✅ next to their name.<br>●Traders who have not met the deposit requirement (200 USDC or more during the competition) are shown with a yellow-bordered row and a gray name.<br>●Ranks appear in the ROI ranking once both the deposit and minimum-volume requirements are met, and in the Volume ranking once the deposit requirement is met.<br>●Prize-zone ranks show the reward amount for the current tier. 🥩 marks the Wagyu gift for the top 3 (a beef ticket worth ¥10,000).",
    rankingNotePre: "●Pre-competition entry check. Deposit shows your total deposits so far (for reference).<br>●Reward eligibility is determined by deposits of 200 USDC or more during the competition period (evaluated after the competition starts).<br>●Once the competition starts, the Deposit column will be replaced by CAPITAL (starting equity + deposits during the competition).<br>●Rankings, ROI and other stats will appear once the competition starts.",
    volTotalLabel: "Total Volume: ",
    rulesTitle: "Terms & Conditions",
    rule1: "The competition will run from Aug 18 to Sep 7, 2026, until 23:59 JST.",
    rule2: "Only trades made by accounts entered via the entry form on this page count toward the rankings and prize tier determination. Any referral used at registration is accepted.",
    rule3: "A deposit of 200 USDC or more during the competition period is required to be eligible for rewards.",
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
    wagyuTicket: "Wagyu gift (a beef ticket worth ¥10,000)",
    capitalPreparing: "Preparing",
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
  updateDiscordStatus();
  // 表示中のエラーメッセージも言語に追従させる
  ["entry-error", "discord-error"].forEach((id) => {
    const errEl = document.getElementById(id);
    if (errEl && errEl.dataset.errKey) errEl.textContent = t(errEl.dataset.errKey);
  });
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
const DISCORD_POPUP_NAME = "risex-discord-link";

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

// 参加名は公式大会APIのユーザー名仕様に合わせる
// （テストネットで確認: letters, digits, underscores / 3-20文字）
const ENTRY_NAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const ENTRY_NAME_STRIP_RE = /[^A-Za-z0-9_]/g;

// 認証済みXアカウント（{ username } または null）
let xAuth = null;
let entrySubmitting = false;

// 連携済みDiscordアカウント（{ username } または null）
let discordAuth = null;
// X未認証時にDiscord連携が押された場合、X認証完了後に連携を自動再開する
let discordPendingAfterAuth = false;

function xUsernameFromSession(session) {
  const m = (session && session.user && session.user.user_metadata) || {};
  return m.user_name || m.preferred_username || m.name || "";
}

// セッションのユーザーから連携済みDiscord identityを取り出す
function discordFromUser(user) {
  const identities = (user && user.identities) || [];
  const d = identities.find((i) => i.provider === "discord");
  if (!d) return null;
  const md = d.identity_data || {};
  const username =
    (md.custom_claims && md.custom_claims.global_name) ||
    md.name || md.full_name || md.user_name || "";
  return { username };
}

function setXAuthFromSession(session) {
  xAuth = session ? { username: xUsernameFromSession(session) } : null;
  discordAuth = session ? discordFromUser(session.user) : null;
  updateXAuthStatus();
  updateDiscordStatus();
}

// Discord連携ポップアップでOAuthエラーが返された場合（別ユーザーに連携済み等）:
// セッションイベントは発火しないため、URLのエラーを親に伝えて閉じる
if (window.opener && window.name === DISCORD_POPUP_NAME) {
  const search = new URLSearchParams(location.search || "");
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const errDesc = search.get("error_description") || hash.get("error_description");
  if (errDesc) {
    try {
      window.opener.postMessage({ type: "risex-discord-link", ok: false, errDesc }, location.origin);
    } catch (e) { /* opener が閉じられていた場合は無視 */ }
    window.close();
  }
}

if (sbClient) {
  sbClient.auth.onAuthStateChange((event, session) => {
    // X認証ポップアップとして開かれている場合: 認証成功を親に伝えて閉じる
    if (window.opener && window.name === X_AUTH_POPUP_NAME) {
      if (session) {
        try {
          window.opener.postMessage({ type: "risex-x-auth", ok: true }, location.origin);
        } catch (e) { /* opener が閉じられていた場合は無視 */ }
        window.close();
      }
      return;
    }
    // Discord連携ポップアップの場合: 既存セッション復元（INITIAL_SESSION）でも
    // 発火するため、discord identityが実際に紐付いてから親に通知して閉じる
    if (window.opener && window.name === DISCORD_POPUP_NAME) {
      if (session && discordFromUser(session.user)) {
        try {
          window.opener.postMessage({ type: "risex-discord-link", ok: true }, location.origin);
        } catch (e) { /* opener が閉じられていた場合は無視 */ }
        window.close();
      }
      return;
    }
    setXAuthFromSession(session);
  });
}

// 参加名入力欄: 使用不可の文字を入力時点で取り除く。
// IME入力中の書き換えは変換を壊すため、確定後にのみ適用する
(function setupEntryNameFilter() {
  const input = document.getElementById("entry-name");
  if (!input) return;
  const filter = () => {
    const filtered = input.value.replace(ENTRY_NAME_STRIP_RE, "");
    if (input.value !== filtered) input.value = filtered;
  };
  input.addEventListener("input", (ev) => {
    if (!ev.isComposing) filter();
  });
  input.addEventListener("compositionend", filter);
})();

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

function showDiscordError(key) {
  const el = document.getElementById("discord-error");
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

// Discord連携状態の表示を更新する（言語切替時にも呼ばれる）
function updateDiscordStatus() {
  const statusEl = document.getElementById("discord-link-status");
  const btn = document.getElementById("discord-link-btn");
  if (!statusEl || !btn) return;
  if (discordAuth) {
    statusEl.textContent = `${t("discordLinked")}@${discordAuth.username}`;
    statusEl.classList.add("verified");
    btn.style.display = "none";
  } else {
    statusEl.textContent = "";
    statusEl.classList.remove("verified");
    btn.style.display = "";
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

// 認可URLをポップアップで開く。ブロックされた場合は false を返す
function openAuthPopup(url, name) {
  const w = 500;
  const h = 700;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(url, name, `width=${w},height=${h},left=${left},top=${top}`);
  return !!popup;
}

// showErr: エラー表示先（エントリーフォーム or Discordカード）
async function startXAuth(showErr = showEntryError) {
  if (!sbClient) {
    showErr("entryErrNetwork");
    return;
  }
  showErr(null);
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
    if (!openAuthPopup(data.url, X_AUTH_POPUP_NAME)) showErr("entryErrPopup");
  } catch (e) {
    console.error("x auth failed:", e);
    showErr("entryErrXFailed");
  }
}

// Discordアカウント連携（Supabase Identity Linking）。
// X認証済みセッションに対して discord identity を追加で紐付ける。
// 未認証の場合は先にX認証ポップアップを開き、完了後に自動で連携を再開する
async function startDiscordLink() {
  if (!sbClient) {
    showDiscordError("discordErrLink");
    return;
  }
  showDiscordError(null);

  const { data: sess } = await sbClient.auth.getSession();
  if (!sess.session) {
    discordPendingAfterAuth = true;
    startXAuth(showDiscordError);
    return;
  }

  try {
    const { data, error } = await sbClient.auth.linkIdentity({
      provider: "discord",
      options: {
        redirectTo: location.origin + location.pathname,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (!openAuthPopup(data.url, DISCORD_POPUP_NAME)) showDiscordError("entryErrPopup");
  } catch (e) {
    console.error("discord link failed:", e);
    if (/already linked/i.test(e.message || "")) showDiscordError("discordErrAlreadyLinked");
    else showDiscordError("discordErrLink");
  }
}

// 認証ポップアップからの完了通知を受け取り、セッションを反映する
window.addEventListener("message", async (ev) => {
  if (ev.origin !== location.origin) return;
  if (!ev.data || !sbClient) return;

  if (ev.data.type === "risex-x-auth") {
    const { data } = await sbClient.auth.getSession();
    setXAuthFromSession(data.session);
    if (data.session) {
      showEntryError(null);
      // Discord連携ボタン起点のX認証だった場合は続けて連携へ進む
      if (discordPendingAfterAuth) {
        discordPendingAfterAuth = false;
        startDiscordLink();
      }
    } else if (discordPendingAfterAuth) {
      discordPendingAfterAuth = false;
      showDiscordError("entryErrXFailed");
    } else {
      showEntryError("entryErrXFailed");
    }
    return;
  }

  if (ev.data.type === "risex-discord-link") {
    if (ev.data.ok === false) {
      showDiscordError(
        /already linked/i.test(ev.data.errDesc || "") ? "discordErrAlreadyLinked" : "discordErrLink"
      );
      return;
    }
    // linkIdentity後のユーザー情報（identities）をサーバーから取り直して反映する
    const { data } = await sbClient.auth.getUser();
    discordAuth = data && data.user ? discordFromUser(data.user) : null;
    updateDiscordStatus();
    if (discordAuth) showDiscordError(null);
    else showDiscordError("discordErrLink");
  }
});

async function submitEntry(ev) {
  ev.preventDefault();
  if (entrySubmitting) return;

  const name = document.getElementById("entry-name").value.trim();
  const address = document.getElementById("entry-address").value.trim();

  // 空欄・形式チェック（DB側でも CHECK 制約・RLS で同条件が強制される）
  if (!name) return showEntryError("entryErrName");
  if (!ENTRY_NAME_RE.test(name)) return showEntryError("entryErrNameFormat");
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
      if (error.code === "23505") {
        // UNIQUE 制約違反（重複エントリー）。制約名でアドレス重複・
        // 参加名重複・Xアカウント重複を判別する
        const msg = `${error.message || ""} ${error.details || ""}`;
        if (/address/i.test(msg)) showEntryError("entryErrDupAddress");
        else if (/name/i.test(msg)) showEntryError("entryErrDupName");
        else showEntryError("entryErrDupUser");
      } else if (error.code === "23514") {
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
  const deposits = item.deposits ?? (item.selfCheck && item.selfCheck.deposits) ?? 0;
  return deposits >= MIN_DEPOSIT_USDC;
}

// ROI部門のランキング対象。公式APIの判定（roiQualified）を優先し、
// 無ければ入金ゲート＋最低取引量で自前判定
function isRoiEligible(item) {
  if (typeof item.roiQualified === "boolean") return item.roiQualified;
  return minDepositMet(item) && (item.tradedVolume || 0) >= ROI_VOLUME_THRESHOLD;
}

// Volume部門のランキング対象（入金ゲート）。公式APIの判定を優先
function isVolEligible(item) {
  if (typeof item.volumeQualified === "boolean") return item.volumeQualified;
  return minDepositMet(item);
}

// 公式rank同士の比較（無い側は最後尾へ。両方無ければ0で次の条件へ委ねる）
function compareOfficialRank(a, b) {
  const ra = Number.isFinite(a) ? a : Infinity;
  const rb = Number.isFinite(b) ? b : Infinity;
  if (ra === rb) return 0;
  return ra - rb;
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
  const blindEl = document.getElementById("ranking-blind");
  const contentEl = document.getElementById("ranking-content");

  if (blindData) {
    const msg = (currentLang === "en" && blindData.message_en) ? blindData.message_en : (blindData.message || "");
    blindEl.textContent = msg;
    blindEl.style.display = "";
    contentEl.style.display = "none";
    return true;
  }
  blindEl.style.display = "none";
  contentEl.style.display = "";
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

// ランキングの表示モード（統合テーブルのソート切替: "roi" | "volume"）
let rankingSort = "roi";

// 表示モードに応じた並び順を返す。
// ROIモード: 公式rank（roiRank）最優先、無ければ対象者（入金200 USDC＋
// Vol $50k達成）をROI降順で並べ、未達者はその下に参考表示。
// 同率は取引量で決定（提案書 Notes）。
// Volumeモード: 公式rank（volumeRank）優先、無ければVolume降順。
// TODO: 同率時は qualifying capital で決定（RISEx仕様 v3）。大小の方向が未確定のため暫定で小さい方を上位とする
function sortForMode(participants, mode) {
  if (mode === "roi") {
    const byRoi = (a, b) =>
      compareOfficialRank(a.roiRank, b.roiRank) ||
      (b.roi - a.roi) ||
      ((b.tradedVolume || 0) - (a.tradedVolume || 0));
    const eligible = participants.filter(isRoiEligible).sort(byRoi);
    const rest = participants.filter((p) => !isRoiEligible(p)).sort(byRoi);
    return { data: [...eligible, ...rest], eligibleCount: eligible.length };
  }
  const byVol = (a, b) =>
    compareOfficialRank(a.volumeRank, b.volumeRank) ||
    ((b.tradedVolume || 0) - (a.tradedVolume || 0)) ||
    (Math.max(a.qualifyingCapital || 0, 0) - Math.max(b.qualifyingCapital || 0, 0));
  return { data: [...participants].sort(byVol), eligibleCount: 0 };
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
    renderRanking(participants, totalVolume, tier.prizes, preStart);
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

// qualifyingCapital が -1 のときは公式APIが値を未提供（準備中）
function isCapitalPending(item) {
  return (item.qualifyingCapital ?? 0) < 0;
}

function renderRankingPage(body, data, page, eligibleCount, prizes, preStart, hideCapital) {
  body.innerHTML = "";
  const prizeCount = prizes.length;
  const start = page * INITIAL_DISPLAY_COUNT;
  const slice = data.slice(start, start + INITIAL_DISPLAY_COUNT);

  // Volumeモードの順位は対象者（公式判定 or 最低入金達成）のみで採番し、
  // 対象外は "-" 表示（リワード対象外）。ページ前分を先に数えておく
  let volRank = rankingSort === "volume"
    ? data.slice(0, start).filter(isVolEligible).length
    : 0;

  slice.forEach((item, i) => {
    const index = start + i;
    const tr = document.createElement("tr");
    tr.className = "animate-fade-in";
    tr.style.animationDelay = `${i * 0.03}s`;

    // 開始前はエントリー確認表示: 累計入金のみ（順位・入賞ハイライトなし）
    if (preStart) {
      const preWarn = !minDepositMet(item);
      if (preWarn) tr.classList.add("deposit-warn");
      const preWarnClass = preWarn ? "baseline-warn" : "";
      const deposit = item.totalDeposits || 0;
      tr.innerHTML = `
        <td>-</td>
        <td class="${preWarnClass}">${traderCell(item)}</td>
        <td class="${preWarnClass}">$${deposit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      `;
      body.appendChild(tr);
      return;
    }

    // モードごとの順位採番。ROIモードは対象者が先頭に並ぶ前提でindex、
    // Volumeモードは対象者のみを数え上げる
    let ranked;
    let rankIndex;
    if (rankingSort === "roi") {
      ranked = index < eligibleCount;
      rankIndex = index;
    } else {
      ranked = isVolEligible(item);
      if (ranked) volRank++;
      rankIndex = volRank - 1;
    }
    // 入賞圏ハイライトはランキング対象者のみ
    const inPrizeZone = ranked && rankIndex < prizeCount;
    if (inPrizeZone) tr.classList.add("rank-prize");

    // 入賞圏には現在ティアのリワード額を表示。上位3名はWagyuギフト（🥩）付き
    let rankHtml = ranked ? rankCell(rankIndex) : "-";
    if (inPrizeZone) {
      const steak = rankIndex < WAGYU_TOP_N
        ? ` <span class="wagyu-mark" title="${t("wagyuTicket")}">🥩</span>`
        : "";
      rankHtml += `<div class="prize-amount">$${prizes[rankIndex].toLocaleString()}${steak}</div>`;
    }

    // 入金未達は行の背景・枠色（黄色）＋Trader/Capitalのグレー文字で表現する
    // 判定条件は各部門の従来ルールを踏襲（ROI: 入金未達 / Volume: ランキング対象外）
    const warn = rankingSort === "roi" ? !minDepositMet(item) : !ranked;
    if (warn) tr.classList.add("deposit-warn");
    const warnClass = warn ? "baseline-warn" : "";

    const roiClass = (item.roi || 0) >= 0 ? "roi-positive" : "roi-negative";
    const pnl = item.pnl || 0;
    const pnlClass = pnl >= 0 ? "roi-positive" : "roi-negative";
    const vol = item.tradedVolume || 0;

    // 公式APIが qualifying_capital 未提供（-1）の間は「準備中」表示。
    // 全員未提供の場合は hideCapital で列ごと非表示になる
    const capitalCell = hideCapital
      ? ""
      : isCapitalPending(item)
        ? `<td class="${warnClass}">${t("capitalPreparing")}</td>`
        : `<td class="${warnClass}">$${(item.qualifyingCapital || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
    const roiCell = `<td class="${roiClass}">${(item.roi || 0).toFixed(2)}%</td>`;
    const pnlCell = `<td class="${pnlClass}">$${pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;
    const volCell = `<td>$${vol.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>`;

    // ソートモードに応じて列順を入れ替える（ソート対象の列を先頭側に）
    const cells = rankingSort === "roi"
      ? [capitalCell, roiCell, pnlCell, volCell]
      : [volCell, capitalCell, roiCell, pnlCell];

    tr.innerHTML = `
      <td>${rankHtml}</td>
      <td class="${warnClass}">${traderCell(item)}</td>
      ${cells.join("\n      ")}
    `;
    body.appendChild(tr);
  });
}

function renderRanking(participants, totalVolume, prizes, preStart) {
  const totalEl = document.getElementById("vol-total");
  if (totalEl && totalVolume != null) {
    totalEl.textContent = `$${totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  const body = document.getElementById("ranking-body");
  const card = body.closest(".dashboard-card");

  // ソート切替タブ（開始前はランキングが無いため非表示）
  const sortTabsEl = document.getElementById("sort-tabs");
  sortTabsEl.style.display = preStart ? "none" : "";
  sortTabsEl.querySelectorAll(".sort-tab").forEach((b) => {
    b.classList.toggle("sort-tab--active", b.dataset.sort === rankingSort);
  });
  // 再描画のたびにリスナーが積み重ならないよう onclick で上書きする
  sortTabsEl.onclick = (e) => {
    const btn = e.target.closest(".sort-tab");
    if (!btn || btn.dataset.sort === rankingSort) return;
    rankingSort = btn.dataset.sort;
    render();
  };

  let data;
  let eligibleCount;
  if (preStart) {
    // 入金額の大きい順に表示（順位・入賞ハイライトなし）
    data = [...participants].sort((a, b) => (b.totalDeposits || 0) - (a.totalDeposits || 0));
    eligibleCount = 0;
  } else {
    ({ data, eligibleCount } = sortForMode(participants, rankingSort));
  }

  // 全員の qualifying_capital が未提供（-1）の間は Capital 列ごと非表示にする
  const hideCapital = !preStart && data.length > 0 && data.every(isCapitalPending);

  // 開始前はヘッダを Rank / Trader / Deposit の3列に差し替える。
  // 開始後はソート対象の列（ROI / Volume）を強調し、行と同じ列順で並べる
  const theadRow = document.getElementById("ranking-head-row");
  if (preStart) {
    theadRow.innerHTML = "<th>Rank</th><th>Trader</th><th>Deposit</th>";
  } else {
    const thCapital = hideCapital ? "" : "<th>Capital</th>";
    const thRoi = `<th${rankingSort === "roi" ? ' class="th-sorted"' : ""}>ROI</th>`;
    const thPnl = "<th>PnL</th>";
    const thVol = `<th${rankingSort === "volume" ? ' class="th-sorted"' : ""}>Volume</th>`;
    const ths = rankingSort === "roi"
      ? [thCapital, thRoi, thPnl, thVol]
      : [thVol, thCapital, thRoi, thPnl];
    theadRow.innerHTML = `<th>Rank</th><th>Trader</th>${ths.join("")}`;
  }

  // 注記も開始前用に切り替える（言語切替時は render() 経由で再設定される）
  const noteEl = card.querySelector("[data-i18n-html]");
  if (noteEl) {
    const key = preStart ? "rankingNotePre" : "rankingNote";
    noteEl.setAttribute("data-i18n-html", key);
    noteEl.innerHTML = t(key);
  }

  const showPage = (page) => {
    renderRankingPage(body, data, page, eligibleCount, prizes, preStart, hideCapital);
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
