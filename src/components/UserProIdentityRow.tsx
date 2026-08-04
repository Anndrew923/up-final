import type { FC, ReactNode } from 'react';
import { cn } from '../lib/cn';
import ProAvatarRing, { type ProAvatarRingProps } from './ProAvatarRing';
import ProBadge from './ProBadge';

export interface UserProIdentityRowProps {
  isPro: boolean;
  name: ReactNode;
  subtitle?: ReactNode;
  avatarUrl?: string | null;
  avatarAlt?: string;
  avatarFallback?: ReactNode;
  avatarSize?: NonNullable<ProAvatarRingProps['size']>;
  nameClassName?: string;
  className?: string;
}

/**
 * Compact Pro-aware identity axis: [avatar ring] [name] [metal PRO].
 * WHY: Home / Settings / JoinArena share one composition so honor marks stay consistent.
 */
export const UserProIdentityRow: FC<UserProIdentityRowProps> = ({
  isPro,
  name,
  subtitle,
  avatarUrl,
  avatarAlt = '',
  avatarFallback,
  avatarSize = 'md',
  nameClassName,
  className,
}) => {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <ProAvatarRing
        isPro={isPro}
        size={avatarSize}
        src={avatarUrl}
        alt={avatarAlt}
        fallback={avatarFallback}
      />
      <div className={cn('min-w-0', subtitle ? 'flex-1 space-y-1' : null)}>
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('truncate', nameClassName)}>{name}</span>
          {isPro ? <ProBadge size="sm" variant="metal" /> : null}
        </div>
        {subtitle ? <div className="truncate text-xs text-zinc-400">{subtitle}</div> : null}
      </div>
    </div>
  );
};

export default UserProIdentityRow;
