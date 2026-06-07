import type { FC } from 'react';
import type { SixAxisMetric } from '../../types/scoring';
import { SixAxisDataGridLabel } from '../radar/SixAxisDataGridLabel';

export interface IdentityLiveSpecRow {
  metric: SixAxisMetric;
  label: string;
  bandTitle: string;
}

export type IdentityLiveSpecVariant = 'card' | 'overlay';

export interface IdentityLiveSpecListProps {
  kicker: string;
  rows: IdentityLiveSpecRow[];
  variant?: IdentityLiveSpecVariant;
  /** Distinct id when multiple instances can mount (e.g. overlay vs card). */
  kickerId?: string;
}

const VARIANT_STYLES: Record<
  IdentityLiveSpecVariant,
  { root: string; kickerWrap: string; list: string; rowDot: string }
> = {
  card: {
    root: 'mt-4 border-t border-zinc-800/80 pt-3',
    kickerWrap: 'mb-2',
    list: 'flex flex-col gap-1.5',
    rowDot: 'bg-accent-info/70',
  },
  overlay: {
    root: 'mt-5 border-t border-zinc-800/80 pt-4 text-left',
    kickerWrap: 'mb-3',
    list: 'flex flex-col gap-2 rounded-lg border border-zinc-900 bg-zinc-900/30 p-3',
    rowDot: 'bg-zinc-700',
  },
};

/**
 * Presentational six-axis band readout — identity card or resonance reveal overlay.
 * Row data is pre-resolved via `buildIdentityLiveSpecRows`.
 */
const IdentityLiveSpecList: FC<IdentityLiveSpecListProps> = ({
  kicker,
  rows,
  variant = 'card',
  kickerId = 'identity-live-spec-kicker',
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={styles.root}>
      <div className={`flex items-center gap-1.5 ${styles.kickerWrap}`}>
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-info opacity-75 duration-1000" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-info/90" />
        </span>
        <p
          id={kickerId}
          className="text-[10px] font-mono font-medium uppercase tracking-[0.18em] text-accent-info/90"
        >
          {kicker}
        </p>
      </div>
      <ul aria-labelledby={kickerId} className={styles.list}>
        {rows.map((row) => (
          <li key={row.metric} className="flex items-start justify-between gap-3 text-xs">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-zinc-400">
              <span className={`inline-block h-1 w-1 shrink-0 rounded-full ${styles.rowDot}`} />
              <SixAxisDataGridLabel metric={row.metric} className="text-left" />
            </span>
            <span className="shrink-0 text-right font-medium text-zinc-200">{row.bandTitle}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IdentityLiveSpecList;
