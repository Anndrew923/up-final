import type { FC } from 'react';
import { cn } from '../../lib/cn';
import type { DynoIntelSuggestionItem } from '../../logic/core/buildDynoIntelSuggestions';

export interface DynoIntelSuggestionChipsProps {
  items: readonly DynoIntelSuggestionItem[];
  visible: boolean;
  disabled?: boolean;
  groupAriaLabel?: string;
  onSelect: (query: string) => void;
}

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
      className={cn(
        'mb-3 flex flex-wrap justify-center gap-2',
        'motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      role="group"
      aria-label={groupAriaLabel}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.query)}
          className={cn(
            'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs leading-snug text-zinc-200',
            'motion-safe:transition-colors motion-reduce:transition-none',
            'hover:border-cyan-500/35 hover:bg-white/[0.08] hover:text-zinc-50',
            'active:border-cyan-400/45 active:bg-white/10',
            'disabled:pointer-events-none disabled:opacity-40'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default DynoIntelSuggestionChips;
