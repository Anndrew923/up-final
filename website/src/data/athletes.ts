/**
 * Athlete endorsement showcase SSOT.
 * WHY: Tab labels + full verified metrics + recruit copy live here — UI stays presentational.
 *
 * Featured lead-developer assets (drop into `website/public/`):
 * - `/founder-battle-card.png` — telemetry battle card filename (stable public path)
 */

export interface AthleteMetricGroup {
  /** Group heading, e.g. `體組成基準` */
  label: string;
  /** Full metric line — never trim for layout convenience. */
  line: string;
}

export interface Athlete {
  id: string;
  /** Specialty / role kicker above the name */
  badge: string;
  name: string;
  /** Subtitle under name */
  role: string;
  /**
   * Optional telemetry battle-card image (lightbox on click).
   * Lead-dev default path: `/founder-battle-card.png` (stable public filename).
   */
  battleCardUrl?: string;
  /**
   * Overall score chip on the battle-card tile (e.g. `98.49`).
   * WHY: Lives in data SSOT so UI never hardcodes measured readout numerals.
   */
  battleScoreHint?: string;
  /** Full structured metric groups — every measured field retained. */
  metricGroups?: readonly AthleteMetricGroup[];
  quote?: string;
}

export interface AthleteRecruitCopy {
  title: string;
  focus: string;
}

/** Discriminated tabs — recruit always carries copy; verified has none. */
export type AthleteShowcaseTab =
  | { id: string; tab: string; kind: 'verified' }
  | { id: string; tab: string; kind: 'recruit'; recruit: AthleteRecruitCopy };

/** Verified endorsement — Anndrew lead-dev card (full measured wall). */
export const featuredAthlete: Athlete = {
  id: 'founder-anndrew',
  badge: '主要開發者實測標竿',
  name: 'Anndrew',
  role: '主要開發者 · 肌力體能教練',
  battleCardUrl: '/founder-battle-card.png',
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
};

/**
 * Four specialty tabs — verified first, then open recruit seats with full focus copy.
 */
export const athleteShowcaseTabs: readonly AthleteShowcaseTab[] = [
  {
    id: 'anndrew',
    tab: 'Anndrew · 主要開發者',
    kind: 'verified',
  },
  {
    id: 'bodybuilding',
    tab: '健美選手 · FFMI 標竿',
    kind: 'recruit',
    recruit: {
      title: '健美專項標竿席',
      focus:
        '在《最強肉體》中，健美組聚焦 FFMI 除脂體重指數與低體脂肌肉量比例，作為體組成與肌量美學的官方標竿。',
    },
  },
  {
    id: 'hyrox',
    tab: 'HYROX · 六邊形全能',
    kind: 'recruit',
    recruit: {
      title: 'HYROX 專項標竿席',
      focus:
        '在《最強肉體》中，HYROX 組聚焦大重量肌力推拉與高強度心肺耐力的六邊形均衡度，驗證混合健身全能表現。',
    },
  },
  {
    id: 'powerlifting',
    tab: '健力三項 · DOTS 肌力',
    kind: 'recruit',
    recruit: {
      title: '健力三項標竿席',
      focus:
        '在《最強肉體》中，健力三項組聚焦 DOTS 體重係數校正後的絕對肌力與單手握力輸出，對標跨量級力量標竿。',
    },
  },
];

export const athleteRecruitInvite =
  '歡迎頂尖專項訓練者提交實測戰報，進駐官方標竿牆。';
