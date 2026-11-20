/**
 * Compose + share evolution dual-radar PNG from a LogEvolutionReport.
 *
 * WHY: Keeps Capacitor / Web Share and canvas encode out of presentational
 * History components while mapping i18n copy into the isolated composer.
 */
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LogEvolutionReport } from '../logic/core/logEvolutionReport';
import { composeEvolutionCard } from '../lib/evolutionCardComposer';
import {
  shareEvolutionCardPng,
  type EvolutionShareResult,
} from '../services/evolutionCardShareService';
import { buildEvolutionCardComposeInput } from './buildEvolutionCardComposeInput';

export function useLogEvolutionShare() {
  const { t } = useTranslation('common');
  const [sharing, setSharing] = useState(false);
  // WHY: State alone is stale inside an in-flight callback; ref blocks double-tap races.
  const sharingRef = useRef(false);

  const shareEvolution = useCallback(
    async (report: LogEvolutionReport): Promise<EvolutionShareResult> => {
      if (sharingRef.current) return { ok: false, reason: 'unavailable' };
      if (!report.current) return { ok: false, reason: 'unavailable' };

      sharingRef.current = true;
      setSharing(true);
      try {
        const input = buildEvolutionCardComposeInput(report, t);
        const blob = await composeEvolutionCard(input);
        return await shareEvolutionCardPng({
          blob,
          title: t('history.evolution.shareTitle', { ns: 'common' }),
        });
      } catch {
        return { ok: false, reason: 'share-failed' };
      } finally {
        sharingRef.current = false;
        setSharing(false);
      }
    },
    [t]
  );

  return { sharing, shareEvolution };
}
