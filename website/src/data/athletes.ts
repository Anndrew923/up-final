/**
 * Athletes / community showcase SSOT (homepage `#athletes`).
 * WHY: Append-only roster — homepage rail derives via `homepageAthleteRoster()`.
 * `open` seats stay in the array for future specialty fills but never render on home.
 * Grow verified/community entries to 20–30+ without touching component logic.
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
  /** Full metric line — retained in SSOT for future detail surfaces, not home card UI. */
  line: string;
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
export interface VerifiedAthleteEntry extends AthleteRosterBase {
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
}

/** Everyday trainee feedback — mass-market social proof. */
export interface CommunityAthleteEntry extends AthleteRosterBase {
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
