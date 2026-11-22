/**
 * Athlete endorsement wall SSOT.
 * WHY: Marketing can unlock slots by filling fields here — no page edits required.
 */

export type AthleteStatus = 'live' | 'recruiting';

export type AthleteSpecialty =
  | 'founder'
  | 'bodybuilding'
  | 'hyrox'
  | 'powerlifting';

export interface AthleteCard {
  id: string;
  status: AthleteStatus;
  specialty: AthleteSpecialty;
  /** HUD-style specialty tag, e.g. `健美選手 // FFMI & 骨骼肌量` */
  specialtyTag: string;
  name: string;
  title: string;
  /** Optional photo URL under /public or absolute CDN. */
  photoUrl?: string;
  /** Short measured highlight lines shown on live cards. */
  metrics?: string[];
  quote?: string;
  eventHeadline?: string;
}

export const athletesData: AthleteCard[] = [
  {
    id: 'founder-benchmark',
    status: 'live',
    specialty: 'founder',
    specialtyTag: '創辦人內測標竿 // 600kg 級距目標實測',
    name: '創辦人標竿示範',
    title: 'Official Dyno Benchmark',
    eventHeadline: '內測 600kg 級距目標實測',
    metrics: [
      '六軸綜合戰力 — 標竿校準中',
      '自由重量平板臥推／槓鈴深蹲／硬舉 (傳統／相撲)',
      'Carbon 黑金戰報已驗證導出',
    ],
    quote:
      '先把自己測準，再把演算法對準人口學常模——這不是感覺訓練，是可重現的測功。',
  },
  {
    id: 'recruit-bodybuilding',
    status: 'recruiting',
    specialty: 'bodybuilding',
    specialtyTag: '健美選手 // FFMI & 骨骼肌量',
    name: '官方認證專項代表',
    title: '招募／解鎖中',
  },
  {
    id: 'recruit-hyrox',
    status: 'recruiting',
    specialty: 'hyrox',
    specialtyTag: 'HYROX 混合健身 // 六邊形全能戰力',
    name: '官方認證專項代表',
    title: '招募／解鎖中',
  },
  {
    id: 'recruit-powerlifting',
    status: 'recruiting',
    specialty: 'powerlifting',
    specialtyTag: '健力三項 // 絕對肌力與 DOTS',
    name: '官方認證專項代表',
    title: '招募／解鎖中',
  },
];
