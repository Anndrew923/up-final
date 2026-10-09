import { useCallback, useMemo, useRef, useState } from 'react';
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
  /**
   * Runs before Dyno launch (e.g. close breakthrough modal so z-220 chat is not trapped under z-240).
   */
  onBeforeOpenDyno?: () => void;
}

/**
 * Spec-card header CTA — null when Hall entry must stay hidden (incomplete score / 5km).
 * Structurally matches AssessmentScoreMeaningPanel `hallEntry` (no component import from hook).
 */
export interface HallSpectrumHeaderActionProps {
  onClick: () => void;
  label: string;
  ariaLabel: string;
}

function resolveSpectrumAxisTitle(axisId: HallOfFameSpectrumAxisId, t: (key: string) => string): string {
  if (axisId === 'armSize') return t('assessment.armSize.kicker');
  if (axisId === 'overall') return t('assessment.sixAxisSnapshot.title');
  return t(`assessment.axis.${axisId}`);
}

/**
 * Assessment-page bridge for NormBadge + Spec-card CTA → Hall spectrum drawer → Dyno decode.
 * WHY: Seven pages share open/quota/prefill; dual entry (B primary / A secondary) stays in one hook.
 */
export function useHallOfFameSpectrumDrawer(input: UseHallOfFameSpectrumDrawerInput): {
  badgeProps: Pick<
    AssessmentHeroScoreWithNormBadgeProps,
    'onBadgeClick' | 'showChevron' | 'badgeAriaLabel' | 'badgeSize' | 'chevronTone'
  >;
  headerActionProps: HallSpectrumHeaderActionProps | null;
  drawerProps: HallOfFameSpectrumDrawerProps;
  canOpen: boolean;
  openDrawer: () => void;
} {
  const { t, i18n } = useTranslation('common');
  const quota = useDynoIntelQuota();
  const requestLaunch = useDynoIntelLaunchStore((s) => s.requestLaunch);
  const [open, setOpen] = useState(false);
  const onBeforeOpenDynoRef = useRef(input.onBeforeOpenDyno);
  onBeforeOpenDynoRef.current = input.onBeforeOpenDyno;

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
    // Pages may close breakthrough first so Dyno (z-220) is not trapped under modal (z-240).
    onBeforeOpenDynoRef.current?.();
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
      // WHY: Assessment Hall entry needs md touch target + forward chevron (not modal expand ∨).
      badgeSize: 'md' as const,
      chevronTone: 'forward' as const,
      badgeAriaLabel: canOpen
        ? t('assessment.hallSpectrum.openBadgeAria', { populationClass })
        : undefined,
    }),
    [canOpen, openDrawer, populationClass, t]
  );

  const headerActionProps = useMemo((): HallSpectrumHeaderActionProps | null => {
    if (!canOpen) return null;
    return {
      onClick: openDrawer,
      label: t('assessment.hallSpectrum.viewEntry'),
      ariaLabel: t('assessment.hallSpectrum.viewEntryAria'),
    };
  }, [canOpen, openDrawer, t]);

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

  return { badgeProps, headerActionProps, drawerProps, canOpen, openDrawer };
}
