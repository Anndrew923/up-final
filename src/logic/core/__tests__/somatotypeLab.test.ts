import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHYSIQUE_TIER,
  PHYSIQUE_TIER_TARGET_BF_PCT,
  SOMATOTYPE_BF_MAX_TUNED_PCT,
  SOMATOTYPE_ECTO_FLOOR,
  SOMATOTYPE_ELITE_HEADROOM,
  SOMATOTYPE_ENDO_FLOOR,
  SOMATOTYPE_HWR_MID,
  SOMATOTYPE_ARM_SMM_VOLUME_FACTOR,
  SOMATOTYPE_SMM_FFM_RATIO,
  SOMATOTYPE_VETERAN_HUMERUS_FACTOR,
  buildSomatotypeLabSnapshot,
  calculateEctomorphyFromHwr,
  calculateFatFreeMassKg,
  calculateGrantIndex,
  calculateHeathCarterSomatotype,
  calculateHeightWeightRatio,
  calculateMaxTunedPhysique,
  convertToSomatochartCoordinates,
  estimateSkeletalMuscleMassKg,
  isPhysiqueTier,
  resolveMaxArmCircumferenceCm,
  resolveMaxTotalWeightKg,
  resolveMaxTunedBodyFatPct,
  resolvePhysiqueTier,
} from '../somatotypeLab';

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
    expect(snap.smmGapKg).toBeCloseTo(13.4, 1);

    const arm = resolveMaxArmCircumferenceCm({
      heightCm: boss.heightCm,
      wristCm: boss.wristCm,
      ffmMaxKg: snap.maxTuned.ffmMaxKg,
      currentArmGirthCm: boss.flexedArmGirthCm,
      currentSmmKg: snap.currentSmmKg,
      maxSmmKg: snap.maxSmmKg,
    })!;
    // Volume factor × ~13.4 kg SMM gap on the live-arm floor.
    expect(arm.volumeBonusCm).toBeCloseTo(
      snap.smmGapKg * SOMATOTYPE_ARM_SMM_VOLUME_FACTOR,
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
    expect(snap.smmGapKg).toBeCloseTo(12.2, 1);
    expect(snap.maxTuned.maxTotalWeightKg).toBeCloseTo(91.2, 1);

    const bonus = snap.smmGapKg * SOMATOTYPE_ARM_SMM_VOLUME_FACTOR;
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
    expect(snap.weightGapKg).toBe(
      Math.round((snap.maxTuned.maxTotalWeightKg - 85) * 10) / 10
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
    expect(snap.armGapCm).toBeCloseTo(snap.maxTuned.armGirthMaxCm - 32, 3);
    expect(snap.bodyFatGapPct).toBeCloseTo(20 - 12, 3);
    expect(snap.armGapCm).toBeGreaterThan(0);
    expect(snap.bodyFatGapPct).toBeGreaterThan(0);
    expect(snap.maxTuned.legendaryArmMode).toBe(false);
    // Volume parity: max arm exceeds pure skeletal wrist lock when ΔSMM > 0.
    const skeletalOnly = 17 * 1.6 + (snap.maxTuned.ffmMaxKg / 180) * 15;
    expect(snap.maxTuned.armGirthMaxCm).toBeGreaterThan(skeletalOnly);
    expect(snap.currentSmmKg).toBe(
      estimateSkeletalMuscleMassKg(calculateFatFreeMassKg(85, 20))
    );
    expect(snap.maxSmmKg).toBe(estimateSkeletalMuscleMassKg(snap.maxTuned.ffmMaxKg));
    expect(snap.smmGapKg).toBe(
      Math.round((snap.maxSmmKg - snap.currentSmmKg) * 10) / 10
    );
    expect(snap.smmGapKg).toBeGreaterThan(0);
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
    expect(apex.weightGapKg).toBe(
      Math.round((apex.maxTuned.maxTotalWeightKg - boss.weightKg) * 10) / 10
    );

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
});
