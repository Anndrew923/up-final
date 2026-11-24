/**
 * Athletes / community showcase SSOT (homepage `#athletes`).
 * WHY: Append-only roster — UI filters and the horizontal picker derive from this
 * array only. Grow to 20–30+ entries without touching component logic.
 *
 * Assets (optional, under `website/public/`):
 * - `/founder-battle-card.png` — Anndrew telemetry battle card
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
  /** Full metric line — never trim for layout convenience. */
  line: string;
}

/** Shared picker chrome — short label under the avatar chip. */
interface AthleteRosterBase {
  id: string;
  /** Horizontal picker primary label */
  name: string;
  /** Compact chip under name (specialty / outcome tag) */
  pickerTag: string;
  /**
   * Optional circular avatar / battle still for the picker.
   * When absent, UI renders a monogram badge from `name`.
   */
  avatarUrl?: string;
}

/** Verified measured athlete / coach benchmark. */
export interface VerifiedAthleteEntry extends AthleteRosterBase {
  kind: 'verified';
  specialty: AthleteSpecialty;
  /** Orange kicker above the name on the detail card */
  badge: string;
  /** Subtitle under name */
  role: string;
  battleCardUrl?: string;
  /** Overall score chip on the battle-card thumb (e.g. `98.49`). */
  battleScoreHint?: string;
  /** Full structured metric groups — every measured field retained. */
  metricGroups: readonly AthleteMetricGroup[];
  quote?: string;
}

/** Everyday trainee feedback — mass-market social proof. */
export interface CommunityAthleteEntry extends AthleteRosterBase {
  kind: 'community';
  /** Nickname display (may match `name`) */
  displayName: string;
  /** Occupation or training tenure line */
  context: string;
  /** Outcome chips, e.g. `增肌不胖` */
  changeTags: readonly string[];
  /** Optional battle-card thumb for lightbox */
  battleCardUrl?: string;
  battleScoreHint?: string;
  /** Short authentic testimonial */
  testimonial: string;
}

/** Open benchmark seat — specialty still recruiting. */
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

/** Filter rail ids — `all` always available; others hide when roster has zero hits. */
export type AthleteFilterId =
  | 'all'
  | 'coach'
  | 'bodybuilding'
  | 'hyrox'
  | 'powerlifting'
  | 'combat'
  | 'community';

export interface AthleteFilterDef {
  id: AthleteFilterId;
  label: string;
}

export const athleteFilterDefs: readonly AthleteFilterDef[] = [
  { id: 'all', label: '全部' },
  { id: 'coach', label: '教練與開發者' },
  { id: 'bodybuilding', label: '健美' },
  { id: 'hyrox', label: 'HYROX' },
  { id: 'powerlifting', label: '健力' },
  { id: 'combat', label: '格鬥' },
  { id: 'community', label: '一般訓練者' },
];

export const athleteRecruitInvite =
  '歡迎頂尖專項訓練者提交實測戰報，進駐官方標竿牆。';

/**
 * Append new people here only — picker + filters recompute automatically.
 * Anndrew metrics + quote must stay verbatim (product SSOT).
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
    quote: '讓統計數字停止你的內耗，讓我看看你有多強！',
  },
  {
    id: 'open-bodybuilding',
    kind: 'open',
    specialty: 'bodybuilding',
    name: '健美選手',
    pickerTag: 'FFMI 標竿',
    title: '健美專項標竿席',
    focus:
      '在《最強肉體》中，健美組聚焦 FFMI 除脂體重指數與低體脂肌肉量比例，作為體組成與肌量美學的官方標竿。',
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

export function entryMatchesFilter(
  entry: AthleteRosterEntry,
  filter: AthleteFilterId
): boolean {
  if (filter === 'all') return true;
  if (filter === 'community') return entry.kind === 'community';
  if (filter === 'coach') {
    return entry.kind === 'verified' && entry.specialty === 'coach';
  }
  if (entry.kind === 'community') return false;
  return entry.specialty === filter;
}

export function filtersWithRosterHits(
  roster: readonly AthleteRosterEntry[] = athleteRoster
): readonly AthleteFilterDef[] {
  return athleteFilterDefs.filter(
    (def) =>
      def.id === 'all' || roster.some((entry) => entryMatchesFilter(entry, def.id))
  );
}

export function rosterForFilter(
  filter: AthleteFilterId,
  roster: readonly AthleteRosterEntry[] = athleteRoster
): readonly AthleteRosterEntry[] {
  return roster.filter((entry) => entryMatchesFilter(entry, filter));
}

/** First grapheme for monogram avatars when no image is set. */
export function athleteMonogram(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return [...trimmed][0]!.toUpperCase();
}

/** Picker / community thumb — avatar preferred, else battle still. */
export function athletePickerImageSrc(
  entry: AthleteRosterEntry
): string | undefined {
  if (entry.avatarUrl) return entry.avatarUrl;
  if (entry.kind === 'verified' || entry.kind === 'community') {
    return entry.battleCardUrl;
  }
  return undefined;
}
