import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  listAvailableSingleLeaves,
  resolveSingleLeafReport,
  resolveSmartDefaultReport,
  SINGLE_LEAF_IDS,
  type SingleLeafDraftBundle,
} from '../singleLeafReport';
import { buildSingleLeafContentHash } from '../singleLeafContentHash';
import zhAesthetic from '../../../i18n/locales/zh-Hant/common/aesthetic.json';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function emptyBundle(overrides: Partial<SingleLeafDraftBundle> = {}): SingleLeafDraftBundle {
  return {
    profile: baseProfile,
    strength: null,
    power: null,
    cardio: null,
    muscle: null,
    grip: null,
    armSize: null,
    ffmi: null,
    scores: {},
    ...overrides,
  };
}

describe('singleLeafReport undiluted hero scores', () => {
  it('returns unavailable without a complete profile', () => {
    const drafts = emptyBundle({ profile: null });
    expect(resolveSingleLeafReport('grip', drafts)).toEqual({ status: 'unavailable' });
  });

  it('returns unavailable for empty / zero / NaN inputs', () => {
    expect(
      resolveSingleLeafReport(
        'grip',
        emptyBundle({ grip: { peakKg: 0 } })
      )
    ).toEqual({ status: 'unavailable' });
    expect(
      resolveSingleLeafReport(
        'grip',
        emptyBundle({ grip: { peakKg: Number.NaN } })
      )
    ).toEqual({ status: 'unavailable' });
    expect(
      resolveSingleLeafReport(
        'cardio.cooper',
        emptyBundle({ cardio: { cardio: { distance: undefined } } })
      )
    ).toEqual({ status: 'unavailable' });
  });

  it('does not dilute a single strength lift by /5', () => {
    const drafts = emptyBundle({
      strength: {
        lifts: {
          benchPress: { weightKg: 140, reps: 3 },
        },
      },
    });
    const resolved = resolveSingleLeafReport('strength.benchPress', drafts);
    expect(resolved.status).toBe('ok');
    if (resolved.status !== 'ok') return;
    // WHY: Axis average would be hero/5; leaf must keep the full lift score.
    expect(resolved.heroScore).toBeGreaterThan(20);
    expect(resolved.rawReading).toMatch(/KG × 3/);
  });

  it('does not dilute explosive vertical jump by /2', () => {
    const drafts = emptyBundle({
      power: {
        explosivePower: {
          verticalJumpCm: 70,
        },
      },
    });
    const leaf = resolveSingleLeafReport('explosive.verticalJump', drafts);
    expect(leaf.status).toBe('ok');
    if (leaf.status !== 'ok') return;
    expect(leaf.heroScore).toBeGreaterThan(40);
    // Composite axis would halve a lone jump; leaf keeps the branch raw.
    expect(leaf.heroScore).toBeGreaterThan(leaf.heroScore / 2 + 1);
  });

  it('lists only filled leaves sorted by hero score', () => {
    const drafts = emptyBundle({
      grip: { peakKg: 55 },
      strength: {
        lifts: {
          benchPress: { weightKg: 60, reps: 5 },
          squat: { weightKg: 160, reps: 3 },
        },
      },
    });
    const list = listAvailableSingleLeaves(drafts);
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.every((x) => SINGLE_LEAF_IDS.includes(x.leaf))).toBe(true);
    for (let i = 1; i < list.length; i += 1) {
      expect(list[i - 1].heroScore).toBeGreaterThanOrEqual(list[i].heroScore);
    }
  });

  it('smart-defaults to full when ≥3 axes are filled', () => {
    const drafts = emptyBundle({
      scores: {
        strength: 70,
        explosivePower: 65,
        cardio: 60,
        muscleMass: 0,
        bodyFat: 0,
        gripStrength: 0,
      },
      grip: { peakKg: 70 },
    });
    expect(resolveSmartDefaultReport(drafts)).toEqual({ reportType: 'full' });
  });

  it('smart-defaults to highest leaf when only 1–2 axes are filled', () => {
    const drafts = emptyBundle({
      scores: {
        gripStrength: 80,
        strength: 0,
        explosivePower: 0,
        cardio: 0,
        muscleMass: 0,
        bodyFat: 0,
      },
      grip: { peakKg: 70 },
    });
    const smart = resolveSmartDefaultReport(drafts);
    expect(smart).toEqual({ reportType: 'single-leaf', leaf: 'grip' });
  });

});

describe('single-leaf content hash + composer size guard', () => {
  it('changes contentHash when leaf or hero score changes', () => {
    const a = buildSingleLeafContentHash({
      leaf: 'grip',
      rawReading: '70.5 KG',
      heroScore: 120,
      profileKey: 'male,28,178,80',
      locale: 'zh-Hant',
    });
    const b = buildSingleLeafContentHash({
      leaf: 'grip',
      rawReading: '70.5 KG',
      heroScore: 121,
      profileKey: 'male,28,178,80',
      locale: 'zh-Hant',
    });
    const c = buildSingleLeafContentHash({
      leaf: 'strength.benchPress',
      rawReading: '140 KG × 3',
      heroScore: 120,
      profileKey: 'male,28,178,80',
      locale: 'zh-Hant',
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('keeps telemetryCardComposer.ts at ≤490 lines', () => {
    const path = resolve(process.cwd(), 'src/lib/telemetryCardComposer.ts');
    // Match `wc -l` (newline count) — trailing EOF newline must not inflate the guard.
    const lines = readFileSync(path, 'utf8').replace(/\n$/, '').split('\n').length;
    expect(lines).toBeLessThanOrEqual(490);
  });

  it('rejects vehicle jargon in singleLeaf label copy', () => {
    const banned = ['馬力', '進氣', '扭矩', '底盤', '增壓', '排量', '車體'];
    const blob = JSON.stringify(zhAesthetic.aesthetic.singleLeaf);
    for (const word of banned) {
      expect(blob.includes(word)).toBe(false);
    }
  });
});
