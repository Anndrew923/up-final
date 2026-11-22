/**
 * Overall homologation ladder ↔ human-scale physiology labels (homepage probe).
 * WHY: Aligns with App overallGrade + humanPraise.populationClass without importing App i18n.
 * LEGEND + PANTHEON share「地表最強」on the human-scale decade ladder.
 * IP fence: display ranges & labels only — no scoring coefficients.
 *
 * Structure codes are intentionally condensed for public cards vs App detail sheets.
 */

export type OverallGradeTierId =
  | 'BASE'
  | 'TIER_40'
  | 'TIER_50'
  | 'TIER_60'
  | 'TIER_70'
  | 'TIER_80'
  | 'TIER_90'
  | 'TIER_100'
  | 'TIER_110'
  | 'TIER_120'
  | 'TIER_130'
  | 'TIER_140'
  | 'LEGEND'
  | 'PANTHEON';

/** Visual tone: 0–99 energy blue; 100+ overclock / pantheon amber. */
export type OverallGradeAccent = 'energy' | 'amber';

export interface OverallGradeTier {
  id: OverallGradeTierId;
  scoreRange: string;
  physiologyClass: string;
  /** Full homologation (EN code + ZH name). ZH slice via extractHomologationZh. */
  homologation: string;
  structureCode: string;
  /** Highlight the 100-point elite overclock watershed card. */
  eliteWatershed?: boolean;
}

export const overallGradeTiers: readonly OverallGradeTier[] = [
  {
    id: 'BASE',
    scoreRange: '0–39.99',
    physiologyClass: '嬰兒期',
    homologation: 'STOCK COMMUTER 原廠常規街車',
    structureCode: 'STOCK ‧ 原廠初始素車',
  },
  {
    id: 'TIER_40',
    scoreRange: '40–49.99',
    physiologyClass: '探索期',
    homologation: 'STREET MODIFIED 街道初階改裝',
    structureCode: 'STOCK ‧ 街道精調',
  },
  {
    id: 'TIER_50',
    scoreRange: '50–59.99',
    physiologyClass: '新手村',
    homologation: 'STAGE 1 TUNE 進階一階調校',
    structureCode: 'Inline-4 Turbo ‧ 街道前驅鋼砲',
  },
  {
    id: 'TIER_60',
    scoreRange: '60–69.99',
    physiologyClass: '大眾健康常模',
    homologation: 'CLUB TRACK SPEC 俱樂部賽道版',
    structureCode: 'Inline-4 Turbo ‧ Stage 1',
  },
  {
    id: 'TIER_70',
    scoreRange: '70–79.99',
    physiologyClass: '進階訓練者',
    homologation: 'TRACKDAY ENTHUSIAST 週末熱道挑戰',
    structureCode: 'Mid-Engine ‧ 幾何流線完全體 (街道態)',
  },
  {
    id: 'TIER_80',
    scoreRange: '80–89.99',
    physiologyClass: '高階玩家',
    homologation: 'AMATEUR TIME ATTACK 業餘挑戰組',
    structureCode: 'Mid-Engine ‧ 幾何流線完全體 (賽道態)',
  },
  {
    id: 'TIER_90',
    scoreRange: '90–99.99',
    physiologyClass: '凡人頂尖',
    homologation: 'UNLIMITED ATTACK 極限計時賽規',
    structureCode: 'Flat-6 NA ‧ 賽道高轉剛性軸 (Club)',
  },
  {
    id: 'TIER_100',
    scoreRange: '100–109.99',
    physiologyClass: '凡體覺醒',
    homologation: 'REGIONAL CHAMPIONSHIP 地區錦標賽規',
    structureCode: 'Flat-6 NA ‧ 賽道高轉剛性軸 (Championship)',
    eliteWatershed: true,
  },
  {
    id: 'TIER_110',
    scoreRange: '110–119.99',
    physiologyClass: '超凡入聖',
    homologation: 'STAGE 2 COMPETITION 精銳國際錦標',
    structureCode: 'V8-TwinTurbo ‧ Stage 2 重裝超壓',
  },
  {
    id: 'TIER_120',
    scoreRange: '120–129.99',
    physiologyClass: '歷史級別',
    homologation: 'PRO ENDURANCE SPEC 職業耐力賽規',
    structureCode: 'V8-TwinTurbo ‧ Stage 2 (Endurance)',
  },
  {
    id: 'TIER_130',
    scoreRange: '130–139.99',
    physiologyClass: '統計神話',
    homologation: 'FACTORY PROTOTYPE 原型工廠賽車',
    structureCode: 'V8-TwinTurbo ‧ Stage 3 賽道魔王',
  },
  {
    id: 'TIER_140',
    scoreRange: '140–149.99',
    physiologyClass: '怪物領域',
    homologation: 'STAGE 3 APEX 頂級超驗載具',
    structureCode: 'V8-TwinTurbo ‧ Stage 3 (Apex)',
  },
  {
    id: 'LEGEND',
    scoreRange: '150–179.99',
    physiologyClass: '地表最強',
    homologation: 'LEGENDARY MONSTER 傳奇改裝怪獸',
    structureCode: 'PANTHEON ‧ 終極星艦概念體 (Legend)',
  },
  {
    id: 'PANTHEON',
    scoreRange: '180+',
    physiologyClass: '地表最強',
    homologation: 'PANTHEON EXPERIMENTAL 萬神殿實驗車',
    structureCode: 'PANTHEON ‧ 終極星艦概念體',
  },
];

const TIER_BY_ID: Readonly<Record<OverallGradeTierId, OverallGradeTier>> =
  Object.fromEntries(overallGradeTiers.map((tier) => [tier.id, tier])) as Record<
    OverallGradeTierId,
    OverallGradeTier
  >;

export type OverallGradeBandId =
  | 'foundation'
  | 'norm'
  | 'overclock'
  | 'pantheon';

export interface OverallGradeBand {
  id: OverallGradeBandId;
  label: string;
  rangeHint: string;
  accent: OverallGradeAccent;
  tierIds: readonly OverallGradeTierId[];
}

/** Four probe bands for homepage — default landing is「進階常模 60–99」. */
export const overallGradeBands: readonly OverallGradeBand[] = [
  {
    id: 'foundation',
    label: '基礎起步',
    rangeHint: '0–59',
    accent: 'energy',
    tierIds: ['BASE', 'TIER_40', 'TIER_50'],
  },
  {
    id: 'norm',
    label: '進階常模',
    rangeHint: '60–99',
    accent: 'energy',
    tierIds: ['TIER_60', 'TIER_70', 'TIER_80', 'TIER_90'],
  },
  {
    id: 'overclock',
    label: '破百超頻',
    rangeHint: '100–149',
    accent: 'amber',
    tierIds: ['TIER_100', 'TIER_110', 'TIER_120', 'TIER_130', 'TIER_140'],
  },
  {
    id: 'pantheon',
    label: '殿堂神話',
    rangeHint: '150+',
    accent: 'amber',
    tierIds: ['LEGEND', 'PANTHEON'],
  },
];

const BAND_BY_ID: Readonly<Record<OverallGradeBandId, OverallGradeBand>> =
  Object.fromEntries(overallGradeBands.map((band) => [band.id, band])) as Record<
    OverallGradeBandId,
    OverallGradeBand
  >;

export const OVERALL_GRADE_DEFAULT_BAND: OverallGradeBandId = 'norm';

export const overallGradeLadderMeta = {
  kicker: '戰力段位光譜',
  title: '14 階評級探測器',
  lead:
    '對照綜合戰力分數落點：運動生理學人類尺度位階 × 賽會認證（Homologation Grade）。切換下方階段，找出你目前的車系階梯。',
  eliteBadge: '破百超頻',
} as const;

/**
 * WHY: Single SSOT for card tone — avoids per-tier accent drifting from band groups.
 * TIER_100–140 + LEGEND/PANTHEON → amber; BASE–TIER_90 → energy.
 */
export function accentForTierId(id: OverallGradeTierId): OverallGradeAccent {
  if (id === 'LEGEND' || id === 'PANTHEON') return 'amber';
  if (id.startsWith('TIER_1')) return 'amber';
  return 'energy';
}

/** ZH-only homologation label (strip English prefix for dense mobile row). */
export function extractHomologationZh(homologation: string): string {
  const index = homologation.search(/[\u4e00-\u9fff]/u);
  return index >= 0 ? homologation.slice(index) : homologation;
}

/** Resolve band tiers in declared band order (not overall array scan). */
export function tiersForBand(bandId: OverallGradeBandId): readonly OverallGradeTier[] {
  return BAND_BY_ID[bandId].tierIds.map((id) => TIER_BY_ID[id]);
}
