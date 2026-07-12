/**
 * Somatotype lab — Grant Index bone proxy + reverse Heath–Carter (BF%-driven).
 *
 * WHY: Home UX cannot require calipers; wrist + height + BF% + flexed arm girth
 * approximate the ISAK ten-metric path while staying deterministic and UI-free.
 * IMPACT: Pure logic for somatochart dual-point gap (current vs max-tuned physique).
 */

export type PhysiqueTier = 'athletic' | 'elite' | 'apex';

export const PHYSIQUE_TIERS = ['athletic', 'elite', 'apex'] as const;

/** Target body-fat anchors for each physique evaluation tier. */
export const PHYSIQUE_TIER_TARGET_BF_PCT: Readonly<Record<PhysiqueTier, number>> = {
  athletic: 12,
  elite: 9,
  apex: 7,
};

export const DEFAULT_PHYSIQUE_TIER: PhysiqueTier = 'athletic';

/** Athletic-tier BF anchor — single-sourced from {@link PHYSIQUE_TIER_TARGET_BF_PCT}. */
export const SOMATOTYPE_BF_MAX_TUNED_PCT = PHYSIQUE_TIER_TARGET_BF_PCT.athletic;

export const SOMATOTYPE_ENDO_FLOOR = 0.5;
export const SOMATOTYPE_ECTO_FLOOR = 0.1;
export const SOMATOTYPE_HWR_HIGH = 40.75;
export const SOMATOTYPE_HWR_MID = 38.25;
/** Report guardrail: atypical frame when HWR leaves the normal band. */
export const SOMATOTYPE_HWR_ATYPICAL_LOW = 35;
export const SOMATOTYPE_HWR_ATYPICAL_HIGH = 50;
export const SOMATOTYPE_VETERAN_HUMERUS_FACTOR = 1.05;
/** Elite hypertrophy headroom when current metrics already beat the civilian formula ceiling. */
export const SOMATOTYPE_ELITE_HEADROOM = 1.05;
/** FFM → skeletal muscle mass (InBody BIA field alignment; not textbook ~0.54). */
export const SOMATOTYPE_SMM_FFM_RATIO = 0.57;

/** Soft physiological bands — keep chart math out of absurd / off-chart regimes. */
export const SOMATOTYPE_INPUT_LIMITS = {
  heightCmMin: 120,
  heightCmMax: 230,
  weightKgMin: 35,
  weightKgMax: 250,
  bodyFatPctMin: 0,
  bodyFatPctMax: 60,
  wristCmMin: 10,
  wristCmMax: 25,
  flexedArmGirthCmMin: 15,
  flexedArmGirthCmMax: 70,
} as const;

export interface GrantIndexResult {
  grantIndex: number;
  humerusBreadthCm: number;
  femurBreadthCm: number;
}

export interface SomatotypeMetrics {
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  wristCm: number;
  flexedArmGirthCm: number;
  /** Veteran bone-density residual compensation (+5% humerus). */
  isVeteran?: boolean;
}

export interface HeathCarterSomatotype {
  endomorphy: number;
  mesomorphy: number;
  ectomorphy: number;
  hwr: number;
  humerusBreadthCm: number;
  femurBreadthCm: number;
  correctedArmGirthCm: number;
  atypicalProportion: boolean;
}

export interface SomatochartPoint {
  x: number;
  y: number;
}

export interface MaxTunedPhysiqueSpec {
  physiqueTier: PhysiqueTier;
  bodyFatPct: number;
  ffmMaxKg: number;
  /**
   * Max total body weight at target BF (1dp): FFM_Max / (1 - targetBF/100).
   * WHY: When legendary mode locks FFM/arm, tier BF switches still move this readout.
   */
  maxTotalWeightKg: number;
  armGirthMaxCm: number;
  /**
   * True when live arm girth already beat the skeletal formula ceiling
   * (legendary hypertrophy guardrail). Veteran +5% bone compensation is redundant.
   */
  legendaryArmMode: boolean;
  somatotype: HeathCarterSomatotype;
  coordinates: SomatochartPoint;
}

export interface MaxTunedPhysiqueParams {
  heightCm: number;
  wristCm: number;
  isVeteran?: boolean;
  currentBodyFatPct?: number;
  currentWeightKg?: number;
  currentArmGirthCm?: number;
  physiqueTier?: PhysiqueTier;
}

export interface SomatotypeLabSnapshot {
  /** Normalized metrics that produced this snapshot (single source for UI gauges). */
  metrics: Readonly<Required<SomatotypeMetrics>>;
  /** Mirrors maxTuned.physiqueTier — kept at root for report/UI convenience. */
  physiqueTier: PhysiqueTier;
  current: HeathCarterSomatotype;
  currentPoint: SomatochartPoint;
  maxTuned: MaxTunedPhysiqueSpec;
  armGapCm: number;
  bodyFatGapPct: number;
  /** maxTuned.maxTotalWeightKg − current weight (1dp); can be negative if already above ceiling. */
  weightGapKg: number;
  currentSmmKg: number;
  maxSmmKg: number;
  smmGapKg: number;
}

function sanitizePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function inBand(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/** WHY: Reject garbage inputs before Grant/HWR can emit meaningless chart coordinates. */
export function isValidSomatotypeMetrics(metrics: SomatotypeMetrics): boolean {
  const L = SOMATOTYPE_INPUT_LIMITS;
  return (
    inBand(metrics.heightCm, L.heightCmMin, L.heightCmMax) &&
    inBand(metrics.weightKg, L.weightKgMin, L.weightKgMax) &&
    inBand(metrics.bodyFatPct, L.bodyFatPctMin, L.bodyFatPctMax) &&
    inBand(metrics.wristCm, L.wristCmMin, L.wristCmMax) &&
    inBand(metrics.flexedArmGirthCm, L.flexedArmGirthCmMin, L.flexedArmGirthCmMax)
  );
}

/** Fat-free mass from scale weight + body-fat %. */
export function calculateFatFreeMassKg(weightKg: number, bodyFatPct: number): number {
  const weight = sanitizePositive(weightKg);
  if (weight <= 0 || !Number.isFinite(bodyFatPct) || bodyFatPct < 0 || bodyFatPct >= 100) {
    return 0;
  }
  return round3(weight * (1 - bodyFatPct / 100));
}

/**
 * Skeletal muscle mass ≈ 57% of FFM — InBody commercial BIA convention.
 * WHY: Aligns lab readout with machines athletes already trust; 1dp matches InBody display.
 */
export function estimateSkeletalMuscleMassKg(ffmKg: number): number {
  const ffm = sanitizePositive(ffmKg);
  if (ffm <= 0) return 0;
  return round1(ffm * SOMATOTYPE_SMM_FFM_RATIO);
}

/**
 * Grant Index MLR: height + wrist → humerus / femur biepicondylar breadth.
 * Veteran checkbox applies +5% residual compensation on humerus only.
 */
export function calculateGrantIndex(
  heightCm: number,
  wristCm: number,
  isVeteran = false
): GrantIndexResult | null {
  const height = sanitizePositive(heightCm);
  const wrist = sanitizePositive(wristCm);
  if (height <= 0 || wrist <= 0) return null;

  const grantIndex = height / wrist;
  let humerusBreadthCm = 0.025 * height + 0.12 * wrist - 0.05 * grantIndex + 1.2;
  if (isVeteran) {
    humerusBreadthCm *= SOMATOTYPE_VETERAN_HUMERUS_FACTOR;
  }
  const femurBreadthCm = 0.032 * height + 0.09 * wrist - 0.03 * grantIndex + 2.1;

  return {
    grantIndex: round3(grantIndex),
    humerusBreadthCm: round3(humerusBreadthCm),
    femurBreadthCm: round3(femurBreadthCm),
  };
}

/**
 * Height-weight ratio for ectomorphy piecewise branch.
 * HWR = height / cbrt(weight).
 */
export function calculateHeightWeightRatio(heightCm: number, weightKg: number): number {
  const height = sanitizePositive(heightCm);
  const weight = sanitizePositive(weightKg);
  if (height <= 0 || weight <= 0) return 0;
  return height / Math.cbrt(weight);
}

export function calculateEctomorphyFromHwr(hwr: number): number {
  if (!Number.isFinite(hwr) || hwr <= 0) return SOMATOTYPE_ECTO_FLOOR;
  if (hwr >= SOMATOTYPE_HWR_HIGH) {
    return round3(0.732 * hwr - 28.58);
  }
  if (hwr >= SOMATOTYPE_HWR_MID) {
    return round3(0.463 * hwr - 17.63);
  }
  // Hard floor — prevents negative ecto for super-heavy athletes (HWR < 38.25).
  return SOMATOTYPE_ECTO_FLOOR;
}

/**
 * Reverse Heath–Carter from home-measurable metrics (no skinfold calipers).
 */
export function calculateHeathCarterSomatotype(
  metrics: SomatotypeMetrics
): HeathCarterSomatotype | null {
  const heightCm = sanitizePositive(metrics.heightCm);
  const weightKg = sanitizePositive(metrics.weightKg);
  const bodyFatPct = Number(metrics.bodyFatPct);
  const wristCm = sanitizePositive(metrics.wristCm);
  const flexedArmGirthCm = sanitizePositive(metrics.flexedArmGirthCm);

  if (
    heightCm <= 0 ||
    weightKg <= 0 ||
    wristCm <= 0 ||
    flexedArmGirthCm <= 0 ||
    !Number.isFinite(bodyFatPct) ||
    bodyFatPct < 0
  ) {
    return null;
  }

  const bones = calculateGrantIndex(heightCm, wristCm, Boolean(metrics.isVeteran));
  if (!bones) return null;

  const endomorphy = round3(Math.max(SOMATOTYPE_ENDO_FLOOR, bodyFatPct * 0.15 + 0.5));
  const skinfoldEstimateMm = bodyFatPct * 0.8;
  // Floor at 0 — extreme BF% skinfold estimate must not invert corrected girth into nonsense meso.
  const correctedArmGirthCm = round3(Math.max(0, flexedArmGirthCm - skinfoldEstimateMm / 10));
  const mesomorphy = round3(
    0.85 * bones.humerusBreadthCm +
      0.75 * bones.femurBreadthCm +
      0.16 * correctedArmGirthCm -
      0.12 * heightCm +
      4.5
  );

  const hwr = round3(calculateHeightWeightRatio(heightCm, weightKg));
  const ectomorphy = calculateEctomorphyFromHwr(hwr);
  const atypicalProportion =
    hwr < SOMATOTYPE_HWR_ATYPICAL_LOW || hwr > SOMATOTYPE_HWR_ATYPICAL_HIGH;

  return {
    endomorphy,
    mesomorphy,
    ectomorphy,
    hwr,
    humerusBreadthCm: bones.humerusBreadthCm,
    femurBreadthCm: bones.femurBreadthCm,
    correctedArmGirthCm,
    atypicalProportion,
  };
}

/** Affine map onto the Heath–Carter somatochart plane. */
export function convertToSomatochartCoordinates(
  endo: number,
  meso: number,
  ecto: number
): SomatochartPoint {
  return {
    x: round3(ecto - endo),
    y: round3(2 * meso - (endo + ecto)),
  };
}

/**
 * Max-tuned physique (point B).
 *
 * WHY: Civilian FFM/arm ceilings under-estimate elites who already beat the formula.
 * IMPACT: Tiered BF anchors + hypertrophy/FFM headroom so point B never shrinks inward of A.
 */
export function isPhysiqueTier(value: unknown): value is PhysiqueTier {
  return typeof value === 'string' && (PHYSIQUE_TIERS as readonly string[]).includes(value);
}

export function resolvePhysiqueTier(tier: PhysiqueTier | undefined): PhysiqueTier {
  return isPhysiqueTier(tier) ? tier : DEFAULT_PHYSIQUE_TIER;
}

export function resolvePhysiqueTierTargetBf(tier: PhysiqueTier | undefined): number {
  return PHYSIQUE_TIER_TARGET_BF_PCT[resolvePhysiqueTier(tier)];
}

/**
 * Point-B body-fat lock: use the selected tier target, but never raise BF above current
 * when the athlete is already leaner than that tier (legendary lean defense).
 */
export function resolveMaxTunedBodyFatPct(
  currentBodyFatPct: number | undefined,
  physiqueTier: PhysiqueTier | undefined = DEFAULT_PHYSIQUE_TIER
): number {
  const tierTarget = resolvePhysiqueTierTargetBf(physiqueTier);
  if (currentBodyFatPct == null || !Number.isFinite(currentBodyFatPct) || currentBodyFatPct < 0) {
    return tierTarget;
  }
  return Math.min(tierTarget, currentBodyFatPct);
}

/**
 * Max total body weight at a BF target (1dp display / gauge contract).
 * Formula: round1(FFM_Max / (1 − targetBF/100)).
 */
export function resolveMaxTotalWeightKg(ffmMaxKg: number, targetBodyFatPct: number): number {
  const ffm = sanitizePositive(ffmMaxKg);
  if (ffm <= 0 || !Number.isFinite(targetBodyFatPct) || targetBodyFatPct < 0 || targetBodyFatPct >= 100) {
    return 0;
  }
  const leanFraction = Math.max(1e-6, 1 - targetBodyFatPct / 100);
  return round1(ffm / leanFraction);
}

export function calculateMaxTunedPhysique(
  params: MaxTunedPhysiqueParams
): MaxTunedPhysiqueSpec | null {
  const height = sanitizePositive(params.heightCm);
  const wrist = sanitizePositive(params.wristCm);
  if (height <= 0 || wrist <= 0) return null;

  const physiqueTier = resolvePhysiqueTier(params.physiqueTier);
  const targetBf = resolveMaxTunedBodyFatPct(params.currentBodyFatPct, physiqueTier);

  let ffmMaxKg = round3(height * 0.35 + wrist * 2.2 - 15);
  if (ffmMaxKg <= 0) return null;

  const currentWeight = sanitizePositive(params.currentWeightKg ?? 0);
  const currentBf = Number(params.currentBodyFatPct);
  if (currentWeight > 0 && Number.isFinite(currentBf) && currentBf >= 0 && currentBf < 100) {
    const currentFfmKg = currentWeight * (1 - currentBf / 100);
    // Elite FFM guardrail: real lean mass already above skeletal estimate → +5% headroom.
    if (currentFfmKg > ffmMaxKg) {
      ffmMaxKg = round3(currentFfmKg * SOMATOTYPE_ELITE_HEADROOM);
    }
  }

  // 1dp max total weight — moves with tier BF even when FFM/arm are legendary-locked.
  const maxTotalWeightKg = resolveMaxTotalWeightKg(ffmMaxKg, targetBf);
  if (maxTotalWeightKg <= 0) return null;

  let armGirthMaxCm = round3(wrist * 1.6 + (ffmMaxKg / height) * 15);
  const currentArm = sanitizePositive(params.currentArmGirthCm ?? 0);
  // Elite arm guardrail: live girth already past formula ceiling → +5% breakthrough potential.
  const legendaryArmMode = currentArm > armGirthMaxCm;
  if (legendaryArmMode) {
    armGirthMaxCm = round1(currentArm * SOMATOTYPE_ELITE_HEADROOM);
  }

  // Legendary mode already models breakthrough hypertrophy — veteran humerus boost is noise.
  const effectiveVeteran = legendaryArmMode ? false : Boolean(params.isVeteran);

  const somatotype = calculateHeathCarterSomatotype({
    heightCm: height,
    weightKg: maxTotalWeightKg,
    bodyFatPct: targetBf,
    wristCm: wrist,
    flexedArmGirthCm: armGirthMaxCm,
    isVeteran: effectiveVeteran,
  });
  if (!somatotype) return null;

  return {
    physiqueTier,
    bodyFatPct: targetBf,
    ffmMaxKg,
    maxTotalWeightKg,
    armGirthMaxCm,
    legendaryArmMode,
    somatotype,
    coordinates: convertToSomatochartCoordinates(
      somatotype.endomorphy,
      somatotype.mesomorphy,
      somatotype.ectomorphy
    ),
  };
}

export interface BuildSomatotypeLabSnapshotInput extends SomatotypeMetrics {
  physiqueTier?: PhysiqueTier;
}

/** Full dual-point lab snapshot for chart + gap gauge. */
export function buildSomatotypeLabSnapshot(
  metrics: BuildSomatotypeLabSnapshotInput
): SomatotypeLabSnapshot | null {
  if (!isValidSomatotypeMetrics(metrics)) return null;

  const physiqueTier = resolvePhysiqueTier(metrics.physiqueTier);

  const maxTuned = calculateMaxTunedPhysique({
    heightCm: metrics.heightCm,
    wristCm: metrics.wristCm,
    isVeteran: Boolean(metrics.isVeteran),
    currentBodyFatPct: metrics.bodyFatPct,
    currentWeightKg: metrics.weightKg,
    currentArmGirthCm: metrics.flexedArmGirthCm,
    physiqueTier,
  });
  if (!maxTuned) return null;

  // Lock veteran off when legendary arm mode fires — bone +5% no longer has scientific meaning.
  const effectiveVeteran = maxTuned.legendaryArmMode ? false : Boolean(metrics.isVeteran);

  const normalized: Required<SomatotypeMetrics> = {
    heightCm: metrics.heightCm,
    weightKg: metrics.weightKg,
    bodyFatPct: metrics.bodyFatPct,
    wristCm: metrics.wristCm,
    flexedArmGirthCm: metrics.flexedArmGirthCm,
    isVeteran: effectiveVeteran,
  };

  const current = calculateHeathCarterSomatotype(normalized);
  if (!current) return null;

  const currentPoint = convertToSomatochartCoordinates(
    current.endomorphy,
    current.mesomorphy,
    current.ectomorphy
  );

  const currentFfmKg = calculateFatFreeMassKg(normalized.weightKg, normalized.bodyFatPct);
  const currentSmmKg = estimateSkeletalMuscleMassKg(currentFfmKg);
  const maxSmmKg = estimateSkeletalMuscleMassKg(maxTuned.ffmMaxKg);

  return {
    metrics: normalized,
    physiqueTier,
    current,
    currentPoint,
    maxTuned,
    armGapCm: round3(maxTuned.armGirthMaxCm - normalized.flexedArmGirthCm),
    bodyFatGapPct: round3(normalized.bodyFatPct - maxTuned.bodyFatPct),
    weightGapKg: round1(maxTuned.maxTotalWeightKg - normalized.weightKg),
    currentSmmKg,
    maxSmmKg,
    smmGapKg: round1(maxSmmKg - currentSmmKg),
  };
}
