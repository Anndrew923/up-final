import { parseFfmiBodyFatPctInput } from '../core/ffmiScoring';
import { GRIP_CENTURY_SCORE } from '../core/gripStrength';
import type { ScoreMap } from '../../types/scoring';
import type {
  AestheticBodyFatSources,
  AestheticForceResult,
  AestheticGender,
  AestheticKineticResult,
  AestheticResolverInput,
  AestheticResolverOutput,
  AestheticVisualResult,
  DecadeBandId,
  OverallTitleId,
  VisualSpecId,
} from './aestheticTypes';

/** Assassin channel: only fire once the composite already reads as a trained physique. */
const ASSASSIN_MIN_VISUAL_SCORE = 80;
/** Inclusive floor of century overflow — assassin is strictly below this so the two channels cannot drift. */
const OVERFLOW_MIN_VISUAL_SCORE = 100;
const ASSASSIN_MAX_VISUAL_SCORE = OVERFLOW_MIN_VISUAL_SCORE;
const ASSASSIN_MIN_MUSCLE_SCORE = 85;
const ASSASSIN_MAX_FFMI_SCORE = 85;
/** Weighting gate is stricter than the assassin FFMI cap so equal-mean still applies near 80–84 FFMI. */
const ASSASSIN_WEIGHT_FFMI_MAX = 80;
const ASSASSIN_MUSCLE_WEIGHT = 0.6;
const ASSASSIN_FFMI_WEIGHT = 0.4;

export const AESTHETIC_OVERFLOW_BF_THRESHOLDS = {
  male: {
    shreddedMax: 10.0,
    athleticMax: 16.0,
  },
  female: {
    shreddedMax: 16.0,
    athleticMax: 23.0,
  },
} as const;

type OverflowBfState = 'shredded' | 'athletic' | 'colossus';
type OverflowDecade = '140' | '130' | '120' | '110' | '100';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Treat 0 / NaN / missing as untested — never average a blank axis as a real zero. */
export function isPresentScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function parseAestheticBodyFatPct(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return parseFfmiBodyFatPctInput(String(value));
  }
  if (typeof value === 'string') return parseFfmiBodyFatPctInput(value);
  return null;
}

export function resolveAestheticBodyFatPct(sources: AestheticBodyFatSources): number | null {
  if (sources.ffmiDraftPct != null) return sources.ffmiDraftPct;
  if (sources.armSizePct != null) return sources.armSizePct;
  if (sources.latestHistoryFfmiPct != null) return sources.latestHistoryFfmiPct;
  return null;
}

export function formatAestheticBattleCode(displayName: string, uid: string | null | undefined): string {
  const name = displayName.trim().replace(/\s+/g, ' ');
  const safeName = name.length > 0 ? name : 'UP';
  if (uid && uid.length >= 4) {
    return `UP-${safeName} #${uid.slice(-4).toUpperCase()}`;
  }
  if (uid && uid.length > 0) {
    return `UP-${safeName} #${uid.toUpperCase()}`;
  }
  return `UP-${safeName}`;
}

export function resolveVisualScore(scores: ScoreMap): number | null {
  const ffmi = isPresentScore(scores.bodyFat) ? scores.bodyFat : null;
  const smm = isPresentScore(scores.muscleMass) ? scores.muscleMass : null;
  if (ffmi != null && smm != null) {
    // WHY: High SM% on a light frame is diluted by equal-weight FFMI; 60/40 restores the assassin silhouette.
    if (smm >= ASSASSIN_MIN_MUSCLE_SCORE && ffmi < ASSASSIN_WEIGHT_FFMI_MAX) {
      return round2(smm * ASSASSIN_MUSCLE_WEIGHT + ffmi * ASSASSIN_FFMI_WEIGHT);
    }
    return round2((ffmi + smm) / 2);
  }
  if (ffmi != null) return round2(ffmi);
  if (smm != null) return round2(smm);
  return null;
}

function resolveForceScore(scores: ScoreMap): number | null {
  const present: number[] = [];
  if (isPresentScore(scores.strength)) present.push(scores.strength);
  if (isPresentScore(scores.gripStrength)) present.push(scores.gripStrength);
  if (isPresentScore(scores.explosivePower)) present.push(scores.explosivePower);
  if (present.length === 0) return null;
  const sum = present.reduce((acc, value) => acc + value, 0);
  return round2(sum / present.length);
}

function resolveKineticScore(scores: ScoreMap): number | null {
  return isPresentScore(scores.cardio) ? round2(scores.cardio) : null;
}

function resolveOverallTitleId(score: number): OverallTitleId {
  if (!Number.isFinite(score) || score < 50) return 'native';
  if (score < 60) return 'urban';
  if (score < 70) return 'health';
  if (score < 80) return 'advanced';
  if (score < 90) return 'highTier';
  if (score < 100) return 'peakMortal';
  if (score < 110) return 'awakened';
  if (score < 120) return 'transcendent';
  if (score < 130) return 'historic';
  if (score < 140) return 'mythic';
  if (score < 150) return 'monster';
  return 'apexEarth';
}

export function resolveDecadeBandId(score: number): DecadeBandId {
  if (!Number.isFinite(score) || score < 50) return 'base';
  if (score < 60) return '50';
  if (score < 70) return '60';
  if (score < 80) return '70';
  if (score < 90) return '80';
  if (score < 100) return '90';
  if (score < 110) return '100';
  if (score < 120) return '110';
  if (score < 130) return '120';
  return '130';
}

function pick<T>(gender: AestheticGender, male: T, female: T): T {
  return gender === 'female' ? female : male;
}

function isAssassinBf(gender: AestheticGender, bf: number): boolean {
  return gender === 'male' ? bf < 10 : bf < 17;
}

/**
 * Century overflow BF state. Missing BF% always colossus — never shredded or athletic honorifics.
 */
export function resolveOverflowBfState(
  gender: AestheticGender,
  bodyFatPct: number | null
): OverflowBfState {
  if (bodyFatPct == null) return 'colossus';
  const thresholds = AESTHETIC_OVERFLOW_BF_THRESHOLDS[gender];
  if (bodyFatPct < thresholds.shreddedMax) return 'shredded';
  if (bodyFatPct < thresholds.athleticMax) return 'athletic';
  return 'colossus';
}

function resolveOverflowDecade(visualScore: number): OverflowDecade {
  if (visualScore >= 140) return '140';
  if (visualScore >= 130) return '130';
  if (visualScore >= 120) return '120';
  if (visualScore >= 110) return '110';
  return '100';
}

const OVERFLOW_VISUAL_TABLE: Record<
  OverflowDecade,
  Record<OverflowBfState, { male: VisualSpecId; female: VisualSpecId }>
> = {
  '140': {
    shredded: { male: 'pantheonApexDry', female: 'pantheonApexDryF' },
    athletic: { male: 'pantheonApex', female: 'pantheonApexF' },
    colossus: { male: 'pantheonColossus', female: 'pantheonColossusF' },
  },
  '130': {
    shredded: { male: 'titanDryGod', female: 'valkyrieDryGoddess' },
    athletic: { male: 'titanTemple', female: 'valkyrieApex' },
    colossus: { male: 'colossusWall', female: 'colossusShield' },
  },
  '120': {
    shredded: { male: 'historicDryGod', female: 'historicDryGoddess' },
    athletic: { male: 'historicBeast', female: 'historicAmazonian' },
    colossus: { male: 'unshakableWall', female: 'unshakableShield' },
  },
  '110': {
    shredded: { male: 'transcendentDry', female: 'transcendentDryF' },
    athletic: { male: 'transcendentTitan', female: 'valkyrieTranscendent' },
    colossus: { male: 'ironFortress', female: 'ironFortressF' },
  },
  '100': {
    shredded: { male: 'awakenedDryGod', female: 'athenaDryGod' },
    athletic: { male: 'awakenedGodform', female: 'athenaAwakened' },
    colossus: { male: 'heavyTitan', female: 'heavyAmazonian' },
  },
};

function isLowFat(gender: AestheticGender, bf: number): boolean {
  return gender === 'male' ? bf < 13 : bf < 20;
}

function isStandardFat(gender: AestheticGender, bf: number): boolean {
  return gender === 'male' ? bf >= 13 && bf < 18 : bf >= 20 && bf < 25;
}

function isHighFat(gender: AestheticGender, bf: number): boolean {
  return gender === 'male' ? bf >= 18 : bf >= 25;
}

function isLowOrStandardFat(gender: AestheticGender, bf: number): boolean {
  return gender === 'male' ? bf < 18 : bf < 25;
}

/**
 * Decade visual tree. Assassin is capped below 100 so contest shredded overflow uses Dry/Athletic/Colossus.
 * Missing BF% always takes the dense/reserve branch — never a carved-lean honorific.
 */
function resolveVisualId(
  gender: AestheticGender,
  visualScore: number,
  scores: ScoreMap,
  bodyFatPct: number | null
): VisualSpecId {
  const smm = isPresentScore(scores.muscleMass) ? scores.muscleMass : 0;
  const ffmi = isPresentScore(scores.bodyFat) ? scores.bodyFat : 0;

  if (
    visualScore >= ASSASSIN_MIN_VISUAL_SCORE &&
    visualScore < ASSASSIN_MAX_VISUAL_SCORE &&
    bodyFatPct != null &&
    isAssassinBf(gender, bodyFatPct) &&
    smm >= ASSASSIN_MIN_MUSCLE_SCORE &&
    ffmi < ASSASSIN_MAX_FFMI_SCORE
  ) {
    return pick(gender, 'assassin', 'huntress');
  }

  if (visualScore >= OVERFLOW_MIN_VISUAL_SCORE) {
    const decade = resolveOverflowDecade(visualScore);
    const state = resolveOverflowBfState(gender, bodyFatPct);
    return OVERFLOW_VISUAL_TABLE[decade][state][gender];
  }

  if (visualScore >= 90) {
    if (bodyFatPct != null && isLowFat(gender, bodyFatPct)) {
      return pick(gender, 'marbleChiseled', 'greekGoddess');
    }
    if (bodyFatPct != null && isStandardFat(gender, bodyFatPct)) {
      return pick(gender, 'peakAesthetic', 'athenaForm');
    }
    return pick(gender, 'titanColossus', 'amazonianStrength');
  }

  if (visualScore >= 80) {
    if (bodyFatPct != null && isLowFat(gender, bodyFatPct)) {
      return pick(gender, 'striatedLean', 'chiseledWaist');
    }
    if (bodyFatPct != null && isStandardFat(gender, bodyFatPct)) {
      return pick(gender, 'goldenVTaper', 'goldenHourglass');
    }
    return pick(gender, 'heavyArmor', 'curvyPower');
  }

  if (visualScore >= 70) {
    if (bodyFatPct != null && isLowOrStandardFat(gender, bodyFatPct)) {
      return pick(gender, 'athleticFrame', 'sleekAthletic');
    }
    return pick(gender, 'solidBase', 'firmBase');
  }

  if (visualScore >= 60) {
    if (bodyFatPct != null && isLowOrStandardFat(gender, bodyFatPct)) {
      return pick(gender, 'cleanTone', 'tonedGrace');
    }
    return pick(gender, 'steadyDefense', 'softCurve');
  }

  if (visualScore >= 50) {
    return pick(gender, 'urbanDaily', 'urbanGrace');
  }

  if (bodyFatPct != null && !isHighFat(gender, bodyFatPct)) {
    return pick(gender, 'nativeLean', 'nativeGrace');
  }
  return pick(gender, 'nativeStock', 'nativeCurve');
}

function unmeasuredColumn(): AestheticVisualResult {
  return { id: null, score: null, unmeasured: true, bodyFatMissing: true };
}

function unmeasuredForce(): AestheticForceResult {
  return { id: null, score: null, unmeasured: true };
}

function unmeasuredKinetic(): AestheticKineticResult {
  return { id: null, score: null, unmeasured: true };
}

export function resolveAestheticSpec(input: AestheticResolverInput): AestheticResolverOutput {
  const overallTitleId = resolveOverallTitleId(input.overallScore);
  const peakKg =
    typeof input.peakKg === 'number' && Number.isFinite(input.peakKg) && input.peakKg > 0
      ? input.peakKg
      : null;
  const hasTitanGrip = isPresentScore(input.scores.gripStrength)
    ? input.scores.gripStrength >= GRIP_CENTURY_SCORE
    : false;

  if (input.gender !== 'male' && input.gender !== 'female') {
    return {
      overallTitleId,
      visual: unmeasuredColumn(),
      force: unmeasuredForce(),
      kinetic: unmeasuredKinetic(),
      hasTitanGrip,
      peakKg,
    };
  }

  const visualScore = resolveVisualScore(input.scores);
  const bodyFatMissing = input.bodyFatPct == null;
  const visual: AestheticVisualResult =
    visualScore == null
      ? { id: null, score: null, unmeasured: true, bodyFatMissing }
      : {
          id: resolveVisualId(input.gender, visualScore, input.scores, input.bodyFatPct),
          score: visualScore,
          unmeasured: false,
          bodyFatMissing,
        };

  const forceScore = resolveForceScore(input.scores);
  const force: AestheticForceResult =
    forceScore == null
      ? unmeasuredForce()
      : { id: resolveDecadeBandId(forceScore), score: forceScore, unmeasured: false };

  const kineticScore = resolveKineticScore(input.scores);
  const kinetic: AestheticKineticResult =
    kineticScore == null
      ? unmeasuredKinetic()
      : { id: resolveDecadeBandId(kineticScore), score: kineticScore, unmeasured: false };

  return {
    overallTitleId,
    visual,
    force,
    kinetic,
    hasTitanGrip,
    peakKg,
  };
}
