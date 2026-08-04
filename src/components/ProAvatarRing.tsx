import type { FC, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ProAvatarRingProps {
  isPro: boolean;
  /** Outer footprint: sm=40 Home collapsed, md=48 Settings/JoinArena, lg=80 Home form preview. */
  size?: 'sm' | 'md' | 'lg';
  src?: string | null;
  alt?: string;
  /** Shown when `src` is empty (initial letter, icon, etc.). */
  fallback?: ReactNode;
  className?: string;
}

const shellSizeClasses: Record<NonNullable<ProAvatarRingProps['size']>, string> = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

const faceTextClasses: Record<NonNullable<ProAvatarRingProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const nonProBorderClasses: Record<NonNullable<ProAvatarRingProps['size']>, string> = {
  sm: 'border border-accent-info/40',
  md: 'border border-accent-info/40',
  lg: 'border-2 border-accent-info/40',
};

/**
 * Avatar with optional Pro gold ring glow.
 * WHY: Outer box stays fixed size so Pro/non-Pro do not shift layout; glow is static
 * (no continuous pulse) and cleared under prefers-reduced-motion.
 */
export const ProAvatarRing: FC<ProAvatarRingProps> = ({
  isPro,
  size = 'md',
  src,
  alt = '',
  fallback,
  className,
}) => {
  return (
    <div
      className={cn(
        'shrink-0 rounded-full',
        shellSizeClasses[size],
        isPro &&
          'bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 p-[2px] shadow-[0_0_10px_rgba(255,179,0,0.4)] motion-reduce:shadow-none',
        className
      )}
    >
      <div
        className={cn(
          'flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-zinc-900 font-semibold uppercase text-zinc-200',
          faceTextClasses[size],
          !isPro && nonProBorderClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{fallback}</span>
        )}
      </div>
    </div>
  );
};

export default ProAvatarRing;
