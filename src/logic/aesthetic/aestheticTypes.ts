import type { ScoreMap } from '../../types/scoring';

export type AestheticGender = 'male' | 'female';

export const OVERALL_TITLE_IDS = [
  'native',
  'urban',
  'health',
  'advanced',
  'highTier',
  'peakMortal',
  'awakened',
  'transcendent',
  'historic',
  'mythic',
  'monster',
  'apexEarth',
] as const;

export type OverallTitleId = (typeof OVERALL_TITLE_IDS)[number];

export const VISUAL_SPEC_IDS = [
  'pantheonApexDry',
  'pantheonApexDryF',
  'pantheonApex',
  'pantheonApexF',
  'pantheonColossus',
  'pantheonColossusF',
  'titanDryGod',
  'valkyrieDryGoddess',
  'titanTemple',
  'valkyrieApex',
  'colossusWall',
  'colossusShield',
  'historicDryGod',
  'historicDryGoddess',
  'historicBeast',
  'historicAmazonian',
  'unshakableWall',
  'unshakableShield',
  'transcendentDry',
  'transcendentDryF',
  'transcendentTitan',
  'valkyrieTranscendent',
  'ironFortress',
  'ironFortressF',
  'awakenedDryGod',
  'athenaDryGod',
  'awakenedGodform',
  'athenaAwakened',
  'heavyTitan',
  'heavyAmazonian',
  'assassin',
  'huntress',
  'marbleChiseled',
  'greekGoddess',
  'peakAesthetic',
  'athenaForm',
  'titanColossus',
  'amazonianStrength',
  'striatedLean',
  'chiseledWaist',
  'goldenVTaper',
  'goldenHourglass',
  'heavyArmor',
  'curvyPower',
  'athleticFrame',
  'sleekAthletic',
  'solidBase',
  'firmBase',
  'cleanTone',
  'tonedGrace',
  'steadyDefense',
  'softCurve',
  'urbanDaily',
  'urbanGrace',
  'nativeLean',
  'nativeGrace',
  'nativeStock',
  'nativeCurve',
] as const;

export type VisualSpecId = (typeof VISUAL_SPEC_IDS)[number];

export const DECADE_BAND_IDS = [
  'base',
  '50',
  '60',
  '70',
  '80',
  '90',
  '100',
  '110',
  '120',
  '130',
] as const;

export type DecadeBandId = (typeof DECADE_BAND_IDS)[number];

export interface AestheticResolverInput {
  overallScore: number;
  scores: ScoreMap;
  gender: AestheticGender | null;
  bodyFatPct: number | null;
  peakKg: number | null;
}

export interface AestheticVisualResult {
  id: VisualSpecId | null;
  score: number | null;
  unmeasured: boolean;
  bodyFatMissing: boolean;
}

export interface AestheticForceResult {
  id: DecadeBandId | null;
  score: number | null;
  unmeasured: boolean;
}

export interface AestheticKineticResult {
  id: DecadeBandId | null;
  score: number | null;
  unmeasured: boolean;
}

export interface AestheticResolverOutput {
  overallTitleId: OverallTitleId;
  visual: AestheticVisualResult;
  force: AestheticForceResult;
  kinetic: AestheticKineticResult;
  hasTitanGrip: boolean;
  peakKg: number | null;
}

export interface AestheticBodyFatSources {
  ffmiDraftPct: number | null;
  armSizePct: number | null;
  latestHistoryFfmiPct: number | null;
}
