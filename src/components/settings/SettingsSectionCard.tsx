import type { FC, ReactNode } from 'react';

export type SettingsSectionVariant = 'default' | 'danger' | 'accent';

export interface SettingsSectionCardProps {
  title: string;
  children: ReactNode;
  variant?: SettingsSectionVariant;
  /** Extra classes on the outer shell (e.g. larger top margin for Danger isolation). */
  className?: string;
}

const VARIANT_SHELL: Record<SettingsSectionVariant, string> = {
  default: 'border-zinc-800 bg-bg-card/95',
  danger: 'border-rose-500/35 bg-rose-500/5',
  accent: 'border-accent-info/30 bg-bg-card/95',
};

const VARIANT_TITLE: Record<SettingsSectionVariant, string> = {
  default: 'text-zinc-500',
  danger: 'text-rose-300',
  accent: 'text-accent-info',
};

/**
 * iOS-style grouped inset card for Settings.
 * WHY: One shared shell keeps section spacing / borders consistent so rows stay the visual unit.
 */
const SettingsSectionCard: FC<SettingsSectionCardProps> = ({
  title,
  children,
  variant = 'default',
  className = '',
}) => {
  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-panel backdrop-blur ${VARIANT_SHELL[variant]} ${className}`}
    >
      <h2
        className={`px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${VARIANT_TITLE[variant]}`}
      >
        {title}
      </h2>
      <div className="divide-y divide-zinc-800/90 border-t border-zinc-800/90">{children}</div>
    </section>
  );
};

export default SettingsSectionCard;
