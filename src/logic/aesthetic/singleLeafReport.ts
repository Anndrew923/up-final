/**
 * Single-leaf (per-event) hero report — undiluted scores for offline share cards.
 *
 * WHY: Six-axis radar deliberately averages strength /5 and explosive /2 so a lone
 * elite lift cannot inflate overall. Share cards need the opposite: the raw hero
 * score of one filled leaf, recomputed from local drafts only (zero Firestore).
 */
import type { ArmSizeInputsPersisted } from '../../types/armSizeInputs';
import type { CardioInputsPersisted } from '../../types/cardioInputs';
import type { GripInputsPersisted } from '../../types/gripInputs';
import type { MuscleInputsPersisted } from '../../types/muscleInputs';
import type { PowerInputsPersisted } from '../../types/powerInputs';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import type { StrengthInputsPersisted, StrengthLiftKey } from '../../types/strengthInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import { evaluateArmSizeScore } from '../core/armSizeScoring';
import { calculate5KmScore, calculateCooperScore } from '../core/cardioScoring';
import {
  evaluateFfmiScoring,
  parseFfmiBodyFatPctInput,
} from '../core/ffmiScoring';
import { calculateGripStrengthScore } from '../core/gripStrength';
import { formatClockMmSs } from '../core/historyRawTelemetryViewModel';
import { calculateMuscleScores } from '../core/muscleScoring';
import { isPhysicalProfileComplete } from '../core/physicalProfile';
import { applyExplosiveInputCapsForProfile } from '../core/explosiveInputCaps';
import {
  calculateExplosivePowerBreakdown,
  getPowerStandardsForProfile,
} from '../core/powerScoring';
import { clampScoreMapValue, countCoreSixFilled } from '../core/scoring';
import { computeStrengthBranchesFromPersisted } from '../core/strengthAssessment';

/** Minimal FFMI draft shape — avoids pulling service types into callers. */
export interface SingleLeafFfmiDraft {
  bodyFatPctInput: string;
}

export const SINGLE_LEAF_IDS = [
  'strength.benchPress',
  'strength.squat',
  'strength.deadlift',
  'strength.latPulldown',
  'strength.shoulderPress',
  'explosive.verticalJump',
  'explosive.standingLongJump',
  'explosive.sprint',
  'grip',
  'cardio.cooper',
  'cardio.run5km',
  'muscle.smm',
  'muscle.smPercent',
  'ffmi',
  'armSize',
] as const;

export type SingleLeafId = (typeof SINGLE_LEAF_IDS)[number];

const OVERFLOW_HERO = 100;

const STRENGTH_LEAF_TO_LIFT: Record<
  Extract<SingleLeafId, `strength.${string}`>,
  StrengthLiftKey
> = {
  'strength.benchPress': 'benchPress',
  'strength.squat': 'squat',
  'strength.deadlift': 'deadlift',
  'strength.latPulldown': 'latPulldown',
  'strength.shoulderPress': 'shoulderPress',
};

/** Parent six-axis (or specialty) bucket for smart-default axis counting. */
export type SingleLeafAxisBucket = SixAxisMetric | 'armSize';

export const SINGLE_LEAF_AXIS: Record<SingleLeafId, SingleLeafAxisBucket> = {
  'strength.benchPress': 'strength',
  'strength.squat': 'strength',
  'strength.deadlift': 'strength',
  'strength.latPulldown': 'strength',
  'strength.shoulderPress': 'strength',
  'explosive.verticalJump': 'explosivePower',
  'explosive.standingLongJump': 'explosivePower',
  'explosive.sprint': 'explosivePower',
  grip: 'gripStrength',
  'cardio.cooper': 'cardio',
  'cardio.run5km': 'cardio',
  'muscle.smm': 'muscleMass',
  'muscle.smPercent': 'muscleMass',
  ffmi: 'bodyFat',
  armSize: 'armSize',
};

/** i18n key under `aesthetic.singleLeaf.labels.*` — item names only (no vehicle jargon). */
export const SINGLE_LEAF_LABEL_KEY: Record<SingleLeafId, string> = {
  'strength.benchPress': 'aesthetic.singleLeaf.labels.benchPress',
  'strength.squat': 'aesthetic.singleLeaf.labels.squat',
  'strength.deadlift': 'aesthetic.singleLeaf.labels.deadlift',
  'strength.latPulldown': 'aesthetic.singleLeaf.labels.latPulldown',
  'strength.shoulderPress': 'aesthetic.singleLeaf.labels.shoulderPress',
  'explosive.verticalJump': 'aesthetic.singleLeaf.labels.verticalJump',
  'explosive.standingLongJump': 'aesthetic.singleLeaf.labels.standingLongJump',
  'explosive.sprint': 'aesthetic.singleLeaf.labels.sprint',
  grip: 'aesthetic.singleLeaf.labels.grip',
  'cardio.cooper': 'aesthetic.singleLeaf.labels.cooper',
  'cardio.run5km': 'aesthetic.singleLeaf.labels.run5km',
  'muscle.smm': 'aesthetic.singleLeaf.labels.smm',
  'muscle.smPercent': 'aesthetic.singleLeaf.labels.smPercent',
  ffmi: 'aesthetic.singleLeaf.labels.ffmi',
  armSize: 'aesthetic.singleLeaf.labels.armSize',
};

export interface SingleLeafDraftBundle {
  profile: PhysicalProfile | null;
  strength: StrengthInputsPersisted | null;
  power: PowerInputsPersisted | null;
  cardio: CardioInputsPersisted | null;
  muscle: MuscleInputsPersisted | null;
  grip: GripInputsPersisted | null;
  armSize: ArmSizeInputsPersisted | null;
  ffmi: SingleLeafFfmiDraft | null;
  /** Merged six-axis map used only for Smart Default axis counting. */
  scores: ScoreMap;
}

export type SingleLeafReportResult =
  | { status: 'unavailable' }
  | {
      status: 'ok';
      leaf: SingleLeafId;
      heroScore: number;
      /** Language-stable SI display for canvas / share (e.g. `140 KG × 3`). */
      rawReading: string;
      isOverflow: boolean;
      axisBucket: SingleLeafAxisBucket;
      labelKey: string;
    };

export interface AvailableSingleLeaf {
  leaf: SingleLeafId;
  heroScore: number;
  rawReading: string;
  isOverflow: boolean;
  labelKey: string;
  axisBucket: SingleLeafAxisBucket;
}

export type SmartDefaultSelection =
  | { reportType: 'full' }
  | { reportType: 'single-leaf'; leaf: SingleLeafId };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function persistedPositive(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function okLeaf(
  leaf: SingleLeafId,
  heroScore: number,
  rawReading: string
): Extract<SingleLeafReportResult, { status: 'ok' }> {
  const clamped = clampScoreMapValue(heroScore);
  return {
    status: 'ok',
    leaf,
    heroScore: clamped,
    rawReading,
    isOverflow: clamped >= OVERFLOW_HERO,
    axisBucket: SINGLE_LEAF_AXIS[leaf],
    labelKey: SINGLE_LEAF_LABEL_KEY[leaf],
  };
}

function resolveStrengthLeaf(
  leaf: Extract<SingleLeafId, `strength.${string}`>,
  drafts: SingleLeafDraftBundle
): SingleLeafReportResult {
  const branches = computeStrengthBranchesFromPersisted(drafts.profile, drafts.strength);
  if (!branches?.length) return { status: 'unavailable' };
  const lift = STRENGTH_LEAF_TO_LIFT[leaf];
  const branch = branches.find((b) => b.lift === lift);
  if (!branch || !Number.isFinite(branch.finalScore) || branch.finalScore <= 0) {
    return { status: 'unavailable' };
  }
  const kg = round1(branch.weightKg);
  const raw = `${kg} KG × ${branch.reps}`;
  return okLeaf(leaf, branch.finalScore, raw);
}

function resolveExplosiveLeaf(
  leaf:
    | 'explosive.verticalJump'
    | 'explosive.standingLongJump'
    | 'explosive.sprint',
  drafts: SingleLeafDraftBundle
): SingleLeafReportResult {
  const profile = drafts.profile;
  if (!profile || !isPhysicalProfileComplete(profile)) return { status: 'unavailable' };
  if (!getPowerStandardsForProfile(profile)) return { status: 'unavailable' };

  const block = drafts.power?.explosivePower;
  if (!block) return { status: 'unavailable' };

  const verticalJumpCm = persistedPositive(block.verticalJumpCm);
  const standingLongJumpCm = persistedPositive(block.standingLongJumpCm);
  const sprintSeconds = persistedPositive(block.sprintSeconds);

  const capped = applyExplosiveInputCapsForProfile(profile, {
    verticalJumpCm,
    standingLongJumpCm,
    sprintSeconds,
  });

  const breakdown = calculateExplosivePowerBreakdown({
    verticalJumpCm: capped.verticalJumpCm,
    standingLongJumpCm: capped.standingLongJumpCm,
    sprintSeconds: capped.sprintSeconds,
    profile,
  });
  if (!breakdown) return { status: 'unavailable' };

  if (leaf === 'explosive.verticalJump') {
    const rawScore = breakdown.verticalJumpRaw;
    const cm = capped.verticalJumpCm;
    if (rawScore == null || cm == null || rawScore <= 0) return { status: 'unavailable' };
    return okLeaf(leaf, rawScore, `${round1(cm)} CM`);
  }
  if (leaf === 'explosive.standingLongJump') {
    const rawScore = breakdown.standingLongJumpRaw;
    const cm = capped.standingLongJumpCm;
    if (rawScore == null || cm == null || rawScore <= 0) return { status: 'unavailable' };
    // WHY: Broad jump reads better in meters on the share plate (e.g. 2.85 M).
    const meters = round2(cm / 100);
    return okLeaf(leaf, rawScore, `${meters} M`);
  }
  const rawScore = breakdown.sprintRaw;
  const sec = capped.sprintSeconds;
  if (rawScore == null || sec == null || rawScore <= 0) return { status: 'unavailable' };
  return okLeaf(leaf, rawScore, `${round2(sec)} S`);
}

function resolveGripLeaf(drafts: SingleLeafDraftBundle): SingleLeafReportResult {
  const profile = drafts.profile;
  if (!profile || !isPhysicalProfileComplete(profile)) return { status: 'unavailable' };
  const peakKg = persistedPositive(drafts.grip?.peakKg);
  if (peakKg == null) return { status: 'unavailable' };
  const hero = calculateGripStrengthScore(peakKg, profile.weightKg, profile.gender);
  if (!Number.isFinite(hero) || hero <= 0) return { status: 'unavailable' };
  return okLeaf('grip', hero, `${round1(peakKg)} KG`);
}

function resolveCardioLeaf(
  leaf: 'cardio.cooper' | 'cardio.run5km',
  drafts: SingleLeafDraftBundle
): SingleLeafReportResult {
  const profile = drafts.profile;
  if (!profile || !isPhysicalProfileComplete(profile)) return { status: 'unavailable' };

  if (leaf === 'cardio.cooper') {
    const distance = persistedPositive(drafts.cardio?.cardio?.distance);
    if (distance == null) return { status: 'unavailable' };
    const hero = calculateCooperScore({
      distanceMeters: distance,
      age: profile.age,
      gender: profile.gender,
    });
    if (!Number.isFinite(hero) || hero <= 0) return { status: 'unavailable' };
    return okLeaf(leaf, hero, `${Math.round(distance)} M`);
  }

  const totalSeconds = persistedPositive(drafts.cardio?.run_5km?.totalSeconds);
  if (totalSeconds == null) return { status: 'unavailable' };
  const hero = calculate5KmScore({ totalSeconds, gender: profile.gender });
  if (!Number.isFinite(hero) || hero <= 0) return { status: 'unavailable' };
  return okLeaf(leaf, hero, formatClockMmSs(totalSeconds));
}

function resolveMuscleLeaf(
  leaf: 'muscle.smm' | 'muscle.smPercent',
  drafts: SingleLeafDraftBundle
): SingleLeafReportResult {
  const profile = drafts.profile;
  if (!profile || !isPhysicalProfileComplete(profile)) return { status: 'unavailable' };
  const smmKg = persistedPositive(drafts.muscle?.muscle?.smmKg);
  if (smmKg == null) return { status: 'unavailable' };
  const scores = calculateMuscleScores({
    smmKg,
    weightKg: profile.weightKg,
    age: profile.age,
    gender: profile.gender,
  });
  if (leaf === 'muscle.smm') {
    const hero = scores.smmScoreRaw;
    if (hero == null || !Number.isFinite(hero) || hero <= 0) return { status: 'unavailable' };
    return okLeaf(leaf, hero, `${round1(smmKg)} KG`);
  }
  const hero = scores.smPercentScoreRaw;
  const pct = scores.smPercent;
  if (hero == null || pct == null || !Number.isFinite(hero) || hero <= 0) {
    return { status: 'unavailable' };
  }
  return okLeaf(leaf, hero, `${round1(pct)}%`);
}

function resolveFfmiLeaf(drafts: SingleLeafDraftBundle): SingleLeafReportResult {
  const profile = drafts.profile;
  if (!profile || !isPhysicalProfileComplete(profile)) return { status: 'unavailable' };
  const bf = parseFfmiBodyFatPctInput(drafts.ffmi?.bodyFatPctInput);
  if (bf == null || bf <= 0) return { status: 'unavailable' };
  const breakdown = evaluateFfmiScoring({
    gender: profile.gender,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bodyFatPct: bf,
  });
  if (!breakdown.allowsRadarSubmit) return { status: 'unavailable' };
  const hero = breakdown.submittedScore;
  if (!Number.isFinite(hero) || hero <= 0) return { status: 'unavailable' };
  return okLeaf('ffmi', hero, `FFMI ${round2(breakdown.cappedAdjustedFfmi)}`);
}

function resolveArmSizeLeaf(drafts: SingleLeafDraftBundle): SingleLeafReportResult {
  const profile = drafts.profile;
  if (!profile || !isPhysicalProfileComplete(profile)) return { status: 'unavailable' };
  const arm = persistedPositive(drafts.armSize?.armCircumferenceCm);
  const bf = persistedPositive(drafts.armSize?.bodyFatPct);
  if (arm == null || bf == null) return { status: 'unavailable' };
  const evaluated = evaluateArmSizeScore({
    armCircumferenceCm: arm,
    bodyFatPct: bf,
    gender: profile.gender,
  });
  if (!evaluated || evaluated.submittedScore <= 0) return { status: 'unavailable' };
  return okLeaf('armSize', evaluated.submittedScore, `${round1(arm)} CM`);
}

/** Pure resolver — never touches network; returns unavailable instead of throwing. */
export function resolveSingleLeafReport(
  leaf: SingleLeafId,
  drafts: SingleLeafDraftBundle
): SingleLeafReportResult {
  if (!drafts.profile || !isPhysicalProfileComplete(drafts.profile)) {
    return { status: 'unavailable' };
  }

  switch (leaf) {
    case 'strength.benchPress':
    case 'strength.squat':
    case 'strength.deadlift':
    case 'strength.latPulldown':
    case 'strength.shoulderPress':
      return resolveStrengthLeaf(leaf, drafts);
    case 'explosive.verticalJump':
    case 'explosive.standingLongJump':
    case 'explosive.sprint':
      return resolveExplosiveLeaf(leaf, drafts);
    case 'grip':
      return resolveGripLeaf(drafts);
    case 'cardio.cooper':
    case 'cardio.run5km':
      return resolveCardioLeaf(leaf, drafts);
    case 'muscle.smm':
    case 'muscle.smPercent':
      return resolveMuscleLeaf(leaf, drafts);
    case 'ffmi':
      return resolveFfmiLeaf(drafts);
    case 'armSize':
      return resolveArmSizeLeaf(drafts);
    default: {
      const _exhaustive: never = leaf;
      void _exhaustive;
      return { status: 'unavailable' };
    }
  }
}

/** Only-Filled catalog — sorted by hero score descending (ties keep SINGLE_LEAF_IDS order). */
export function listAvailableSingleLeaves(
  drafts: SingleLeafDraftBundle
): AvailableSingleLeaf[] {
  const found: AvailableSingleLeaf[] = [];
  for (const leaf of SINGLE_LEAF_IDS) {
    const resolved = resolveSingleLeafReport(leaf, drafts);
    if (resolved.status !== 'ok') continue;
    found.push({
      leaf: resolved.leaf,
      heroScore: resolved.heroScore,
      rawReading: resolved.rawReading,
      isOverflow: resolved.isOverflow,
      labelKey: resolved.labelKey,
      axisBucket: resolved.axisBucket,
    });
  }
  return found.sort((a, b) => {
    if (b.heroScore !== a.heroScore) return b.heroScore - a.heroScore;
    return SINGLE_LEAF_IDS.indexOf(a.leaf) - SINGLE_LEAF_IDS.indexOf(b.leaf);
  });
}

/**
 * Smart Default for the home certificate trigger.
 * ≥3 filled six-axis slots → full plaque; otherwise highest hero leaf (if any).
 */
export function resolveSmartDefaultReport(
  drafts: SingleLeafDraftBundle
): SmartDefaultSelection | null {
  const filled = countCoreSixFilled(drafts.scores);
  if (filled >= 3) return { reportType: 'full' };

  const available = listAvailableSingleLeaves(drafts);
  if (available.length === 0) {
    // WHY: Full plaque still makes sense as a empty/low-data fallback when any axis exists.
    if (filled > 0) return { reportType: 'full' };
    return null;
  }
  return { reportType: 'single-leaf', leaf: available[0].leaf };
}

/** True when the six-axis overview switch chip should render. */
export function hasFullReportData(drafts: SingleLeafDraftBundle): boolean {
  return countCoreSixFilled(drafts.scores) > 0;
}

export function isSingleLeafId(value: string): value is SingleLeafId {
  return (SINGLE_LEAF_IDS as readonly string[]).includes(value);
}
