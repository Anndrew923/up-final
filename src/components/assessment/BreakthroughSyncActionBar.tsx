/**
 * Breakthrough footer sync controls — sole amber CTA or SYNC accordion.
 * WHY: Keep PerformanceBreakthroughModal free of accordion markup debt while
 * preserving one-tap single-target vs multi-target progressive disclosure.
 */
import type { FC } from 'react';
import { CollapsibleChevron } from '../CollapsibleChevron';
import { cn } from '../../lib/cn';

export type BreakthroughSyncActionId = 'dashboard' | 'arena' | 'guild';

export interface BreakthroughSyncAction {
  id: BreakthroughSyncActionId;
  idleLabel: string;
  busyLabel: string;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
  /** Guild-only keeps cyan emphasis inside the accordion. */
  tone: 'neutral' | 'guild';
}

export interface BreakthroughSyncActionBarProps {
  actions: BreakthroughSyncAction[];
  menuExpanded: boolean;
  menuLabel: string;
  menuRegionId: string;
  menuDisabled: boolean;
  onToggleMenu: () => void;
}

const SyncActionButton: FC<{
  action: BreakthroughSyncAction;
  nested: boolean;
}> = ({ action, nested }) => (
  <button
    type="button"
    data-testid={`breakthrough-sync-action-${action.id}`}
    className={cn(
      'w-full rounded-xl py-3 text-sm font-medium tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-40',
      nested
        ? action.tone === 'guild'
          ? 'border border-cyan-500/30 bg-transparent text-cyan-200/90 hover:bg-cyan-500/10 active:bg-cyan-500/15'
          : 'border border-zinc-700 bg-zinc-950/80 text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700'
        : 'bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-300'
    )}
    disabled={action.disabled}
    onClick={action.onClick}
  >
    {action.busy ? action.busyLabel : action.idleLabel}
  </button>
);

const BreakthroughSyncActionBar: FC<BreakthroughSyncActionBarProps> = ({
  actions,
  menuExpanded,
  menuLabel,
  menuRegionId,
  menuDisabled,
  onToggleMenu,
}) => {
  if (actions.length === 0) return null;

  if (actions.length === 1) {
    return <SyncActionButton action={actions[0]!} nested={false} />;
  }

  return (
    <div>
      <button
        type="button"
        data-testid="breakthrough-sync-menu-toggle"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-amber-400 active:bg-amber-300 disabled:pointer-events-none disabled:opacity-40"
        disabled={menuDisabled}
        aria-expanded={menuExpanded}
        aria-controls={menuRegionId}
        onClick={onToggleMenu}
      >
        <span>{menuLabel}</span>
        <CollapsibleChevron
          expanded={menuExpanded}
          className="h-4 w-4 shrink-0 text-black/80"
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          menuExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden ${
            menuExpanded ? '' : 'pointer-events-none'
          }`}
          inert={menuExpanded ? undefined : true}
        >
          <div
            id={menuRegionId}
            role="region"
            aria-label={menuLabel}
            aria-hidden={!menuExpanded}
            className="mt-2 space-y-1.5 rounded-xl border border-amber-500/30 bg-zinc-900/95 p-1.5"
          >
            {actions.map((action) => (
              <SyncActionButton key={action.id} action={action} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakthroughSyncActionBar;
