import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveConsoleDataGridPrimary } from '../../i18n/resolveConsoleAxisViewLabels';
import {
  formatSixAxisDataGridMechAnnotation,
  formatSixAxisDataGridVisibleLabel,
  resolveSixAxisDataGridLabelParts,
} from '../../i18n/resolveSixAxisDataGridLabel';
import type { ConsoleAxisViewMode } from '../../logic/core/consoleAxisViewMode';
import { cn } from '../../lib/cn';
import type { SixAxisMetric } from '../../types/scoring';

export interface SixAxisDataGridLabelProps {
  metric: SixAxisMetric;
  /**
   * Console dual-mode (WHY): When set, renders a single primary line for fitness/telemetry.
   * Omitted on ladder/identity so those surfaces keep the dual-track annotation.
   */
  viewMode?: ConsoleAxisViewMode;
  className?: string;
}

/**
 * Six-axis HUD label (WHY): Console can flip fitness ↔ telemetry single-line copy;
 * other surfaces keep fitness primary + recessed `// CODE noun` without a mode switch.
 */
export const SixAxisDataGridLabel: FC<SixAxisDataGridLabelProps> = ({
  metric,
  viewMode,
  className,
}) => {
  const { t } = useTranslation('common');

  if (viewMode) {
    const primary = resolveConsoleDataGridPrimary(t, metric, viewMode);
    return (
      <span
        className={cn('flex min-w-0 flex-col items-start overflow-hidden', className)}
        title={primary}
      >
        <span
          className={cn(
            'min-w-0 truncate tracking-tight text-zinc-100',
            viewMode === 'telemetry'
              ? 'font-mono text-[10px] font-semibold'
              : 'text-[11px] font-semibold'
          )}
        >
          {primary}
        </span>
      </span>
    );
  }

  const parts = resolveSixAxisDataGridLabelParts(t, metric);
  const mechAnnotation = formatSixAxisDataGridMechAnnotation(parts);

  return (
    <span
      className={cn('flex min-w-0 flex-col items-start gap-0.5 overflow-hidden', className)}
      title={formatSixAxisDataGridVisibleLabel(parts)}
    >
      <span className="min-w-0 truncate text-[11px] font-semibold tracking-tight text-zinc-100">
        {parts.gridPrimary}
      </span>
      <span className="min-w-0 truncate font-mono text-[9px] font-normal tracking-wide text-zinc-500">
        {mechAnnotation}
      </span>
    </span>
  );
};
