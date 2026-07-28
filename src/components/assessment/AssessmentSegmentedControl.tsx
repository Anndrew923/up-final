import type { FC, ReactNode } from 'react';
import AssessmentTabBadge, { type AssessmentTabBadgeTone } from './AssessmentTabBadge';

export interface AssessmentSegmentOption<T extends string = string> {
  id: T;
  tabId: string;
  panelId: string;
  label: string;
  badgeLabel: string;
  badgeTone: AssessmentTabBadgeTone;
  disabled?: boolean;
}

export interface AssessmentSegmentedControlProps<T extends string = string> {
  value: T;
  options: AssessmentSegmentOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
}

/**
 * Compact single-row segmented tabs for assessment specialty/core surfaces.
 * WHY: Vertical tab stacks burned first-screen height; label+badge stack keeps both
 * readable on ~390px while the track stays ~44px tall. Unit toggles stay outside this
 * control (top-right micro strip) so the track keeps full width on narrow phones.
 */
export function AssessmentSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: AssessmentSegmentedControlProps<T>) {
  return (
    <div
      className="flex h-11 w-full rounded-lg border border-zinc-700/90 bg-black/30 p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            id={opt.tabId}
            role="tab"
            aria-selected={selected}
            aria-controls={opt.panelId}
            disabled={opt.disabled}
            className={`inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-0.5 transition-colors ${
              selected
                ? 'bg-accent-primary/20 text-accent-primary shadow-sm ring-1 ring-inset ring-accent-primary/35'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
            onClick={() => onChange(opt.id)}
          >
            <span className="w-full truncate px-0.5 text-center text-[11px] font-semibold leading-tight sm:text-xs">
              {opt.label}
            </span>
            <AssessmentTabBadge tone={opt.badgeTone} compact>
              {opt.badgeLabel}
            </AssessmentTabBadge>
          </button>
        );
      })}
    </div>
  );
}

export interface AssessmentTabPanelProps {
  id: string;
  labelledBy: string;
  active: boolean;
  children: ReactNode;
  /** Applied only while active — inactive panels use `hidden` (avoids Tailwind `grid` beating `[hidden]`). */
  className?: string;
}

/** Unified show/hide for assessment tab panels (cardio + explosive). */
export const AssessmentTabPanel: FC<AssessmentTabPanelProps> = ({
  id,
  labelledBy,
  active,
  children,
  className = 'grid gap-3',
}) => (
  <div
    id={id}
    role="tabpanel"
    aria-labelledby={labelledBy}
    hidden={!active}
    className={active ? className : 'hidden'}
  >
    {children}
  </div>
);

export default AssessmentSegmentedControl;
