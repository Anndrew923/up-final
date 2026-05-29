import type { FC, ReactNode } from 'react';
import { CollapsibleActionRow } from './CollapsibleActionRow';
import { onCollapsibleToggleKeyDown } from '../lib/collapsibleKeyboard';

export interface DisclosurePanelProps {
  /** Stable prefix; renders `{instanceId}-toggle` and `{instanceId}-panel` for a11y wiring. */
  instanceId: string;
  expanded: boolean;
  onToggle: () => void;
  title: ReactNode;
  toggleExpandLabel: string;
  toggleCollapseLabel: string;
  /** Optional one-line hint shown only when collapsed (e.g. what fields live inside). */
  collapsedHint?: string;
  children: ReactNode;
  /** Tailwind classes for the padded body wrapper around `children`. */
  panelBodyClassName?: string;
}

const defaultPanelBodyClassName = 'space-y-2 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400';

/**
 * Presentational collapsible used on assessment pages and home profile advanced fields.
 */
export const DisclosurePanel: FC<DisclosurePanelProps> = ({
  instanceId,
  expanded,
  onToggle,
  title,
  toggleExpandLabel,
  toggleCollapseLabel,
  collapsedHint,
  children,
  panelBodyClassName = defaultPanelBodyClassName,
}) => {
  const toggleId = `${instanceId}-toggle`;
  const panelId = `${instanceId}-panel`;
  const actionLabel = expanded ? toggleCollapseLabel : toggleExpandLabel;

  return (
    <div className="rounded-xl border border-zinc-700/70 bg-bg-panel/40">
      <button
        type="button"
        className="flex w-full flex-col gap-2 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={collapsedHint && !expanded ? `${actionLabel}. ${collapsedHint}` : actionLabel}
        id={toggleId}
        onClick={onToggle}
        onKeyDown={(e) => onCollapsibleToggleKeyDown(e, onToggle)}
      >
        <span className="font-medium text-zinc-200">{title}</span>
        {!expanded && collapsedHint ? (
          <p className="text-xs leading-relaxed text-zinc-500">{collapsedHint}</p>
        ) : null}
        <CollapsibleActionRow
          expanded={expanded}
          expandLabel={toggleExpandLabel}
          collapseLabel={toggleCollapseLabel}
          showDivider={!expanded}
          dividerClassName="border-zinc-700/60"
        />
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
