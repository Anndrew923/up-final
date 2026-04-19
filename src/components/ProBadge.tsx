import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'solid';
  className?: string;
}

const sizeClasses: Record<NonNullable<ProBadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const variantClasses: Record<NonNullable<ProBadgeProps['variant']>, string> = {
  subtle: 'border border-orange-500/40 bg-orange-500/10 text-orange-300',
  solid: 'border border-orange-400 bg-orange-500 text-black',
};

export const ProBadge: FC<ProBadgeProps> = ({ size = 'md', variant = 'subtle', className }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-[0.08em] ${sizeClasses[size]} ${variantClasses[variant]} ${className ?? ''}`.trim()}
    >
      {t('proBadge', { ns: 'arena' })}
    </span>
  );
};

export default ProBadge;
