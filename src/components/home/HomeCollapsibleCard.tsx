import type { FC, ReactNode } from 'react';
import { CollapsibleActionRow } from '../CollapsibleActionRow';
import { onCollapsibleToggleKeyDown } from '../../lib/collapsibleKeyboard';

export interface HomeCollapsibleCardProps {
  instanceId: string;
  expanded: boolean;
  onToggle: () => void;
  canCollapse?: boolean;
  kicker: string;
  title: string;
  /** Status line under title (complete / incomplete hints). Always visible in header. */
  statusSlot?: ReactNode;
  /** One-line preview when collapsed (e.g. body metrics or ladder name). */
  summarySlot?: ReactNode;
  toggleExpandLabel: string;
  toggleCollapseLabel: string;
  children: ReactNode;
}

/**
 * Home `ui-card` sections with a full-width header toggle (body baseline, ladder identity).
 */
export const HomeCollapsibleCard: FC<HomeCollapsibleCardProps> = ({
  instanceId,
  expanded,
  onToggle,
  canCollapse = true,
  kicker,
  title,
  statusSlot,
  summarySlot,
  toggleExpandLabel,
  toggleCollapseLabel,
  children,
}) => {
  const toggleId = `${instanceId}-toggle`;
  const panelId = `${instanceId}-panel`;
  const actionLabel = expanded ? toggleCollapseLabel : toggleExpandLabel;

  const headerInner = (
    <div className="space-y-2 pb-1">
      <div className="min-w-0 space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-info">
          {kicker}
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
      </div>
      {statusSlot}
      {!expanded && summarySlot ? (
        <div className="pt-0.5 text-sm text-zinc-300">{summarySlot}</div>
      ) : null}
      {canCollapse ? (
        <CollapsibleActionRow
          expanded={expanded}
          expandLabel={toggleExpandLabel}
          collapseLabel={toggleCollapseLabel}
          showDivider={!expanded}
          dividerClassName="border-zinc-800/80"
          paddingClassName={expanded ? 'pt-2' : 'pt-2'}
        />
      ) : null}
    </div>
  );

  return (
    <section className="ui-card relative overflow-hidden border-accent-info/25 shadow-panel">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/40 to-transparent" />
      {canCollapse ? (
        <button
          type="button"
          className="flex w-full flex-col text-left transition-colors hover:bg-zinc-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={actionLabel}
          id={toggleId}
          onClick={onToggle}
          onKeyDown={(e) => onCollapsibleToggleKeyDown(e, onToggle)}
        >
          {headerInner}
        </button>
      ) : (
        <header id={toggleId}>{headerInner}</header>
      )}

      <div id={panelId} role="region" aria-labelledby={toggleId} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
};

export default HomeCollapsibleCard;
