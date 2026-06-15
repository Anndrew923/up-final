import {
  assessmentRouteForSixAxis,
  DYNO_INTEL_SIX_AXIS_ORDER,
} from '../../config/dynoIntelAxisRoutes';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import type {
  BuildDynoIntelContextInput,
  DynoAgeBucket,
  DynoAxisDelta,
  DynoAxisGap,
  DynoAxisSnapshot,
  DynoHistoryRecordSlice,
  DynoIntelContextV1,
  DynoWeightSimulation,
} from './dynoIntelTypes';
import { getMuscleAgeRange } from './muscleScoring';
import { isPhysicalProfileComplete, PHYSICAL_LIMITS } from './physicalProfile';
import { mergeScoreMapForHomeRadar } from './radarMergedScores';
import { getAxisMeaningI18nPrefix, resolveScoreBand } from './scoreMeaningCatalog';
import { buildSixAxisRadarData, calculateSixAxisOverall } from './scoring';
import { resolveStrengthScoreFromInputs } from './strengthAssessment';
import { resolveVehicleClass } from './vehicleResolver';
import { buildFocusAxisLexicon } from './dynoIntelAxisLexicon';
import { buildDynoIntelSupplementalMetrics } from './buildDynoIntelSupplementalMetrics';

const round2 = (value: number) => Math.round(value * 100) / 100;

const WEIGHT_SENSITIVE_AXIS: SixAxisMetric = 'strength';

function isValidTargetWeightKg(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= PHYSICAL_LIMITS.weightKgMin &&
    value <= PHYSICAL_LIMITS.weightKgMax
  );
}

function resolveDynoAgeBucket(age: number): DynoAgeBucket {
  return getMuscleAgeRange(age) ?? 'unknown';
}

function sortHistoryNewestFirst(
  records: readonly DynoHistoryRecordSlice[]
): DynoHistoryRecordSlice[] {
  return [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function buildGaps(mergedScores: ScoreMap): DynoAxisGap[] {
  const gaps: DynoAxisGap[] = [];
  for (const axis of DYNO_INTEL_SIX_AXIS_ORDER) {
    if (mergedScores[axis] == null) {
      gaps.push({ axis, assessmentRoute: assessmentRouteForSixAxis(axis) });
    }
  }
  return gaps;
}

function buildAxisSnapshots(mergedScores: ScoreMap): DynoAxisSnapshot[] {
  return DYNO_INTEL_SIX_AXIS_ORDER.map((axis) => {
    const raw = mergedScores[axis];
    const score = raw == null ? null : round2(raw);
    return {
      axis,
      score,
      tierBandId: score == null ? null : resolveScoreBand(axis, score).id,
      meaningI18nPrefix: score == null ? null : getAxisMeaningI18nPrefix(axis),
      weightInvariant: axis !== WEIGHT_SENSITIVE_AXIS,
    };
  });
}

function buildMomentumDeltas(
  current: DynoHistoryRecordSlice | undefined,
  previous: DynoHistoryRecordSlice | undefined
): { hasHistory: boolean; deltas: DynoAxisDelta[]; overallDelta: number | null } {
  if (!current || !previous) {
    return {
      hasHistory: false,
      deltas: DYNO_INTEL_SIX_AXIS_ORDER.map((axis) => ({
        axis,
        current: current?.scores[axis] ?? null,
        previous: null,
        delta: null,
      })),
      overallDelta: null,
    };
  }

  const deltas = DYNO_INTEL_SIX_AXIS_ORDER.map((axis) => {
    const cur = current.scores[axis] ?? null;
    const prev = previous.scores[axis] ?? null;
    return {
      axis,
      current: cur,
      previous: prev,
      delta: cur != null && prev != null ? round2(cur - prev) : null,
    };
  });

  const overallDelta = round2(current.overallScore - previous.overallScore);

  return { hasHistory: true, deltas, overallDelta };
}

function buildWeightSimulation(
  profile: PhysicalProfile,
  strengthInputs: BuildDynoIntelContextInput['radarInput']['strengthInputs'],
  targetWeightKg: number
): DynoWeightSimulation {
  const currentScore = resolveStrengthScoreFromInputs(profile, strengthInputs);
  const simulatedProfile: PhysicalProfile = { ...profile, weightKg: targetWeightKg };
  const simulatedScore = resolveStrengthScoreFromInputs(simulatedProfile, strengthInputs);

  return {
    enabled: true,
    currentWeightKg: profile.weightKg,
    targetWeightKg,
    assumption: 'strength-only-dots-recalc',
    strength: {
      currentScore,
      simulatedScore,
      delta:
        currentScore != null && simulatedScore != null
          ? round2(simulatedScore - currentScore)
          : null,
    },
  };
}

function buildDeIdentifiedProfile(
  profile: PhysicalProfile | null | undefined
): DynoIntelContextV1['profile'] {
  if (!profile || !isPhysicalProfileComplete(profile)) return null;
  return {
    gender: profile.gender,
    ageBucket: resolveDynoAgeBucket(profile.age),
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  };
}

/**
 * Weakest scored axis; if any gap exists, the first gap axis takes priority (blind-spot redirect).
 */
export function resolveWeakestAxis(
  mergedScores: ScoreMap,
  gaps: readonly DynoAxisGap[]
): SixAxisMetric | null {
  if (gaps.length > 0) return gaps[0].axis;

  let weakest: SixAxisMetric | null = null;
  let weakestScore = Number.POSITIVE_INFINITY;
  for (const axis of DYNO_INTEL_SIX_AXIS_ORDER) {
    const score = mergedScores[axis];
    if (score == null) continue;
    if (score < weakestScore) {
      weakestScore = score;
      weakest = axis;
    }
  }
  return weakest;
}

/**
 * Assembles a de-identified JSON context for the DYNO INTEL backend.
 * Design intent (WHY): All math stays in logic/core; the AI only narrates pre-computed truth.
 */
export function buildDynoIntelContext(input: BuildDynoIntelContextInput): DynoIntelContextV1 {
  const now = input.now ?? new Date();
  const mergedScores = mergeScoreMapForHomeRadar(input.radarInput);
  const gaps = buildGaps(mergedScores);
  const axes = buildAxisSnapshots(mergedScores);
  const sortedHistory = sortHistoryNewestFirst(input.historyRecords);
  const momentum = buildMomentumDeltas(sortedHistory[0], sortedHistory[1]);
  const profile = input.radarInput.profile;
  const deIdentifiedProfile = buildDeIdentifiedProfile(profile);

  const shouldSimulate =
    input.mode === 'weight-simulation' &&
    input.targetWeightKg != null &&
    isValidTargetWeightKg(input.targetWeightKg) &&
    profile != null &&
    isPhysicalProfileComplete(profile);

  const weightSimulation = shouldSimulate
    ? buildWeightSimulation(profile, input.radarInput.strengthInputs, input.targetWeightKg!)
    : null;

  const overallScore = (() => {
    const hasAnyScore = DYNO_INTEL_SIX_AXIS_ORDER.some((axis) => mergedScores[axis] != null);
    return hasAnyScore ? calculateSixAxisOverall(mergedScores) : null;
  })();

  const radarPoints = buildSixAxisRadarData(mergedScores);
  const vehicleClassId = overallScore != null ? resolveVehicleClass(radarPoints) : null;

  return {
    schemaVersion: 1,
    locale: input.locale,
    mode: input.mode,
    focusAxis: input.focusAxis ?? null,
    focusAxisLexicon: buildFocusAxisLexicon(input.focusAxis, input.locale),
    overallScore,
    axes,
    gaps,
    momentum,
    weightSimulation,
    profile: deIdentifiedProfile,
    vehicleClassId,
    weakestAxis: resolveWeakestAxis(mergedScores, gaps),
    supplementalMetrics: buildDynoIntelSupplementalMetrics(input.radarInput),
    focusSupplemental: input.focusSupplemental ?? null,
    scoringMethodologyBriefs: [],
    assessmentDeepDiveNudge: '',
    replyClosingCue: '',
    closingBeatKind: 'return-ritual',
    closingBeatSecondLine: '',
    questionFocusAxis: null,
    intent: 'general',
    generatedAt: now.toISOString(),
  };
}
