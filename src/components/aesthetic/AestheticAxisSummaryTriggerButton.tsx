/**
 * Contextual "generate axis-summary report" CTA under composite score blocks.
 */
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { AestheticAxisSummaryAxis } from '../../logic/aesthetic/axisSummaryReport';
import type { MuscleAxisMeasuredMetrics } from '../../logic/aesthetic/muscleAxisMeasured';
import { cn } from '../../lib/cn';
import { useAestheticReportUiStore } from '../../stores/aestheticReportUiStore';
import {
  AESTHETIC_SINGLE_LEAF_CTA_CLASS,
  AestheticSingleLeafCtaIcon,
} from './aestheticSingleLeafCtaChrome';

export interface AestheticAxisSummaryTriggerButtonProps {
  axis: AestheticAxisSummaryAxis;
  heroScore: number;
  coveredCount: number;
  /** Muscle-only: lock dual raw metrics into the plaque at open. */
  muscleMeasured?: MuscleAxisMeasuredMetrics;
  disabled?: boolean;
  onBeforeOpen?: () => void | boolean;
  className?: string;
}

const AestheticAxisSummaryTriggerButton: FC<AestheticAxisSummaryTriggerButtonProps> = ({
  axis,
  heroScore,
  coveredCount,
  muscleMeasured,
  disabled,
  onBeforeOpen,
  className,
}) => {
  const { t } = useTranslation('common');
  const openWithAxisSummary = useAestheticReportUiStore((s) => s.openWithAxisSummary);

  return (
    <button
      type="button"
      data-testid={`aesthetic-axis-summary-trigger-${axis}`}
      className={cn(AESTHETIC_SINGLE_LEAF_CTA_CLASS, className)}
      disabled={disabled}
      onClick={() => {
        const ok = onBeforeOpen?.();
        if (ok === false) return;
        openWithAxisSummary(axis, {
          heroScore,
          coveredCount,
          ...(muscleMeasured ? { muscleMeasured } : {}),
        });
      }}
    >
      <AestheticSingleLeafCtaIcon />
      <span>{t('aesthetic.singleLeaf.generateReport')}</span>
    </button>
  );
};

export default AestheticAxisSummaryTriggerButton;
