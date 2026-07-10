import type { FC, SVGProps } from 'react';
import { cn } from '../../lib/cn';
import type {
  DynoIntelSuggestionId,
  DynoIntelSuggestionItem,
} from '../../logic/core/buildDynoIntelSuggestions';
import DynoIntelAwardIcon from './DynoIntelAwardIcon';
import DynoIntelCrosshairIcon from './DynoIntelCrosshairIcon';
import DynoIntelSigmaIcon from './DynoIntelSigmaIcon';

export interface DynoIntelSuggestionChipsProps {
  items: readonly DynoIntelSuggestionItem[];
  visible: boolean;
  disabled?: boolean;
  groupAriaLabel?: string;
  onSelect: (query: string) => void;
}

const CHIP_ICONS: Record<DynoIntelSuggestionId, FC<SVGProps<SVGSVGElement>>> = {
  overall: DynoIntelAwardIcon,
  axis: DynoIntelCrosshairIcon,
  methodology: DynoIntelSigmaIcon,
};

const ICON_CLASS = 'h-3.5 w-3.5 shrink-0 text-cyan-400/80';

const DynoIntelSuggestionChips: FC<DynoIntelSuggestionChipsProps> = ({
  items,
  visible,
  disabled = false,
  groupAriaLabel,
  onSelect,
}) => {
  if (!visible || items.length === 0) return null;

  return (
    <div
      className="mb-3 flex flex-wrap justify-center gap-2"
      role="group"
      aria-label={groupAriaLabel}
    >
      {items.map((item) => {
        const Icon = CHIP_ICONS[item.id];
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.query)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs leading-snug',
              'bg-cyan-950/20 border border-cyan-500/20 text-zinc-300 font-medium tracking-wide',
              'shadow-[0_0_8px_rgba(6,182,212,0.08)]',
              'motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none',
              'hover:border-cyan-400/60 hover:bg-cyan-900/30 hover:text-white',
              'hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]',
              'motion-safe:hover:scale-[1.02] motion-reduce:hover:scale-100',
              'active:border-cyan-400/70 active:bg-cyan-900/40',
              'disabled:pointer-events-none disabled:opacity-40'
            )}
          >
            <Icon className={ICON_CLASS} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DynoIntelSuggestionChips;
