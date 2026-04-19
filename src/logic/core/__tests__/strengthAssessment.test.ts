import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  mergeScoreMapWithResolvedStrength,
  persistedFromStrengthForm,
  resolveStrengthScoreFromInputs,
  strengthFormFromPersisted,
  tryComputeSingleLiftStrength,
  tryComputeStrengthAssessmentScore,
} from '../strengthAssessment';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function emptyForm() {
  return strengthFormFromPersisted(null);
}

describe('tryComputeSingleLiftStrength', () => {
  it('returns empty-row when both fields blank', () => {
    const form = emptyForm();
    const r = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('empty-row');
  });

  it('computes one lift independently', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const r = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.oneRepMax).toBeGreaterThan(0);
      expect(r.finalScore).toBeGreaterThan(0);
    }
  });

  it('matches combined batch branch for the same row', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const single = tryComputeSingleLiftStrength({
      lift: 'benchPress',
      form,
      profile: baseProfile,
      profileReady: true,
    });
    const batch = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(single.ok && batch.ok).toBe(true);
    if (single.ok && batch.ok) {
      const benchBranch = batch.breakdown.branches.find((b) => b.lift === 'benchPress');
      expect(benchBranch?.finalScore).toBe(single.finalScore);
      expect(benchBranch?.oneRepMax).toBe(single.oneRepMax);
    }
  });
});

describe('tryComputeStrengthAssessmentScore', () => {
  it('rejects when profile incomplete', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: null,
      profileReady: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('missing-profile');
  });

  it('rejects when no lifts completed', () => {
    const r = tryComputeStrengthAssessmentScore({
      form: emptyForm(),
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('no-inputs');
  });

  it('rejects partial row', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('pair-incomplete');
  });

  it('computes mean for a single lift', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.breakdown.branches).toHaveLength(1);
      expect(r.breakdown.branches[0].lift).toBe('benchPress');
      expect(r.score).toBeGreaterThan(0);
      expect(r.score).toBeLessThanOrEqual(200);
      expect(r.persisted.lifts?.benchPress).toEqual({ weightKg: 100, reps: 5 });
      expect(r.persisted.bodyWeightKgSnapshot).toBe(80);
    }
  });

  it('averages two lifts', () => {
    const form = emptyForm();
    form.benchPress = { weight: '100', reps: '5' };
    form.squat = { weight: '120', reps: '5' };
    const r = tryComputeStrengthAssessmentScore({
      form,
      profile: baseProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.breakdown.branches).toHaveLength(2);
      const expectedMean =
        (r.breakdown.branches[0].finalScore + r.breakdown.branches[1].finalScore) / 2;
      expect(r.breakdown.averageRaw).toBeCloseTo(expectedMean, 5);
    }
  });
});

describe('resolveStrengthScoreFromInputs', () => {
  it('returns null when persisted has only snapshot and no lifts', () => {
    expect(resolveStrengthScoreFromInputs(baseProfile, { bodyWeightKgSnapshot: 80 })).toBeNull();
  });

  it('forgiving mode skips invalid lift cells and still scores valid ones', () => {
    const score = resolveStrengthScoreFromInputs(baseProfile, {
      lifts: {
        benchPress: { weightKg: 100, reps: 5 },
        squat: { weightKg: Number.NaN, reps: 5 },
      },
    });
    expect(score).not.toBeNull();
    const benchOnly = resolveStrengthScoreFromInputs(baseProfile, {
      lifts: { benchPress: { weightKg: 100, reps: 5 } },
    });
    expect(score).toBe(benchOnly);
  });
});

describe('mergeScoreMapWithResolvedStrength', () => {
  it('leaves scores when no strength inputs', () => {
    const merged = mergeScoreMapWithResolvedStrength({ strength: 55 }, baseProfile, null);
    expect(merged.strength).toBe(55);
  });

  it('overwrites strength when inputs resolve', () => {
    const persisted = persistedFromStrengthForm(
      {
        ...emptyForm(),
        benchPress: { weight: '100', reps: '5' },
        squat: { weight: '', reps: '' },
        deadlift: { weight: '', reps: '' },
        latPulldown: { weight: '', reps: '' },
        shoulderPress: { weight: '', reps: '' },
      },
      baseProfile.weightKg
    );
    const merged = mergeScoreMapWithResolvedStrength({ strength: 12 }, baseProfile, persisted);
    const direct = resolveStrengthScoreFromInputs(baseProfile, persisted);
    expect(direct).not.toBeNull();
    expect(merged.strength).toBe(direct);
    expect(merged.strength).not.toBe(12);
  });
});

describe('strengthFormFromPersisted', () => {
  it('round-trips numeric fields as strings', () => {
    const persisted = persistedFromStrengthForm(
      {
        ...emptyForm(),
        deadlift: { weight: '180', reps: '3' },
        benchPress: { weight: '', reps: '' },
        squat: { weight: '', reps: '' },
        latPulldown: { weight: '', reps: '' },
        shoulderPress: { weight: '', reps: '' },
      },
      80
    );
    const form = strengthFormFromPersisted(persisted);
    expect(form.deadlift).toEqual({ weight: '180', reps: '3' });
  });
});
