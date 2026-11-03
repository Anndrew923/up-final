import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveSixAxisDataGridLabelParts } from '../../i18n/resolveSixAxisDataGridLabel';
import type { SixAxisMetric } from '../../types/scoring';

export interface IdentityLiveSpecRow {
  metric: SixAxisMetric;
  bandTitle: string;
}

export interface IdentityLiveSpecListProps {
  kicker: string;
  rows: IdentityLiveSpecRow[];
  /** Distinct id when multiple instances can mount. */
  kickerId?: string;
}

/**
 * Six-axis bento readout for the diagnostics report plaque.
 * WHY: Fixed 2×3 grid replaces the old vertical list so mobile report stays one-screen scannable.
 * Row data is pre-resolved via `buildIdentityLiveSpecRows`.
 */
const IdentityLiveSpecList: FC<IdentityLiveSpecListProps> = ({
  kicker,
  rows,
  kickerId = 'identity-live-spec-kicker',
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="mt-4 text-left" data-testid="identity-live-spec-bento">
      <p
        id={kickerId}
        className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-accent-info/90"
      >
        {kicker}
      </p>
      <ul aria-labelledby={kickerId} className="grid grid-cols-2 gap-2">
        {rows.map((row) => {
          const parts = resolveSixAxisDataGridLabelParts(t, row.metric);
          return (
            <li
              key={row.metric}
              className="rounded-lg border border-zinc-800/80 bg-zinc-900/70 p-3"
              data-testid={`identity-live-spec-cell-${row.metric}`}
            >
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-400/90">
                {parts.code} // {parts.mechShort}
              </p>
              <p className="mt-1.5 text-left text-[12px] font-semibold leading-snug tracking-tight text-zinc-50">
                {row.bandTitle}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default IdentityLiveSpecList;
