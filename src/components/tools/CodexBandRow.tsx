import type { FC } from 'react';

export interface CodexBandRowProps {
  bandId: string;
  title: string;
  summary: string;
  rangeDisplay: string;
  isActive: boolean;
  tierRangeLabel: string;
  activeSetupLabel: string;
}

const CodexBandRow: FC<CodexBandRowProps> = ({
  bandId,
  title,
  summary,
  rangeDisplay,
  isActive,
  tierRangeLabel,
  activeSetupLabel,
}) => {
  const hasSummary = summary.trim().length > 0;

  return (
    <article
      aria-current={isActive ? 'true' : undefined}
      className={`codex-row-card space-y-2.5 rounded-lg border p-4 transition-colors duration-200 ${
        isActive
          ? 'border-orange-500 bg-zinc-900 shadow-[0_0_15px_rgba(239,68,68,0.1)] ring-1 ring-orange-500/20'
          : 'border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40'
      }`}
    >
      {isActive ? (
        <span className="inline-flex w-fit rounded bg-orange-500 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black">
          {activeSetupLabel}
        </span>
      ) : null}

      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold leading-none ${
            isActive
              ? 'bg-orange-500 text-black'
              : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
          }`}
        >
          {bandId}
        </span>
        <h4
          className={`min-w-0 flex-1 break-words font-bold leading-snug tracking-wide ${
            isActive ? 'text-sm text-orange-400' : 'text-xs text-zinc-300'
          }`}
        >
          {title}
        </h4>
      </div>

      <p className="font-mono text-[10px] leading-snug text-zinc-500">
        <span className="text-zinc-600">{tierRangeLabel}:</span>{' '}
        <span className="text-zinc-400">{rangeDisplay}</span>
      </p>

      {hasSummary ? (
        <p className="font-sans text-xs leading-relaxed text-zinc-400">{summary}</p>
      ) : null}
    </article>
  );
};

export default CodexBandRow;
