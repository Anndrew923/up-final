import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHYSIQUE_TIER,
  PHYSIQUE_TIER_TARGET_BF_PCT,
  PHYSIQUE_TIER_TARGET_BF_PCT_FEMALE,
  SOMATOTYPE_BF_MAX_TUNED_PCT,
  SOMATOTYPE_ECTO_FLOOR,
  SOMATOTYPE_ELITE_HEADROOM,
  SOMATOTYPE_ENDO_FLOOR,
  SOMATOTYPE_FEMALE_MORPHOLOGY_FACTOR,
  SOMATOTYPE_FEMALE_GOLDEN_BMI,
  SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT,
  SOMATOTYPE_FEMALE_GOLDEN_FFM_FRACTION,
  SOMATOTYPE_FEMALE_GOLDEN_SMM_FFM_RATIO,
  SOMATOTYPE_MALE_GOLDEN_BMI,
  SOMATOTYPE_MALE_GOLDEN_BODY_FAT_PCT,
  SOMATOTYPE_MALE_GOLDEN_SMM_FFM_RATIO,
  SOMATOTYPE_HWR_MID,
  SOMATOTYPE_ARM_SMM_VOLUME_FACTOR,
  SOMATOTYPE_ARM_SMM_VOLUME_FACTOR_FEMALE,
  SOMATOTYPE_SMM_FFM_RATIO,
  SOMATOTYPE_VETERAN_HUMERUS_FACTOR,
  buildSomatotypeLabSnapshot,
  calculateEctomorphyFromHwr,
  calculateFatFreeMassKg,
  calculateFemaleGoldenRatio,
  calculateMaleGoldenRatio,
  calculateGrantIndex,
  calculateHeathCarterSomatotype,
  calculateHeightWeightRatio,
  calculateMaxTunedPhysique,
  convertToSomatochartCoordinates,
  estimateSkeletalMuscleMassKg,
  isPhysiqueTier,
  resolveGoldenArmGirthCm,
  resolveMaxArmCircumferenceCm,
  resolveMaxTotalWeightKg,
  resolveMaxTunedBodyFatPct,
  resolvePhysiqueTier,
  resolvePhysiqueTierTargetBf,
  resolveBeyondHumanLimits,
  SOMATOTYPE_FEMALE_BEYOND_ARM_CM,
  SOMATOTYPE_MALE_BEYOND_ARM_CM,
} from '../somatotypeLab';
import zhTools from '../../../i18n/locales/zh-Hant/common/tools.json';
import enTools from '../../../i18n/locales/en/common/tools.json';

describe('calculateGrantIndex', () => {
  it('returns null for non-positive inputs', () => {
    expect(calculateGrantIndex(0, 17)).toBeNull();
    expect(calculateGrantIndex(180, 0)).toBeNull();
  });

  it('matches MLR coefficients for a known frame', () => {
    const height = 180;
    const wrist = 17;
    const index = height / wrist;
    const expectedHumerus = 0.025 * height + 0.12 * wrist - 0.05 * index + 1.2;
    const expectedFemur = 0.032 * height + 0.09 * wrist - 0.03 * index + 2.1;
    const result = calculateGrantIndex(height, wrist);
    expect(result).not.toBeNull();
    expect(result!.grantIndex).toBeCloseTo(index, 3);
    expect(result!.humerusBreadthCm).toBeCloseTo(expectedHumerus, 3);
    expect(result!.femurBreadthCm).toBeCloseTo(expectedFemur, 3);
  });

  it('applies +5% humerus residual when isVeteran', () => {
    const height = 178;
    const wrist = 16.5;
    const index = height / wrist;
    const rawHumerus = 0.025 * height + 0.12 * wrist - 0.05 * index + 1.2;
    const base = calculateGrantIndex(height, wrist, false)!;
    const vet = calculateGrantIndex(height, wrist, true)!;
    expect(vet.humerusBreadthCm).toBeCloseTo(rawHumerus * SOMATOTYPE_VETERAN_HUMERUS_FACTOR, 3);
    expect(vet.humerusBreadthCm).toBeGreaterThan(base.humerusBreadthCm);
    expect(vet.femurBreadthCm).toBeCloseTo(base.femurBreadthCm, 3);
  });
});

describe('ectomorphy / HWR', () => {
  it('computes HWR as height / cbrt(weight)', () => {
    expect(calculateHeightWeightRatio(180, 80)).toBeCloseTo(180 / Math.cbrt(80), 6);
  });

  it('locks ecto to floor when HWR < 38.25', () => {
    expect(calculateEctomorphyFromHwr(SOMATOTYPE_HWR_MID - 0.01)).toBe(SOMATOTYPE_ECTO_FLOOR);
    expect(calculateEctomorphyFromHwr(30)).toBe(SOMATOTYPE_ECTO_FLOOR);
  });

  it('uses mid and high piecewise branches', () => {
    expect(calculateEctomorphyFromHwr(39)).toBeCloseTo(0.463 * 39 - 17.63, 3);
    expect(calculateEctomorphyFromHwr(42)).toBeCloseTo(0.732 * 42 - 28.58, 3);
  });
});

describe('calculateHeathCarterSomatotype', () => {
  const baseMetrics = {
    heightCm: 180,
    weightKg: 80,
    bodyFatPct: 18,
    wristCm: 17,
    flexedArmGirthCm: 38,
  };

  it('maps endomorphy from BF% with floor 0.5', () => {
    const result = calculateHeathCarterSomatotype(baseMetrics)!;
    expect(result.endomorphy).toBeCloseTo(18 * 0.15 + 0.5, 3);
    const lean = calculateHeathCarterSomatotype({ ...baseMetrics, bodyFatPct: 0 })!;
    expect(lean.endomorphy).toBe(SOMATOTYPE_ENDO_FLOOR);
  });

  it('builds mesomorphy from corrected arm + grant bones', () => {
    const bones = calculateGrantIndex(180, 17)!;
    const skinfoldMm = 18 * 0.8;
    const corrected = 38 - skinfoldMm / 10;
    const expectedMeso =
      0.85 * bones.humerusBreadthCm +
      0.75 * bones.femurBreadthCm +
      0.16 * corrected -
      0.12 * 180 +
      4.5;
    const result = calculateHeathCarterSomatotype(baseMetrics)!;
    expect(result.mesomorphy).toBeCloseTo(expectedMeso, 3);
    expect(result.correctedArmGirthCm).toBeCloseTo(corrected, 3);
  });
});

describe('convertToSomatochartCoordinates', () => {
  it('applies affine X = ecto - endo, Y = 2*meso - (endo + ecto)', () => {
    expect(convertToSomatochartCoordinates(3, 5, 2)).toEqual({ x: -1, y: 5 });
  });
});

describe('skeletal muscle mass (SMM)', () => {
  it('maps FFM to SMM at the InBody 0.57 ratio with 1dp rounding', () => {
    expect(SOMATOTYPE_SMM_FFM_RATIO).toBe(0.57);
    expect(estimateSkeletalMuscleMassKg(100)).toBe(57);
    expect(estimateSkeletalMuscleMassKg(0)).toBe(0);
    const ffm = calculateFatFreeMassKg(95, 9.3);
    expect(ffm).toBeCloseTo(95 * (1 - 0.093), 3);
    expect(estimateSkeletalMuscleMassKg(ffm)).toBe(
      Math.round(ffm * SOMATOTYPE_SMM_FFM_RATIO * 10) / 10
    );
  });
});

describe('resolveMaxTotalWeightKg', () => {
  it('applies 1dp FFM / lean-fraction formula and rejects invalid inputs', () => {
    expect(resolveMaxTotalWeightKg(86.85, 12)).toBe(Math.round((86.85 / 0.88) * 10) / 10);
    expect(resolveMaxTotalWeightKg(86.85, 9)).toBe(Math.round((86.85 / 0.91) * 10) / 10);
    expect(resolveMaxTotalWeightKg(86.85, 7)).toBe(Math.round((86.85 / 0.93) * 10) / 10);
    expect(resolveMaxTotalWeightKg(0, 12)).toBe(0);
    expect(resolveMaxTotalWeightKg(80, 100)).toBe(0);
    expect(resolveMaxTotalWeightKg(80, -1)).toBe(0);
  });
});

describe('physique tier anchors', () => {
  it('keeps athletic BF constant single-sourced and validates tier ids', () => {
    expect(SOMATOTYPE_BF_MAX_TUNED_PCT).toBe(PHYSIQUE_TIER_TARGET_BF_PCT.athletic);
    expect(resolvePhysiqueTier(undefined)).toBe(DEFAULT_PHYSIQUE_TIER);
    expect(resolvePhysiqueTier('apex')).toBe('apex');
    expect(isPhysiqueTier('elite')).toBe(true);
    expect(isPhysiqueTier('street')).toBe(false);
  });
});

describe('max tuned physique + lab snapshot', () => {
  it('locks BF at athletic 12% and derives FFM / weight / arm ceiling for civilians', () => {
    const height = 180;
    const wrist = 17;
    const ffm = height * 0.35 + wrist * 2.2 - 15;
    const weight = Math.round((ffm / (1 - 0.12)) * 10) / 10;
    const arm = Math.round((wrist * 1.6 + (ffm / height) * 15) * 10) / 10;
    const max = calculateMaxTunedPhysique({ heightCm: height, wristCm: wrist })!;
    expect(max.physiqueTier).toBe('athletic');
    expect(max.bodyFatPct).toBe(SOMATOTYPE_BF_MAX_TUNED_PCT);
    expect(max.ffmMaxKg).toBeCloseTo(ffm, 3);
    expect(max.maxTotalWeightKg).toBe(weight);
    expect(max.maxTotalWeightKg).toBe(resolveMaxTotalWeightKg(max.ffmMaxKg, max.bodyFatPct));
    expect(max.armGirthMaxCm).toBe(arm);
    expect(max.coordinates.x).toBeDefined();
    expect(max.coordinates.y).toBeDefined();
  });

  it('adds SMM volume-parity arm bonus for the field Boss frame under apex', () => {
    // Weight chosen so current SMM ≈ 32.9 kg at BF 24.2% (InBody 0.57 path).
    const boss = {
      heightCm: 170,
      weightKg: 76.15,
      bodyFatPct: 24.2,
      wristCm: 16.7,
      flexedArmGirthCm: 35,
      physiqueTier: 'apex' as const,
    };
    const snap = buildSomatotypeLabSnapshot(boss)!;
    expect(snap.currentSmmKg).toBeCloseTo(32.9, 1);
    expect(snap.maxSmmKg).toBeCloseTo(46.3, 1);
    const maxSmmResidualKg = Math.round((snap.maxSmmKg - snap.currentSmmKg) * 10) / 10;
    expect(maxSmmResidualKg).toBeCloseTo(13.4, 1);
    // Civilian Boss frame sits under golden mid-target → upgrade gaps use golden, not max residual.
    expect(snap.gapBenchmark).toBe('golden');
    expect(snap.goldenRatio).not.toBeNull();

    const arm = resolveMaxArmCircumferenceCm({
      heightCm: boss.heightCm,
      wristCm: boss.wristCm,
      ffmMaxKg: snap.maxTuned.ffmMaxKg,
      currentArmGirthCm: boss.flexedArmGirthCm,
      currentSmmKg: snap.currentSmmKg,
      maxSmmKg: snap.maxSmmKg,
    })!;
    // Volume factor × ~13.4 kg SMM gap on the live-arm floor (maxTuned path).
    expect(arm.volumeBonusCm).toBeCloseTo(
      maxSmmResidualKg * SOMATOTYPE_ARM_SMM_VOLUME_FACTOR,
      3
    );
    expect(snap.maxTuned.armGirthMaxCm).toBe(arm.armGirthMaxCm);
    expect(snap.maxTuned.armGirthMaxCm).toBe(
      Math.round(
        (Math.max(arm.skeletalBaselineCm, boss.flexedArmGirthCm) + arm.volumeBonusCm) * 10
      ) / 10
    );
    expect(snap.maxTuned.legendaryArmMode).toBe(false);
    expect(snap.maxTuned.maxTotalWeightKg).toBe(
      resolveMaxTotalWeightKg(snap.maxTuned.ffmMaxKg, snap.maxTuned.bodyFatPct)
    );
  });

  it('unlocks tank-frame arm ceiling (≥43.8) for 175cm / +12.2kg SMM under elite', () => {
    // Journey toward max stage weight ~91.2 kg @ 9% BF / max SMM ~47.3 kg.
    const tank = {
      heightCm: 175,
      weightKg: 80,
      bodyFatPct: 23,
      wristCm: 16.7,
      flexedArmGirthCm: 38,
      physiqueTier: 'elite' as const,
    };
    const snap = buildSomatotypeLabSnapshot(tank)!;
    expect(snap.currentSmmKg).toBeCloseTo(35.1, 1);
    expect(snap.maxSmmKg).toBeCloseTo(47.3, 1);
    const maxSmmResidualKg = Math.round((snap.maxSmmKg - snap.currentSmmKg) * 10) / 10;
    expect(maxSmmResidualKg).toBeCloseTo(12.2, 1);
    expect(snap.maxTuned.maxTotalWeightKg).toBeCloseTo(91.2, 1);
    expect(snap.gapBenchmark).toBe('golden');

    const bonus = maxSmmResidualKg * SOMATOTYPE_ARM_SMM_VOLUME_FACTOR;
    expect(bonus).toBeGreaterThanOrEqual(5.8);
    expect(bonus).toBeLessThanOrEqual(6.0);
    expect(snap.maxTuned.armGirthMaxCm).toBeGreaterThanOrEqual(43.8);
    expect(snap.maxTuned.armGirthMaxCm).toBeLessThanOrEqual(44.5);
    expect(snap.maxTuned.legendaryArmMode).toBe(false);
  });

  it('resolveMaxArmCircumferenceCm follows max(baseline, current) + ΔSMM×factor', () => {
    const resolved = resolveMaxArmCircumferenceCm({
      heightCm: 175,
      wristCm: 16.7,
      ffmMaxKg: 82.99,
      currentArmGirthCm: 38,
      currentSmmKg: 35.1,
      maxSmmKg: 47.3,
    })!;
    expect(SOMATOTYPE_ARM_SMM_VOLUME_FACTOR).toBe(0.48);
    expect(resolved.volumeBonusCm).toBeCloseTo(12.2 * SOMATOTYPE_ARM_SMM_VOLUME_FACTOR, 3);
    expect(resolved.armGirthMaxCm).toBe(
      Math.round(
        (Math.max(resolved.skeletalBaselineCm, 38) + resolved.volumeBonusCm) * 10
      ) / 10
    );
    expect(resolved.legendaryArmMode).toBe(false);
  });

  it('builds dual-point snapshot with arm and BF gaps', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 180,
      weightKg: 85,
      bodyFatPct: 20,
      wristCm: 17,
      flexedArmGirthCm: 32,
      isVeteran: false,
    })!;
    expect(snap.metrics.flexedArmGirthCm).toBe(32);
    expect(snap.maxTuned.bodyFatPct).toBe(SOMATOTYPE_BF_MAX_TUNED_PCT);
    expect(snap.goldenRatio).not.toBeNull();
    expect(snap.gapBenchmark).toBe('golden');
    expect(snap.weightGapKg).toBe(
      Math.max(0, Math.round((snap.goldenRatio!.weightKg - 85) * 10) / 10)
    );
    expect(snap.currentPoint).toEqual(
      convertToSomatochartCoordinates(
        snap.current.endomorphy,
        snap.current.mesomorphy,
        snap.current.ectomorphy
      )
    );
    expect(snap.maxTuned.coordinates).toEqual(
      convertToSomatochartCoordinates(
        snap.maxTuned.somatotype.endomorphy,
        snap.maxTuned.somatotype.mesomorphy,
        snap.maxTuned.somatotype.ectomorphy
      )
    );
    expect(snap.armGapCm).toBeCloseTo(snap.goldenRatio!.armGirthCm - 32, 3);
    expect(snap.bodyFatGapPct).toBeCloseTo(20 - snap.goldenRatio!.bodyFatPct, 3);
    expect(snap.armGapCm).toBeGreaterThan(0);
    expect(snap.bodyFatGapPct).toBeGreaterThan(0);
    expect(snap.maxTuned.legendaryArmMode).toBe(false);
    expect(snap.goldenRatio).not.toBeNull();
    expect(snap.gapBenchmark).toBe('golden');
    // Volume parity: max arm exceeds pure skeletal wrist lock when ΔSMM > 0.
    const skeletalOnly = 17 * 1.6 + (snap.maxTuned.ffmMaxKg / 180) * 15;
    expect(snap.maxTuned.armGirthMaxCm).toBeGreaterThan(skeletalOnly);
    expect(snap.currentSmmKg).toBe(
      estimateSkeletalMuscleMassKg(calculateFatFreeMassKg(85, 20))
    );
    expect(snap.maxSmmKg).toBe(estimateSkeletalMuscleMassKg(snap.maxTuned.ffmMaxKg));
    expect(snap.smmGapKg).toBe(
      Math.max(0, Math.round((snap.goldenRatio!.smmKg - snap.currentSmmKg) * 10) / 10)
    );
  });

  it('should handle elite athlete metrics properly without regression', () => {
    // Boss frame: civilian formula ~35.2cm arm / 12% BF lock would shrink point B inward.
    const weightKg = 95;
    const bodyFatPct = 9.3;
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 181,
      weightKg,
      bodyFatPct,
      wristCm: 17.5,
      flexedArmGirthCm: 43,
      isVeteran: true,
      physiqueTier: 'athletic',
    })!;

    const expectedCurrentSmm = estimateSkeletalMuscleMassKg(
      calculateFatFreeMassKg(weightKg, bodyFatPct)
    );
    const expectedMaxSmm = estimateSkeletalMuscleMassKg(snap.maxTuned.ffmMaxKg);

    expect(snap).not.toBeNull();
    expect(snap.physiqueTier).toBe('athletic');
    expect(snap.maxTuned.physiqueTier).toBe('athletic');
    expect(snap.maxTuned.bodyFatPct).toBe(9.3);
    expect(snap.maxTuned.armGirthMaxCm).toBeGreaterThan(43);
    expect(snap.maxTuned.armGirthMaxCm).toBe(45.2); // round1(43 * 1.05)
    expect(snap.maxTuned.legendaryArmMode).toBe(true);
    expect(snap.metrics.isVeteran).toBe(false); // veteran forced off under legendary mode
    expect(snap.armGapCm).toBeGreaterThan(0);
    expect(snap.bodyFatGapPct).toBe(0);
    expect(snap.currentSmmKg).toBe(expectedCurrentSmm);
    expect(snap.maxSmmKg).toBe(expectedMaxSmm);
    expect(snap.smmGapKg).toBe(Math.round((expectedMaxSmm - expectedCurrentSmm) * 10) / 10);
    expect(snap.smmGapKg).toBeGreaterThan(0);
    // Point B must sit at/above A on the meso axis — never regress toward the origin.
    expect(snap.maxTuned.coordinates.y).toBeGreaterThanOrEqual(snap.currentPoint.y);
    expect(snap.maxTuned.somatotype.mesomorphy).toBeGreaterThanOrEqual(snap.current.mesomorphy);
  });

  it('pushes Boss frame toward meso apex under elite and apex physique tiers', () => {
    const boss = {
      heightCm: 181,
      weightKg: 95,
      bodyFatPct: 9.3,
      wristCm: 17.5,
      flexedArmGirthCm: 43,
      isVeteran: true,
    } as const;

    const athletic = buildSomatotypeLabSnapshot({ ...boss, physiqueTier: 'athletic' })!;
    const elite = buildSomatotypeLabSnapshot({ ...boss, physiqueTier: 'elite' })!;
    const apex = buildSomatotypeLabSnapshot({ ...boss, physiqueTier: 'apex' })!;

    // Athletic keeps lean defense (min(12, 9.3)); elite/apex drop to tier targets.
    expect(athletic.maxTuned.bodyFatPct).toBe(9.3);
    expect(elite.maxTuned.bodyFatPct).toBe(9);
    expect(apex.maxTuned.bodyFatPct).toBe(7);
    expect(apex.bodyFatGapPct).toBeCloseTo(9.3 - 7, 3);

    // Elite FFM headroom is shared — Max SMM stays on the same lean-mass ceiling (~49 kg for Boss frame).
    expect(elite.maxSmmKg).toBe(athletic.maxSmmKg);
    expect(apex.maxSmmKg).toBe(athletic.maxSmmKg);
    expect(apex.maxSmmKg).toBe(estimateSkeletalMuscleMassKg(apex.maxTuned.ffmMaxKg));
    expect(apex.maxSmmKg).toBeGreaterThanOrEqual(49);

    // Max total weight stairs with tier BF even when FFM/arm are legendary-locked.
    // Same FFM + leaner target BF ⇒ lower stage weight (fat mass cut from the ceiling).
    const ffm = athletic.maxTuned.ffmMaxKg;
    expect(athletic.maxTuned.maxTotalWeightKg).toBe(resolveMaxTotalWeightKg(ffm, 9.3));
    expect(elite.maxTuned.maxTotalWeightKg).toBe(resolveMaxTotalWeightKg(ffm, 9));
    expect(apex.maxTuned.maxTotalWeightKg).toBe(resolveMaxTotalWeightKg(ffm, 7));
    expect(athletic.maxTuned.maxTotalWeightKg).toBeGreaterThan(elite.maxTuned.maxTotalWeightKg);
    expect(elite.maxTuned.maxTotalWeightKg).toBeGreaterThan(apex.maxTuned.maxTotalWeightKg);
    // Development potential never goes negative — overshooting stage weight floors at 0 headroom.
    expect(apex.weightGapKg).toBe(
      Math.max(0, Math.round((apex.maxTuned.maxTotalWeightKg - boss.weightKg) * 10) / 10)
    );
    expect(apex.beyondHumanLimits).toBe(false);

    // Lower endomorphy at harder tiers drives point B further toward the meso vertex.
    expect(elite.maxTuned.somatotype.endomorphy).toBeLessThan(
      athletic.maxTuned.somatotype.endomorphy
    );
    expect(apex.maxTuned.somatotype.endomorphy).toBeLessThan(elite.maxTuned.somatotype.endomorphy);
    expect(elite.maxTuned.coordinates.y).toBeGreaterThan(athletic.maxTuned.coordinates.y);
    expect(apex.maxTuned.coordinates.y).toBeGreaterThan(elite.maxTuned.coordinates.y);
    expect(apex.maxTuned.somatotype.mesomorphy).toBeGreaterThanOrEqual(
      elite.maxTuned.somatotype.mesomorphy
    );
  });

  it('anchors target BF to current when already below the selected tier lock', () => {
    expect(resolveMaxTunedBodyFatPct(undefined)).toBe(SOMATOTYPE_BF_MAX_TUNED_PCT);
    expect(resolveMaxTunedBodyFatPct(18)).toBe(12);
    expect(resolveMaxTunedBodyFatPct(9.3)).toBe(9.3);
    expect(resolveMaxTunedBodyFatPct(9.3, 'elite')).toBe(9);
    expect(resolveMaxTunedBodyFatPct(9.3, 'apex')).toBe(7);
    expect(resolveMaxTunedBodyFatPct(8, 'apex')).toBe(7);
    expect(resolveMaxTunedBodyFatPct(6, 'apex')).toBe(6);
    expect(resolveMaxTunedBodyFatPct(-1)).toBe(SOMATOTYPE_BF_MAX_TUNED_PCT);

    expect(resolvePhysiqueTierTargetBf('athletic', 'female')).toBe(
      PHYSIQUE_TIER_TARGET_BF_PCT_FEMALE.athletic
    );
    expect(resolvePhysiqueTierTargetBf('elite', 'female')).toBe(
      PHYSIQUE_TIER_TARGET_BF_PCT_FEMALE.elite
    );
    expect(resolvePhysiqueTierTargetBf('apex', 'female')).toBe(PHYSIQUE_TIER_TARGET_BF_PCT_FEMALE.apex);
    expect(resolveMaxTunedBodyFatPct(28, 'elite', 'female')).toBe(21);
    expect(resolveMaxTunedBodyFatPct(19, 'apex', 'female')).toBe(18);
    expect(resolveMaxTunedBodyFatPct(16, 'apex', 'female')).toBe(16);

    const lean = calculateMaxTunedPhysique({
      heightCm: 180,
      wristCm: 17,
      currentBodyFatPct: 8,
      currentWeightKg: 75,
      currentArmGirthCm: 34,
      physiqueTier: 'athletic',
    })!;
    expect(lean.bodyFatPct).toBe(8);
    expect(lean.physiqueTier).toBe('athletic');
    expect(lean.gender).toBe('male');
  });

  it('decouples female elegant-line track with 24/21/18 BF anchors and 0.28 arm volume factor', () => {
    const female = {
      heightCm: 165,
      weightKg: 55,
      bodyFatPct: 28,
      wristCm: 14.0,
      flexedArmGirthCm: 28,
      gender: 'female' as const,
      physiqueTier: 'elite' as const,
    };

    const snap = buildSomatotypeLabSnapshot(female)!;
    expect(snap.gender).toBe('female');
    expect(snap.maxTuned.gender).toBe('female');
    expect(snap.maxTuned.bodyFatPct).toBe(21);

    const formulaFfm = female.heightCm * 0.35 + female.wristCm * 2.2 - 15;
    const expectedFfm = Math.round(formulaFfm * SOMATOTYPE_FEMALE_MORPHOLOGY_FACTOR * 1000) / 1000;
    expect(snap.maxTuned.ffmMaxKg).toBeCloseTo(expectedFfm, 3);

    expect(snap.maxTuned.maxTotalWeightKg).toBe(resolveMaxTotalWeightKg(expectedFfm, 21));
    expect(snap.maxSmmKg).toBe(estimateSkeletalMuscleMassKg(expectedFfm));

    const maleTwin = buildSomatotypeLabSnapshot({ ...female, gender: 'male' })!;
    expect(expectedFfm).toBeCloseTo(
      Math.round(maleTwin.maxTuned.ffmMaxKg * SOMATOTYPE_FEMALE_MORPHOLOGY_FACTOR * 1000) / 1000,
      3
    );
    expect(snap.maxTuned.legendaryArmMode).toBe(false);
    expect(snap.maxTuned.armGirthMaxCm).toBeLessThan(maleTwin.maxTuned.armGirthMaxCm);

    // Field acceptance: 165cm / 14.0cm wrist → trained elegant arm band 33.5–34.5 cm.
    expect(snap.maxTuned.armGirthMaxCm).toBeGreaterThanOrEqual(33.5);
    expect(snap.maxTuned.armGirthMaxCm).toBeLessThanOrEqual(34.5);

    const athletic = buildSomatotypeLabSnapshot({ ...female, physiqueTier: 'athletic' })!;
    const apex = buildSomatotypeLabSnapshot({ ...female, physiqueTier: 'apex' })!;
    expect(athletic.maxTuned.bodyFatPct).toBe(24);
    expect(apex.maxTuned.bodyFatPct).toBe(18);
    expect(athletic.maxTuned.maxTotalWeightKg).toBeGreaterThan(snap.maxTuned.maxTotalWeightKg);
    expect(snap.maxTuned.maxTotalWeightKg).toBeGreaterThan(apex.maxTuned.maxTotalWeightKg);
    expect(athletic.maxSmmKg).toBe(snap.maxSmmKg);
    expect(apex.maxSmmKg).toBe(snap.maxSmmKg);
  });

  it('prices female arm ΔSMM with the dedicated 0.28 volume factor', () => {
    const resolved = resolveMaxArmCircumferenceCm({
      heightCm: 165,
      wristCm: 14,
      ffmMaxKg: 73.55,
      currentArmGirthCm: 28,
      currentSmmKg: 22.6,
      maxSmmKg: 41.9,
      gender: 'female',
    })!;
    expect(SOMATOTYPE_ARM_SMM_VOLUME_FACTOR_FEMALE).toBe(0.28);
    expect(resolved.volumeBonusCm).toBeCloseTo(19.3 * SOMATOTYPE_ARM_SMM_VOLUME_FACTOR_FEMALE, 3);
    expect(resolved.armGirthMaxCm).toBe(34.5);
  });

  it('never lets female morphology residual pull FFM_Max below live lean mass', () => {
    // Formula FFM ≈ 73.99 → ×0.85 ≈ 62.89; live FFM 66.3 sits between scaled and unscaled.
    const weightKg = 85;
    const bodyFatPct = 22;
    const currentFfm = weightKg * (1 - bodyFatPct / 100);
    expect(currentFfm).toBeGreaterThan(62);
    expect(currentFfm).toBeLessThan(74);

    const max = calculateMaxTunedPhysique({
      heightCm: 165,
      wristCm: 14.2,
      currentWeightKg: weightKg,
      currentBodyFatPct: bodyFatPct,
      currentArmGirthCm: 30,
      gender: 'female',
      physiqueTier: 'elite',
    })!;

    expect(max.ffmMaxKg).toBeCloseTo(currentFfm * SOMATOTYPE_ELITE_HEADROOM, 3);
    expect(max.ffmMaxKg).toBeGreaterThan(currentFfm);
    expect(max.bodyFatPct).toBe(21);
  });

  it('raises FFM_Max with elite headroom when current lean mass beats the skeletal estimate', () => {
    const height = 181;
    const wrist = 17.5;
    const formulaFfm = height * 0.35 + wrist * 2.2 - 15;
    const weight = 110;
    const bf = 10;
    const currentFfm = weight * (1 - bf / 100);
    expect(currentFfm).toBeGreaterThan(formulaFfm);

    const max = calculateMaxTunedPhysique({
      heightCm: height,
      wristCm: wrist,
      currentBodyFatPct: bf,
      currentWeightKg: weight,
      currentArmGirthCm: 38,
    })!;
    expect(max.ffmMaxKg).toBeCloseTo(currentFfm * SOMATOTYPE_ELITE_HEADROOM, 3);
  });

  it('rejects out-of-band metrics at snapshot boundary', () => {
    expect(
      buildSomatotypeLabSnapshot({
        heightCm: 90,
        weightKg: 80,
        bodyFatPct: 18,
        wristCm: 17,
        flexedArmGirthCm: 38,
      })
    ).toBeNull();
  });

  it('floors corrected arm girth at zero when skinfold estimate exceeds girth', () => {
    const result = calculateHeathCarterSomatotype({
      heightCm: 180,
      weightKg: 90,
      bodyFatPct: 50,
      wristCm: 17,
      flexedArmGirthCm: 3,
    })!;
    expect(result.correctedArmGirthCm).toBe(0);
  });

  it('zeros growth gaps and co-tunes Point B to Point A for Ronnie-class male olympia metrics', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 180,
      weightKg: 135,
      bodyFatPct: 4,
      wristCm: 19,
      flexedArmGirthCm: 61,
      gender: 'male',
      physiqueTier: 'apex',
    })!;

    expect(snap.beyondHumanLimits).toBe(true);
    expect(snap.armGapCm).toBe(0);
    expect(snap.smmGapKg).toBe(0);
    expect(snap.weightGapKg).toBe(0);
    expect(snap.bodyFatGapPct).toBe(0);
    expect(snap.metrics.flexedArmGirthCm).toBeGreaterThanOrEqual(SOMATOTYPE_MALE_BEYOND_ARM_CM);

    // Point B forced identical to live Point A — no legendary 1.05 drift.
    expect(snap.maxTuned.maxTotalWeightKg).toBe(roundWeight(snap.metrics.weightKg));
    expect(snap.maxTuned.armGirthMaxCm).toBe(roundWeight(snap.metrics.flexedArmGirthCm));
    expect(snap.maxTuned.bodyFatPct).toBe(snap.metrics.bodyFatPct);
    expect(snap.maxSmmKg).toBe(snap.currentSmmKg);
    expect(snap.maxTuned.coordinates).toEqual(snap.currentPoint);
    expect(snap.maxTuned.somatotype).toEqual(snap.current);
    expect(snap.maxTuned.legendaryArmMode).toBe(false);

    expect(zhTools.tools.somatotypeLab.gap.beyondTitle_male).toContain('Peak Physique Horizon');
    expect(zhTools.tools.somatotypeLab.gap.beyondTitle_male).toContain('極致幾何維度');
    expect(enTools.tools.somatotypeLab.gap.beyondTitle_male).toContain('Peak Physique Horizon');
    expect(zhTools.tools.somatotypeLab.gap.beyondBody_male).toContain('傳奇級巔峰體貌');
    expect(zhTools.tools.somatotypeLab.gap.beyondBody_female).toContain('史詩級極致體貌');
  });

  it('co-tunes Point B for female Olympia beyond gate at ≥35cm arm', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 165,
      weightKg: 76,
      bodyFatPct: 18,
      wristCm: 14,
      flexedArmGirthCm: 35.4,
      gender: 'female',
      physiqueTier: 'apex',
    })!;

    expect(snap.gender).toBe('female');
    expect(snap.metrics.flexedArmGirthCm).toBeGreaterThanOrEqual(SOMATOTYPE_FEMALE_BEYOND_ARM_CM);
    expect(snap.beyondHumanLimits).toBe(true);
    expect(snap.armGapCm).toBe(0);
    expect(snap.smmGapKg).toBe(0);
    expect(snap.weightGapKg).toBe(0);
    expect(snap.bodyFatGapPct).toBe(0);

    expect(snap.maxTuned.maxTotalWeightKg).toBe(roundWeight(snap.metrics.weightKg));
    expect(snap.maxTuned.armGirthMaxCm).toBe(roundWeight(snap.metrics.flexedArmGirthCm));
    expect(snap.maxTuned.bodyFatPct).toBe(snap.metrics.bodyFatPct);
    expect(snap.maxSmmKg).toBe(snap.currentSmmKg);
    expect(snap.maxTuned.coordinates).toEqual(snap.currentPoint);
    expect(snap.maxTuned.somatotype).toEqual(snap.current);
    expect(snap.maxTuned.legendaryArmMode).toBe(false);

    // Same absolute arm would not trip male absolute gate alone at 35.4cm.
    expect(
      resolveBeyondHumanLimits({
        gender: 'male',
        currentArmGirthCm: 35.4,
        currentSmmKg: 30,
        rawArmGapCm: 2,
        rawSmmGapKg: 2,
      })
    ).toBe(false);
    expect(
      resolveBeyondHumanLimits({
        gender: 'female',
        currentArmGirthCm: 35.4,
        currentSmmKg: 30,
        rawArmGapCm: 2,
        rawSmmGapKg: 2,
      })
    ).toBe(true);
  });

  it('calculates female golden-ratio anchors at 165cm / 14cm wrist with FFM×55% SMM', () => {
    expect(SOMATOTYPE_FEMALE_GOLDEN_FFM_FRACTION).toBe(1 - SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT / 100);
    expect(SOMATOTYPE_FEMALE_GOLDEN_SMM_FFM_RATIO).toBe(0.55);
    const heightCm = 165;
    const wristCm = 14;
    const heightM = heightCm / 100;
    const weightRaw = SOMATOTYPE_FEMALE_GOLDEN_BMI * heightM * heightM;
    const expectedWeight = Math.round(weightRaw * 10) / 10;
    const expectedSmm =
      Math.round(
        weightRaw * (1 - SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT / 100) * SOMATOTYPE_FEMALE_GOLDEN_SMM_FFM_RATIO * 10
      ) / 10;
    const expectedArm = resolveGoldenArmGirthCm(expectedSmm, wristCm, 'female');

    const golden = calculateFemaleGoldenRatio(heightCm, wristCm)!;
    expect(golden).not.toBeNull();
    expect(golden.weightKg).toBe(expectedWeight);
    expect(golden.weightKg).toBe(53.1);
    expect(golden.bodyFatPct).toBe(SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT);
    expect(golden.smmKg).toBe(expectedSmm);
    expect(golden.smmKg).toBe(23.4);
    expect(golden.armGirthCm).toBe(expectedArm);
    expect(golden.armGirthCm).toBeGreaterThanOrEqual(26);
    expect(golden.armGirthCm).toBeLessThanOrEqual(28);
    expect(golden.coordinates).toEqual(
      convertToSomatochartCoordinates(
        golden.somatotype.endomorphy,
        golden.somatotype.mesomorphy,
        golden.somatotype.ectomorphy
      )
    );
  });

  it('anchors 170cm female golden SMM near 24.8kg (FFM×55%, not the old 0.46 path)', () => {
    const heightCm = 170;
    const wristCm = 14.5;
    const heightM = heightCm / 100;
    const weightRaw = SOMATOTYPE_FEMALE_GOLDEN_BMI * heightM * heightM;
    const expectedWeight = Math.round(weightRaw * 10) / 10;
    const expectedSmm =
      Math.round(
        weightRaw * (1 - SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT / 100) * SOMATOTYPE_FEMALE_GOLDEN_SMM_FFM_RATIO * 10
      ) / 10;

    const golden = calculateFemaleGoldenRatio(heightCm, wristCm)!;
    expect(expectedWeight).toBe(56.4);
    expect(golden.weightKg).toBe(56.4);
    expect(expectedSmm).toBe(24.8);
    expect(golden.smmKg).toBe(24.8);
    // Guard: old 0.46×FFM path produced ~20.7 — must not regress.
    expect(golden.smmKg).toBeGreaterThan(22);
  });

  it('anchors 181cm male golden at BMI 23 → ~75.3kg / ~38.2kg SMM (clothes-hanger line)', () => {
    expect(SOMATOTYPE_MALE_GOLDEN_BMI).toBe(23);
    expect(SOMATOTYPE_MALE_GOLDEN_BODY_FAT_PCT).toBe(11);
    expect(SOMATOTYPE_MALE_GOLDEN_SMM_FFM_RATIO).toBe(0.57);

    const heightCm = 181;
    const wristCm = 17.5;
    const heightM = heightCm / 100;
    const weightRaw = SOMATOTYPE_MALE_GOLDEN_BMI * heightM * heightM;
    const expectedWeight = Math.round(weightRaw * 10) / 10;
    const expectedSmm =
      Math.round(
        weightRaw *
          (1 - SOMATOTYPE_MALE_GOLDEN_BODY_FAT_PCT / 100) *
          SOMATOTYPE_MALE_GOLDEN_SMM_FFM_RATIO *
          10
      ) / 10;

    const golden = calculateMaleGoldenRatio(heightCm, wristCm)!;
    // 23 × 1.81² = 75.3503 → 1dp IEEE rounds to 75.4 (Boss visual ≈75.3).
    expect(expectedWeight).toBe(75.4);
    expect(golden.weightKg).toBe(75.4);
    expect(expectedSmm).toBe(38.2);
    expect(golden.smmKg).toBe(38.2);
    expect(golden.bodyFatPct).toBe(11);
    expect(golden.armGirthCm).toBeGreaterThanOrEqual(36);
    expect(golden.armGirthCm).toBeLessThanOrEqual(38);
    expect(golden.weightKg).toBeCloseTo(75.3, 0);
    expect(golden.smmKg).toBeCloseTo(38.2, 1);

    const snap = buildSomatotypeLabSnapshot({
      heightCm,
      weightKg: 70,
      bodyFatPct: 16,
      wristCm,
      flexedArmGirthCm: 34,
      gender: 'male',
      physiqueTier: 'athletic',
    })!;
    expect(snap.goldenRatio).not.toBeNull();
    expect(snap.goldenRatio!.weightKg).toBe(75.4);
    expect(snap.goldenRatio!.smmKg).toBe(38.2);
    expect(snap.gapBenchmark).toBe('golden');
  });

  it('exposes golden upgrade-guide i18n keys so GapGauge never renders raw key paths', () => {
    expect(zhTools.tools.somatotypeLab.gap.upgradeGuideGolden).toContain('黃金比例');
    expect(zhTools.tools.somatotypeLab.gap.upgradeGuideAtGolden).toContain('黃金比例');
    expect(enTools.tools.somatotypeLab.gap.upgradeGuideGolden.toLowerCase()).toContain('golden');
    expect(enTools.tools.somatotypeLab.gap.upgradeGuideAtGolden.toLowerCase()).toContain('golden');
    expect(zhTools.tools.somatotypeLab.gap.goldenLabel).toContain('Golden Ratio');
  });

  it('uses golden gap benchmark when female has not cleared golden SMM+arm+BF≤20', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 165,
      weightKg: 45,
      bodyFatPct: 28,
      wristCm: 14,
      flexedArmGirthCm: 24,
      gender: 'female',
      physiqueTier: 'athletic',
    })!;

    expect(snap.goldenRatio).not.toBeNull();
    expect(snap.maxTuned).toBeTruthy();
    expect(snap.gapBenchmark).toBe('golden');

    const golden = snap.goldenRatio!;
    expect(snap.armGapCm).toBe(
      Math.max(0, Math.round((golden.armGirthCm - 24) * 1000) / 1000)
    );
    expect(snap.smmGapKg).toBe(Math.max(0, Math.round((golden.smmKg - snap.currentSmmKg) * 10) / 10));
    expect(snap.weightGapKg).toBe(Math.max(0, Math.round((golden.weightKg - 45) * 10) / 10));
    expect(snap.bodyFatGapPct).toBeCloseTo(28 - SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT, 3);
    expect(snap.armGapCm).toBeGreaterThan(0);
    expect(snap.smmGapKg).toBeGreaterThan(0);
  });

  it('switches to maxTuned gaps once female clears golden SMM+arm+BF≤20', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 165,
      weightKg: 54,
      bodyFatPct: 18,
      wristCm: 14,
      flexedArmGirthCm: 28,
      gender: 'female',
      physiqueTier: 'elite',
    })!;

    expect(snap.goldenRatio).not.toBeNull();
    expect(snap.currentSmmKg).toBeGreaterThanOrEqual(snap.goldenRatio!.smmKg);
    expect(snap.metrics.flexedArmGirthCm).toBeGreaterThanOrEqual(snap.goldenRatio!.armGirthCm);
    expect(snap.metrics.bodyFatPct).toBeLessThanOrEqual(SOMATOTYPE_FEMALE_GOLDEN_BODY_FAT_PCT);
    expect(snap.beyondHumanLimits).toBe(false);
    expect(snap.gapBenchmark).toBe('maxTuned');

    expect(snap.armGapCm).toBe(
      Math.max(0, Math.round((snap.maxTuned.armGirthMaxCm - 28) * 1000) / 1000)
    );
    expect(snap.smmGapKg).toBe(
      Math.max(0, Math.round((snap.maxSmmKg - snap.currentSmmKg) * 10) / 10)
    );
    expect(snap.weightGapKg).toBe(
      Math.max(0, Math.round((snap.maxTuned.maxTotalWeightKg - 54) * 10) / 10)
    );
    expect(snap.bodyFatGapPct).toBeCloseTo(18 - snap.maxTuned.bodyFatPct, 3);
  });

  it('switches to maxTuned gaps once male clears golden SMM+arm+BF≤11', () => {
    const snap = buildSomatotypeLabSnapshot({
      heightCm: 181,
      weightKg: 78,
      bodyFatPct: 10,
      wristCm: 17.5,
      flexedArmGirthCm: 38,
      gender: 'male',
      physiqueTier: 'athletic',
    })!;

    expect(snap.goldenRatio).not.toBeNull();
    expect(snap.currentSmmKg).toBeGreaterThanOrEqual(snap.goldenRatio!.smmKg);
    expect(snap.metrics.flexedArmGirthCm).toBeGreaterThanOrEqual(snap.goldenRatio!.armGirthCm);
    expect(snap.metrics.bodyFatPct).toBeLessThanOrEqual(SOMATOTYPE_MALE_GOLDEN_BODY_FAT_PCT);
    expect(snap.beyondHumanLimits).toBe(false);
    expect(snap.gapBenchmark).toBe('maxTuned');
    expect(snap.armGapCm).toBe(
      Math.max(0, Math.round((snap.maxTuned.armGirthMaxCm - 38) * 1000) / 1000)
    );
  });
});

function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}
