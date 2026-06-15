import { describe, expect, it } from 'vitest';
import type { DynoIntelContextV1 } from '../dynoIntelTypes';
import { resolveDynoIntelLogFocusAxis } from '../resolveDynoIntelLogFocusAxis';

function contextSlice(
  partial: Partial<Pick<DynoIntelContextV1, 'focusAxis' | 'questionFocusAxis'>>
): Pick<DynoIntelContextV1, 'focusAxis' | 'questionFocusAxis'> {
  return {
    focusAxis: partial.focusAxis ?? null,
    questionFocusAxis: partial.questionFocusAxis ?? null,
  };
}

describe('resolveDynoIntelLogFocusAxis', () => {
  it('prefers route focusAxis over question focus', () => {
    expect(
      resolveDynoIntelLogFocusAxis(
        contextSlice({ focusAxis: 'strength', questionFocusAxis: 'cardio' }),
        'single-axis'
      )
    ).toBe('strength');
  });

  it('falls back to questionFocusAxis when focusAxis is null', () => {
    expect(
      resolveDynoIntelLogFocusAxis(
        contextSlice({ focusAxis: null, questionFocusAxis: 'gripStrength' }),
        'cross-axis'
      )
    ).toBe('gripStrength');
  });

  it('uses cross-axis sentinel for cross-axis mode', () => {
    expect(resolveDynoIntelLogFocusAxis(contextSlice({}), 'cross-axis')).toBe('cross-axis');
  });

  it('uses unknown for non cross-axis without axis hints', () => {
    expect(resolveDynoIntelLogFocusAxis(contextSlice({}), 'weight-simulation')).toBe('unknown');
  });
});
