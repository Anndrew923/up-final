import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CONSOLE_AXIS_VIEW_MODES,
  type ConsoleAxisViewMode,
} from '../../logic/core/consoleAxisViewMode';
import { cn } from '../../lib/cn';

export interface ConsoleAxisViewToggleProps {
  value: ConsoleAxisViewMode;
  onChange: (mode: ConsoleAxisViewMode) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Micro fitness/telemetry pill (WHY): Compact S-Mode switch for the console cluster —
 * keeps the title row balanced without borrowing the taller assessment tab track.
 */
export const ConsoleAxisViewToggle: FC<ConsoleAxisViewToggleProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const { t } = useTranslation('common');

  return (
    <div
      className={cn(
        'inline-flex h-7 shrink-0 rounded-full border border-zinc-700/90 bg-black/40 p-0.5',
        className
      )}
      role="group"
      aria-label={t('home.consoleAxisView.ariaLabel', { ns: 'common' })}
    >
      {CONSOLE_AXIS_VIEW_MODES.map((mode) => {
        const selected = mode === value;
        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              'inline-flex h-full items-center rounded-full px-2.5 text-xs font-semibold leading-none transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary/70',
              selected
                ? 'bg-accent-primary/20 text-accent-primary shadow-[0_0_12px_rgba(245,158,11,0.28)] ring-1 ring-inset ring-accent-primary/40'
                : 'text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            onClick={() => {
              if (mode === value) return;
              onChange(mode);
            }}
          >
            {t(`home.consoleAxisView.${mode}`, { ns: 'common' })}
          </button>
        );
      })}
    </div>
  );
};

export default ConsoleAxisViewToggle;
