import type { TFunction } from 'i18next';
import {
  resolveGenesisSeatCopySpec,
  type GenesisSeatPublicSummary,
} from '../logic/core/genesisSeatSummary';

/**
 * Single i18n mapping for genesis FOMO copy (common/ladder keys).
 * WHY: Ladder bar, modal, and Join Arena must stay text-aligned without duplicated switches.
 */
export function formatGenesisSeatSummaryCopy(
  t: TFunction,
  summary: GenesisSeatPublicSummary
): string {
  const spec = resolveGenesisSeatCopySpec(summary);
  if (spec.stage === 'growth') {
    return t('ladder.genesisEarlyBird.stageGrowth', { ns: 'common', percent: spec.percent });
  }
  if (spec.stage === 'closing') {
    return t('ladder.genesisEarlyBird.stageClosing', {
      ns: 'common',
      remaining: spec.remaining,
    });
  }
  if (spec.stage === 'ended') {
    return t('ladder.genesisEarlyBird.stageEnded', { ns: 'common' });
  }
  return t('ladder.genesisEarlyBird.stageEarly', { ns: 'common', count: spec.count });
}
