import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

export interface SettingsListRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Compact trailing label (locale, On/Off, count, etc.). */
  badge?: ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
}

/**
 * Standard Settings list row — icon + copy + optional badge/chevron.
 * WHY: Replaces mixed full-width CTAs so navigation density matches iOS / Spotify settings.
 */
const SettingsListRow: FC<SettingsListRowProps> = ({
  icon,
  title,
  subtitle,
  badge,
  showChevron = true,
  destructive = false,
  className = '',
  type = 'button',
  disabled,
  ...buttonProps
}) => {
  const titleColor = destructive ? 'text-rose-300' : 'text-zinc-100';
  const subtitleColor = destructive ? 'text-rose-300/70' : 'text-zinc-500';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition enabled:hover:bg-zinc-900/35 enabled:active:bg-zinc-900/55 disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
      {...buttonProps}
    >
      {icon ? (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
            destructive
              ? 'bg-rose-500/15 text-rose-300'
              : 'bg-zinc-800/90 text-zinc-300'
          }`}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-medium ${titleColor}`}>{title}</span>
        {subtitle ? (
          <span className={`mt-0.5 block text-xs leading-relaxed ${subtitleColor}`}>{subtitle}</span>
        ) : null}
      </span>
      {badge != null ? (
        <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">{badge}</span>
      ) : null}
      {showChevron ? (
        <span className="shrink-0 text-sm text-zinc-500" aria-hidden>
          ›
        </span>
      ) : null}
    </button>
  );
};

export default SettingsListRow;
