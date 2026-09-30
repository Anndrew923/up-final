import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AssessmentHeroScoreWithNormBadgeProps } from '../components/assessment/AssessmentHeroScoreWithNormBadge';
import type { HallOfFameSpectrumDrawerProps } from '../components/assessment/HallOfFameSpectrumDrawer';
import {
  buildHallSpectrumDecodePrompt,
  type HallOfFameSpectrumAxisId,
} from '../logic/core/hallOfFameSpectrumResolver';
import { useDynoIntelLaunchStore } from '../stores/dynoIntelLaunchStore';
import { useDynoIntelQuota } from './useDynoIntelQuota';

export interface UseHallOfFameSpectrumDrawerInput {
  axisId: HallOfFameSpectrumAxisId;
  scoreDisplay: string | null | undefined;
  decadeKey: string | null | undefined;
  populationClass: string | null | undefined;
}

function resolveSpectrumAxisTitle(axisId: HallOfFameSpectrumAxisId, t: (key: string) => string): string {
  if (axisId === 'armSize') return t('assessment.armSize.kicker');
  if (axisId === 'overall') return t('assessment.sixAxisSnapshot.title');
  return t(`assessment.axis.${axisId}`);
}

/**
 * Assessment-page bridge for NormBadge → Hall spectrum drawer → Dyno decode CTA.
 * WHY: Seven pages share the same open/quota/prefill contract; keep pages presentational.
 */
export function useHallOfFameSpectrumDrawer(input: UseHallOfFameSpectrumDrawerInput): {
  badgeProps: Pick<
    AssessmentHeroScoreWithNormBadgeProps,
    'onBadgeClick' | 'showChevron' | 'badgeAriaLabel'
  >;
  drawerProps: HallOfFameSpectrumDrawerProps;
} {
  const { t, i18n } = useTranslation('common');
  const quota = useDynoIntelQuota();
  const requestLaunch = useDynoIntelLaunchStore((s) => s.requestLaunch);
  const [open, setOpen] = useState(false);

  const scoreDisplay = String(input.scoreDisplay ?? '').trim();
  const decadeKey = String(input.decadeKey ?? '').trim();
  const populationClass = String(input.populationClass ?? '').trim();
  const canOpen = Boolean(scoreDisplay && decadeKey && populationClass);

  const axisTitle = useMemo(
    () => resolveSpectrumAxisTitle(input.axisId, t),
    [input.axisId, t]
  );

  const openDrawer = useCallback(() => {
    if (!canOpen) return;
    setOpen(true);
  }, [canOpen]);

  const closeDrawer = useCallback(() => setOpen(false), []);

  const handleOpenDyno = useCallback(() => {
    // WHY: Drawer already closed itself before invoking onOpenDyno — only hand off the prompt.
    const locale = i18n?.language === 'zh-Hant' ? 'zh-Hant' : 'en';
    const prompt = buildHallSpectrumDecodePrompt({
      axisLabel: axisTitle,
      scoreDisplay,
      populationClass,
      locale,
    });
    // WHY: Yield one macrotask so Hall drawer unmount/scroll-unlock settles before Dyno scrim mounts.
    window.setTimeout(() => {
      requestLaunch(prompt);
    }, 0);
  }, [axisTitle, i18n?.language, populationClass, requestLaunch, scoreDisplay]);

  const badgeProps = useMemo(
    () => ({
      onBadgeClick: canOpen ? openDrawer : undefined,
      showChevron: canOpen,
      badgeAriaLabel: canOpen
        ? t('assessment.hallSpectrum.openBadgeAria', { populationClass })
        : undefined,
    }),
    [canOpen, openDrawer, populationClass, t]
  );

  const drawerProps: HallOfFameSpectrumDrawerProps = {
    open,
    onClose: closeDrawer,
    axisId: input.axisId,
    axisTitle,
    scoreDisplay: scoreDisplay || '—',
    decadeKey: decadeKey || '0',
    populationClass: populationClass || '—',
    dynoRemaining: quota.remaining,
    onOpenDyno: handleOpenDyno,
  };

  return { badgeProps, drawerProps };
}
