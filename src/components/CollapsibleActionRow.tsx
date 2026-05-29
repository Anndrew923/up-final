import type { FC } from 'react';
import { CollapsibleChevron } from './CollapsibleChevron';

export interface CollapsibleActionRowProps {
  expanded: boolean;
  expandLabel: string;
  collapseLabel: string;
  /** Border above the action row when collapsed (drawer affordance). */
  showDivider?: boolean;
  dividerClassName?: string;
  paddingClassName?: string;
}

/**
 * Shared “tap to expand/collapse” row for home cards and nested disclosure panels.
 */
export const CollapsibleActionRow: FC<CollapsibleActionRowProps> = ({
  expanded,
  expandLabel,
  collapseLabel,
  showDivider = !expanded,
  dividerClassName = 'border-zinc-800/80',
  paddingClassName,
}) => {
  const actionLabel = expanded ? collapseLabel : expandLabel;
  const pad = paddingClassName ?? (expanded ? 'pt-0.5' : 'pt-2');

  return (
    <div
      className={`flex items-center justify-end gap-1.5 ${pad} ${
        showDivider ? `border-t ${dividerClassName}` : ''
      }`}
    >
      <span className="text-xs font-medium text-accent-primary/90">{actionLabel}</span>
      <CollapsibleChevron expanded={expanded} />
    </div>
  );
};

export default CollapsibleActionRow;
