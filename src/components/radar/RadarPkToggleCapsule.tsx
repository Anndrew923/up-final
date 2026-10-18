import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface RadarPkToggleCapsuleProps {
  active: boolean;
  /** Diagnostic extract in progress — pulse label + block re-entry. */
  scanning?: boolean;
  enableLabel: string;
  disableLabel: string;
  scanningLabel: string;
  onToggle: () => void;
}

type CapsuleIconKind = 'clash' | 'scan' | 'end';

const ICON_BOX = 'size-4 shrink-0';

function CapsuleIcon({ kind }: { kind: CapsuleIconKind }): ReactNode {
  if (kind === 'end') {
    return (
      <svg
        viewBox="0 0 16 16"
        className={ICON_BOX}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    );
  }

  if (kind === 'scan') {
    return (
      <svg viewBox="0 0 16 16" className={ICON_BOX} fill="currentColor" aria-hidden>
        <path d="M9.2 1.2 3.5 9.1h3.3L6.4 14.8l6.2-8.6H9.4L9.2 1.2Z" />
      </svg>
    );
  }

  // idle — crossed micro-arrows (clash intent without emoji)
  return (
    <svg
      viewBox="0 0 16 16"
      className={ICON_BOX}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.5 5.5h6.2l-1.6-1.6" />
      <path d="M12.5 10.5H6.3l1.6 1.6" />
      <path d="M4.2 11.5 11.8 4.2" />
    </svg>
  );
}

/**
 * Hero-grade opt-in PK control for ladder / club radar sheets.
 * WHY: Shared capsule keeps club + global preview mental model identical.
 * Centering is owned by the parent flex row; icons are presentational SVG.
 */
const RadarPkToggleCapsule: FC<RadarPkToggleCapsuleProps> = ({
  active,
  scanning = false,
  enableLabel,
  disableLabel,
  scanningLabel,
  onToggle,
}) => {
  const label = scanning ? scanningLabel : active ? disableLabel : enableLabel;
  const iconKind: CapsuleIconKind = scanning ? 'scan' : active ? 'end' : 'clash';

  return (
    <button
      type="button"
      data-testid="radar-pk-toggle"
      data-pk-active={active && !scanning ? 'true' : 'false'}
      data-pk-scanning={scanning ? 'true' : 'false'}
      onClick={onToggle}
      disabled={scanning}
      aria-pressed={active && !scanning}
      aria-busy={scanning || undefined}
      aria-label={label}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] px-6',
        'text-xs font-semibold tracking-wider transition-[color,background-color,border-color,box-shadow]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50',
        'disabled:cursor-wait disabled:opacity-90',
        scanning
          ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.28)] motion-safe:animate-pulse motion-reduce:animate-none'
          : active
            ? 'border-amber-500/70 bg-zinc-900/90 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.28)]'
            : 'border-cyan-500/60 bg-zinc-900/95 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:border-cyan-400/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.32)]'
      )}
    >
      <CapsuleIcon kind={iconKind} />
      <span>{label}</span>
    </button>
  );
};

export default RadarPkToggleCapsule;
