import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

export interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'solid' | 'metal';
  className?: string;
}

const sizeClasses: Record<NonNullable<ProBadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const variantClasses: Record<NonNullable<ProBadgeProps['variant']>, string> = {
  subtle: 'border border-orange-500/40 bg-orange-500/10 text-orange-300 font-semibold',
  solid: 'border border-orange-400 bg-orange-500 text-black font-semibold',
  // WHY: Nickname-adjacent honor mark — high-contrast metal capsule (Discord/IG verified pattern).
  metal:
    'border-0 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-black font-black shadow-[0_2px_6px_rgba(255,111,0,0.35)] motion-reduce:shadow-none',
};

export const ProBadge: FC<ProBadgeProps> = ({ size = 'md', variant = 'subtle', className }) => {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full uppercase tracking-[0.08em]',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {t('proBadge', { ns: 'arena' })}
    </span>
  );
};

export default ProBadge;
