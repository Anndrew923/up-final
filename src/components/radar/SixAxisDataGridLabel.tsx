import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSixAxisDataGridTitle,
  formatSixAxisDataGridVisibleLabel,
  resolveSixAxisDataGridLabelParts,
} from '../../i18n/resolveSixAxisDataGridLabel';
import { cn } from '../../lib/cn';
import type { SixAxisMetric } from '../../types/scoring';

export interface SixAxisDataGridLabelProps {
  metric: SixAxisMetric;
  className?: string;
}

/** Adaptive chart · fitness label — collapses when tracks match; CODE lives in title only. */
export const SixAxisDataGridLabel: FC<SixAxisDataGridLabelProps> = ({ metric, className }) => {
  const { t } = useTranslation('common');
  const parts = resolveSixAxisDataGridLabelParts(t, metric);
  const visibleLabel = formatSixAxisDataGridVisibleLabel(parts);

  return (
    <span
      className={cn(
        'block truncate text-[10px] font-medium tracking-tight text-zinc-400',
        className
      )}
      title={formatSixAxisDataGridTitle(parts)}
    >
      {visibleLabel}
    </span>
  );
};
