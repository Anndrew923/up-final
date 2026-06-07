import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveSixAxisDataGridLabelParts } from '../../i18n/resolveSixAxisDataGridLabel';
import { cn } from '../../lib/cn';
import type { SixAxisMetric } from '../../types/scoring';

export interface SixAxisDataGridLabelProps {
  metric: SixAxisMetric;
  className?: string;
}

/** Single-line chart · fitness // CODE bridge for core-six score grids. */
export const SixAxisDataGridLabel: FC<SixAxisDataGridLabelProps> = ({ metric, className }) => {
  const { t } = useTranslation('common');
  const { chart, inputShort, code } = resolveSixAxisDataGridLabelParts(t, metric);

  return (
    <span
      className={cn(
        'block truncate text-[10px] font-medium tracking-tight text-zinc-400',
        className
      )}
      title={`${chart} · ${inputShort} // ${code}`}
    >
      {chart}
      <span className="mx-1 text-zinc-600">·</span>
      <span className="text-zinc-500">{inputShort}</span>
      <span className="ml-1.5 text-[9px] font-mono uppercase text-zinc-600">// {code}</span>
    </span>
  );
};
