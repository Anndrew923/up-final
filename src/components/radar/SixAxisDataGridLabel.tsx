import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSixAxisDataGridTitle,
  resolveSixAxisDataGridLabelParts,
} from '../../i18n/resolveSixAxisDataGridLabel';
import { cn } from '../../lib/cn';
import type { SixAxisMetric } from '../../types/scoring';

export interface SixAxisDataGridLabelProps {
  metric: SixAxisMetric;
  className?: string;
}

/** Rigid dual-track label — chart (highlight) · fitness (recessed); CODE lives in title only. */
export const SixAxisDataGridLabel: FC<SixAxisDataGridLabelProps> = ({ metric, className }) => {
  const { t } = useTranslation('common');
  const parts = resolveSixAxisDataGridLabelParts(t, metric);

  return (
    <span
      className={cn(
        'flex min-w-0 items-baseline overflow-hidden truncate whitespace-nowrap',
        className
      )}
      title={formatSixAxisDataGridTitle(parts)}
    >
      <span className="shrink-0 text-[11px] font-semibold tracking-tight text-zinc-200">
        {parts.chart}
      </span>
      <span aria-hidden className="mx-1 shrink-0 text-zinc-600">
        ·
      </span>
      <span className="min-w-0 truncate text-[9.5px] font-normal tracking-wide text-zinc-500">
        {parts.inputShort}
      </span>
    </span>
  );
};
