/**
 * Athletes / community showcase SSOT (homepage `#athletes`).
 * WHY: Append-only roster — homepage rail derives via `homepageAthleteRoster()`.
 * `open` seats stay in the array for future specialty fills but never render on home.
 * Grow verified/community entries to 20–30+ without touching component logic.
 *
 * Assets (optional, under `website/public/`):
 * - `/founder-battle-card.png` — Anndrew telemetry battle card
 * - `/athletes/mens-physique-ffmi-battle-card.jpg` — men's physique FFMI benchmark
 *
 * Still crop: unified frame is the default in `athleteStillFrame`.
 * Optional class overrides remain escape hatches for rare one-offs.
 */

export type AthleteSpecialty =
  | 'bodybuilding'
  | 'hyrox'
  | 'powerlifting'
  | 'combat'
  | 'coach';

export interface AthleteMetricGroup {
  /** Group heading, e.g. `體組成基準` */
  label: string;
  /** Full metric line — retained in SSOT for future detail surfaces, not home card UI. */
  line: string;
}

/**
 * Optional still crop — only for entries that render battle art.
 * WHY: Keep off `open` seats. Omit to use the shared default frame.
 */
interface AthleteStillCrop {
  /** Escape-hatch object-* override (wins over default). */
  stillObjectClass?: string;
  /** Escape-hatch box override (wins over default). */
  stillBoxClass?: string;
}

/** Shared identity fields across roster kinds. */
interface AthleteRosterBase {
  id: string;
  /** Card / list primary label */
  name: string;
  /** Compact specialty / outcome tag (optional chip on home cards) */
  pickerTag: string;
  /** Optional portrait / battle still */
  avatarUrl?: string;
}

/** Verified measured athlete / coach benchmark. */
export interface VerifiedAthleteEntry
  extends AthleteRosterBase,
    AthleteStillCrop {
  kind: 'verified';
  specialty: AthleteSpecialty;
  /** Eyebrow above the name */
  badge: string;
  /** Subtitle under name */
  role: string;
  battleCardUrl?: string;
  /** Overall score chip on the battle-card art (e.g. `98.49`). */
  battleScoreHint?: string;
  /** Full structured metrics — data SSOT only; homepage cards omit this list. */
  metricGroups: readonly AthleteMetricGroup[];
  /** Optional long-form bio for TelemetryDossierModal. */
  bio?: string;
  /**
   * Competition / coaching highlights (newest first).
   * WHY: Keep as plain lines so dossier + future surfaces share one SSOT list.
   */
  careerHighlights?: readonly string[];
  /** Optional closing quote / motto for dossier. */
  quote?: string;
}

/** Everyday trainee feedback — mass-market social proof. */
export interface CommunityAthleteEntry
  extends AthleteRosterBase,
    AthleteStillCrop {
  kind: 'community';
  /** Nickname display (may match `name`) */
  displayName: string;
  /** Occupation or training tenure line */
  context: string;
  /** Outcome chips, e.g. `增肌不胖` — home shows at most one */
  changeTags: readonly string[];
  battleCardUrl?: string;
  battleScoreHint?: string;
  /** Short authentic testimonial */
  testimonial: string;
}

/**
 * Open benchmark seat — specialty still recruiting.
 * Kept in roster for future fills; filtered out of homepage rail.
 */
export interface OpenAthleteEntry extends AthleteRosterBase {
  kind: 'open';
  specialty: Exclude<AthleteSpecialty, 'coach'>;
  title: string;
  focus: string;
}

export type AthleteRosterEntry =
  | VerifiedAthleteEntry
  | CommunityAthleteEntry
  | OpenAthleteEntry;

/**
 * Append new people here only — homepage rail recomputes via `homepageAthleteRoster`.
 * Anndrew metrics must stay verbatim (product SSOT).
 */
export const athleteRoster: readonly AthleteRosterEntry[] = [
  {
    id: 'founder-anndrew',
    kind: 'verified',
    specialty: 'coach',
    name: 'Anndrew',
    pickerTag: '主要開發者',
    badge: '主要開發者實測標竿',
    role: '主要開發者 · 肌力體能教練',
    battleCardUrl: '/founder-battle-card.png',
    avatarUrl: '/founder-battle-card.png',
    battleScoreHint: '98.49',
    metricGroups: [
      {
        label: '體組成基準',
        line: '身高 181 cm · 體重 84.7 kg · 體脂率 9.2% · 骨骼肌量 44.4 kg',
      },
      {
        label: '五大核心肌力',
        line: '平板臥推 135 kg · 槓鈴深蹲 170 kg · 硬舉 180 kg · 滑輪下拉 130 kg · 站姿槓鈴肩推 70 kg',
      },
      {
        label: '爆發、心肺與握力',
        line: '垂直跳 70 cm · 立定跳遠 283 cm · 庫珀 12 分鐘跑 2,800 m · 單手握力 70.5 kg',
      },
    ],
  },
  {
    id: 'benchmark-mens-physique',
    kind: 'verified',
    specialty: 'bodybuilding',
    name: 'Fin',
    pickerTag: 'FFMI 標竿',
    badge: '專項運動員實測標竿',
    role: '中華台北健美國家代表隊・男子健體國手',
    battleCardUrl: '/athletes/mens-physique-ffmi-battle-card.jpg',
    avatarUrl: '/athletes/mens-physique-ffmi-battle-card.jpg',
    battleScoreHint: '93.42',
    metricGroups: [
      {
        label: '體組成基準',
        line: '身高 170.5 cm · 體重 74 kg · 體脂率 6% · FFMI 23.93 · 戰力評分 93.42（凡人頂尖）',
      },
    ],
    // WHY: App About advisors (zh-Hant/en about.json → Fin Chou) mirrors this
    // bio / career / quote. Website + App stay separate packages — update both
    // when Fin's resume changes.
    bio: '中華台北健美國家代表隊成員，亦代表台北市健美代表隊與頗行戰隊。專精自然健身與競技備賽指導，不依賴藥物輔助，以科學訓練與營養管理達到競賽水準。',
    careerHighlights: [
      '累積 14 面國內外賽事獎牌（含 9 金、3 銀、2 銅）',
      '2026 年全國健身先生錦標賽｜資深形體第一名',
      '2026 年桃園全民運｜男子形體第二量級第二名',
      '2025 年 IFBB 環球先生國際賽｜Fit Model 第六名',
      '2024 年全國健身錦標賽｜量級雙金，並榮獲全場總冠軍',
      '2022 年總統盃資深形體金牌；亞洲同志運動會男子形體雙人組金牌',
      '2021 年 Fit Model 形體雙金與全場總季軍；2020 年 WNBF 男子形體銀牌',
      '堅持自然健身理念，具備豐富的競技備賽與體適能指導經驗',
    ],
    quote: '用競賽經驗，幫助每個人達到最佳的身體狀態！',
  },
  {
    id: 'open-hyrox',
    kind: 'open',
    specialty: 'hyrox',
    name: 'HYROX',
    pickerTag: '六邊形全能',
    title: 'HYROX 專項標竿席',
    focus:
      '在《最強肉體》中，HYROX 組聚焦大重量肌力推拉與高強度心肺耐力的六邊形均衡度，驗證混合健身全能表現。',
  },
  {
    id: 'open-powerlifting',
    kind: 'open',
    specialty: 'powerlifting',
    name: '健力三項',
    pickerTag: 'DOTS 肌力',
    title: '健力三項標竿席',
    focus:
      '在《最強肉體》中，健力三項組聚焦 DOTS 體重係數校正後的絕對肌力與單手握力輸出，對標跨量級力量標竿。',
  },
];

/**
 * Homepage `#athletes` rail — real entrants only.
 * WHY: Keep `open` seats in `athleteRoster` for future specialty fills, but never
 * show empty recruiting shells on the conversion home.
 */
export type HomepageAthleteEntry = VerifiedAthleteEntry | CommunityAthleteEntry;

export function homepageAthleteRoster(
  roster: readonly AthleteRosterEntry[] = athleteRoster
): readonly HomepageAthleteEntry[] {
  return roster.filter(
    (entry): entry is HomepageAthleteEntry => entry.kind !== 'open'
  );
}

/** First grapheme for monogram avatars when no image is set. */
export function athleteMonogram(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return [...trimmed][0]!.toUpperCase();
}

/** Thumb — avatar preferred, else battle still. */
export function athletePickerImageSrc(
  entry: AthleteRosterEntry
): string | undefined {
  if (entry.avatarUrl) return entry.avatarUrl;
  if (entry.kind === 'verified' || entry.kind === 'community') {
    return entry.battleCardUrl;
  }
  return undefined;
}
