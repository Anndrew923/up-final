import { describe, expect, it } from 'vitest';
import { resolveDynoIntelPriorTurnFromLog } from '../resolveDynoIntelPriorTurnFromLog';

describe('resolveDynoIntelPriorTurnFromLog', () => {
  it('returns trimmed priorTurn for a valid log entry', () => {
    expect(
      resolveDynoIntelPriorTurnFromLog({
        focusAxis: ' explosivePower ',
        userQuestion: ' 我的爆發力如何？ ',
      })
    ).toEqual({
      focusAxis: 'explosivePower',
      userQuestion: '我的爆發力如何？',
    });
  });

  it('returns null when focusAxis or userQuestion is missing', () => {
    expect(resolveDynoIntelPriorTurnFromLog(null)).toBeNull();
    expect(
      resolveDynoIntelPriorTurnFromLog({ focusAxis: '', userQuestion: 'q' })
    ).toBeNull();
    expect(
      resolveDynoIntelPriorTurnFromLog({ focusAxis: 'cardio', userQuestion: '   ' })
    ).toBeNull();
  });
});
