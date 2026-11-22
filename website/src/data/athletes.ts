/**
 * Athlete endorsement wall SSOT.
 * WHY: Marketing unlocks / swaps slots here — no HomePage edits required.
 *
 * Founder assets (drop into `website/public/`):
 * - `/founder-battle-card.png` — telemetry battle card; missing → dashed placeholder
 * Featured founder card has no circular avatar (portrait lives on the battle card).
 */

export type AthleteStatus = 'verified' | 'locked';

export interface AthleteMetricGroup {
  /** Group heading, e.g. `體組成基準` */
  label: string;
  /** Single readable metric line for that group */
  line: string;
}

export interface Athlete {
  id: string;
  /** Specialty / role kicker above the name */
  badge: string;
  name: string;
  /** Subtitle under name */
  role: string;
  /** Optional circular portrait for simple verified cards (not used on featured founder). */
  avatarUrl?: string;
  /**
   * Optional telemetry battle-card image (lightbox on click).
   * Founder default: `/founder-battle-card.png`
   */
  battleCardUrl?: string;
  /** Structured metric groups (preferred for verified founder layout). */
  metricGroups?: AthleteMetricGroup[];
  /** Flat metric lines (legacy / simple verified cards). */
  metrics?: string[];
  quote?: string;
  status: AthleteStatus;
  /** Locked-slot one-liner. */
  positioning?: string;
}

export const athletes: Athlete[] = [
  {
    id: 'founder-anndrew',
    status: 'verified',
    badge: '創辦人實測標竿',
    name: 'Anndrew',
    role: '創辦人 · 肌力體能教練 · 84.7 kg 量級',
    battleCardUrl: '/founder-battle-card.png',
    metricGroups: [
      {
        label: '體組成基準',
        line: '身高 181 cm · 體重 84.7 kg · 體脂率 9.2% · 骨骼肌量 44.4 kg',
      },
      {
        label: '五大核心肌力',
        line: '平板臥推 135 kg · 槓鈴深蹲 170 kg · 硬舉 180 kg · 滑輪下拉 130 kg · 站姿肩推 70 kg',
      },
      {
        label: '爆發、心肺與握力',
        line: '垂直跳 70 cm · 立定跳遠 283 cm · 庫珀 12 分鐘跑 2,800 m · 單手握力 70.5 kg',
      },
    ],
    quote: '先測準自己，再對準常模——終結訓練內耗。',
  },
  {
    id: 'recruit-bodybuilding',
    status: 'locked',
    badge: '健美選手 // FFMI & 骨骼肌量',
    name: '健美專項代表',
    role: '席位招募中',
    positioning: '聚焦 FFMI 與骨骼肌量體組成標竿。',
  },
  {
    id: 'recruit-hyrox',
    status: 'locked',
    badge: 'HYROX 混合健身 // 六邊形全能戰力',
    name: 'HYROX 專項代表',
    role: '席位招募中',
    positioning: '驗證混合健身六邊形全能表現。',
  },
  {
    id: 'recruit-powerlifting',
    status: 'locked',
    badge: '健力三項 // 絕對肌力與 DOTS',
    name: '健力專項代表',
    role: '席位招募中',
    positioning: '對標絕對肌力與跨量級 DOTS。',
  },
];
