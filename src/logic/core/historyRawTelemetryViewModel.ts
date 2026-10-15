/**
 * Pure projection of archived AssessmentRawInputsV1 → display rows for Logs UI.
 * WHY: Keep Brzycki / field picking out of presentational components.
 */
import type { AssessmentRawInputsV1 } from '../../types/assessmentRawInputs';
import { STRENGTH_LIFT_KEYS, type StrengthLiftKey } from '../../types/strengthInputs';
import { calculateOneRmBrzycki } from './trainingTools';

export interface HistoryRawLiftRow {
  liftKey: StrengthLiftKey;
  weightKg: number;
  reps: number;
  oneRmKg: number;
}

export interface HistoryRawPowerBlock {
  verticalJumpCm?: number;
  standingLongJumpCm?: number;
  sprintSeconds?: number;
}

export interface HistoryRawRun5KmBlock {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  paceInSeconds?: number;
}

export interface HistoryRawCardioBlock {
  cooperDistanceM?: number;
  run5Km?: HistoryRawRun5KmBlock;
}

export interface HistoryRawPhysiqueBlock {
  bodyFatPct?: number;
  smmKg?: number;
  armCircumferenceCm?: number;
  heightCm?: number;
  weightKg?: number;
}

export interface HistoryRawTelemetryViewModel {
  /** True when a rawInputs blob was present on the record (badge affordance). */
  hasRawArchive: boolean;
  /** True when at least one physical field can be rendered in the expand panel. */
  hasDisplayableTelemetry: boolean;
  strengthLifts: HistoryRawLiftRow[];
  power: HistoryRawPowerBlock | null;
  cardio: HistoryRawCardioBlock | null;
  physique: HistoryRawPhysiqueBlock | null;
  gripPeakKg: number | null;
}

function isPositiveFinite(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildStrengthLifts(raw: AssessmentRawInputsV1): HistoryRawLiftRow[] {
  const lifts = raw.strength?.lifts;
  if (!lifts) return [];
  const rows: HistoryRawLiftRow[] = [];
  for (const liftKey of STRENGTH_LIFT_KEYS) {
    const cell = lifts[liftKey];
    if (!cell) continue;
    const weightKg = cell.weightKg;
    const reps = cell.reps;
    if (!isPositiveFinite(weightKg) || !isPositiveFinite(reps)) continue;
    const oneRm = calculateOneRmBrzycki(weightKg, reps);
    if (!(oneRm > 0)) continue;
    rows.push({
      liftKey,
      weightKg: round1(weightKg),
      reps: Math.round(reps),
      oneRmKg: round1(oneRm),
    });
  }
  return rows;
}

function buildPower(raw: AssessmentRawInputsV1): HistoryRawPowerBlock | null {
  const block = raw.power?.explosivePower;
  if (!block) return null;
  const next: HistoryRawPowerBlock = {};
  if (isPositiveFinite(block.verticalJumpCm)) next.verticalJumpCm = round1(block.verticalJumpCm);
  if (isPositiveFinite(block.standingLongJumpCm)) {
    next.standingLongJumpCm = round1(block.standingLongJumpCm);
  }
  if (isPositiveFinite(block.sprintSeconds)) next.sprintSeconds = round1(block.sprintSeconds);
  return Object.keys(next).length > 0 ? next : null;
}

function buildCardio(raw: AssessmentRawInputsV1): HistoryRawCardioBlock | null {
  const next: HistoryRawCardioBlock = {};
  const distance = raw.cardio?.cardio?.distance;
  if (isPositiveFinite(distance)) next.cooperDistanceM = Math.round(distance);

  const r5 = raw.cardio?.run_5km;
  if (r5) {
    const total =
      isPositiveFinite(r5.totalSeconds)
        ? Math.round(r5.totalSeconds)
        : isPositiveFinite(r5.minutes) || isPositiveFinite(r5.seconds)
          ? Math.round((r5.minutes ?? 0) * 60 + (r5.seconds ?? 0))
          : null;
    if (total !== null && total > 0) {
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      next.run5Km = {
        minutes,
        seconds,
        totalSeconds: total,
        ...(isPositiveFinite(r5.paceInSeconds)
          ? { paceInSeconds: Math.round(r5.paceInSeconds) }
          : { paceInSeconds: Math.round(total / 5) }),
      };
    }
  }

  return next.cooperDistanceM !== undefined || next.run5Km !== undefined ? next : null;
}

function buildPhysique(raw: AssessmentRawInputsV1): HistoryRawPhysiqueBlock | null {
  const next: HistoryRawPhysiqueBlock = {};
  if (isPositiveFinite(raw.ffmi?.bodyFatPct)) next.bodyFatPct = round1(raw.ffmi.bodyFatPct);
  if (isPositiveFinite(raw.muscle?.muscle?.smmKg)) next.smmKg = round1(raw.muscle.muscle.smmKg);
  if (isPositiveFinite(raw.armSize?.armCircumferenceCm)) {
    next.armCircumferenceCm = round1(raw.armSize.armCircumferenceCm);
  }
  // Prefer explicit arm-size BF when FFMI draft missing — still show one BF% field.
  if (next.bodyFatPct === undefined && isPositiveFinite(raw.armSize?.bodyFatPct)) {
    next.bodyFatPct = round1(raw.armSize.bodyFatPct);
  }
  const snap = raw.physicalProfileSnapshot;
  if (snap) {
    if (isPositiveFinite(snap.heightCm)) next.heightCm = round1(snap.heightCm);
    if (isPositiveFinite(snap.weightKg)) next.weightKg = round1(snap.weightKg);
  }
  return Object.keys(next).length > 0 ? next : null;
}

function buildGrip(raw: AssessmentRawInputsV1): number | null {
  const peak = raw.grip?.peakKg;
  return isPositiveFinite(peak) ? round1(peak) : null;
}

/** Formats mm:ss from total seconds (or minutes+seconds). */
export function formatClockMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Projects optional archived rawInputs into Logs expand-panel data.
 * `null` / undefined raw → scores-only downgrade (no throw).
 */
export function buildHistoryRawTelemetryViewModel(
  rawInputs: AssessmentRawInputsV1 | null | undefined
): HistoryRawTelemetryViewModel {
  if (!rawInputs) {
    return {
      hasRawArchive: false,
      hasDisplayableTelemetry: false,
      strengthLifts: [],
      power: null,
      cardio: null,
      physique: null,
      gripPeakKg: null,
    };
  }

  const strengthLifts = buildStrengthLifts(rawInputs);
  const power = buildPower(rawInputs);
  const cardio = buildCardio(rawInputs);
  const physique = buildPhysique(rawInputs);
  const gripPeakKg = buildGrip(rawInputs);

  const hasDisplayableTelemetry =
    strengthLifts.length > 0 ||
    power !== null ||
    cardio !== null ||
    physique !== null ||
    gripPeakKg !== null;

  return {
    hasRawArchive: true,
    hasDisplayableTelemetry,
    strengthLifts,
    power,
    cardio,
    physique,
    gripPeakKg,
  };
}
