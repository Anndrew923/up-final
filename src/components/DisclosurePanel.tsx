import type { FC, KeyboardEvent, ReactNode } from 'react';

export interface DisclosurePanelProps {
  /** Stable prefix; renders `{instanceId}-toggle` and `{instanceId}-panel` for a11y wiring. */
  instanceId: string;
  expanded: boolean;
  onToggle: () => void;
  title: ReactNode;
  toggleExpandLabel: string;
  toggleCollapseLabel: string;
  children: ReactNode;
  /** Tailwind classes for the padded body wrapper around `children`. */
  panelBodyClassName?: string;
}

const defaultPanelBodyClassName = 'space-y-2 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400';

function onDisclosureButtonKeyDown(
  e: KeyboardEvent<HTMLButtonElement>,
  onToggle: () => void
): void {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  onToggle();
}

/**
 * Presentational collapsible used on assessment pages (Cooper info, explosive how-to, etc.).
 * Keeps aria wiring and keyboard behavior consistent.
 */
export const DisclosurePanel: FC<DisclosurePanelProps> = ({
  instanceId,
  expanded,
  onToggle,
  title,
  toggleExpandLabel,
  toggleCollapseLabel,
  children,
  panelBodyClassName = defaultPanelBodyClassName,
}) => {
  const toggleId = `${instanceId}-toggle`;
  const panelId = `${instanceId}-panel`;

  return (
    <div className="rounded-xl border border-zinc-700/70 bg-bg-panel/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50"
        aria-expanded={expanded}
        aria-controls={panelId}
        id={toggleId}
        onClick={onToggle}
        onKeyDown={(e) => onDisclosureButtonKeyDown(e, onToggle)}
      >
        <span className="font-medium text-zinc-200">{title}</span>
        <span className="shrink-0 text-xs font-medium text-accent-primary/90">
          {expanded ? toggleCollapseLabel : toggleExpandLabel}
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={toggleId}
        hidden={!expanded}
        className="border-t border-zinc-700/60"
      >
        <div className={panelBodyClassName}>{children}</div>
      </div>
    </div>
  );
};
