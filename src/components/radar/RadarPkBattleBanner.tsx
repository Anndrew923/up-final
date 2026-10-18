import { useId, type FC, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { RadarPkBattleStatus } from '../../logic/core/radarPkBattleReport';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import ProAvatarRing from '../ProAvatarRing';
import { buildRadarPkBannerStyleSheet } from './radarPkClashStyles';

export interface RadarPkBattleFighter {
  displayName: string;
  score: number;
  avatarUrl?: string | null;
  initial: string;
}

export interface RadarPkBattleBannerProps {
  target: RadarPkBattleFighter;
  viewer: RadarPkBattleFighter;
  vsLabel: string;
  badgeLabel: string;
  /** Drives left-side vector icon (no emoji in copy). */
  badgeStatus: RadarPkBattleStatus;
  ariaLabel: string;
  /** Soft exit fade while layer is held after PK disable. */
  exiting?: boolean;
  className?: string;
}

type FighterTone = 'target' | 'viewer';

const FIGHTER_TONE: Record<
  FighterTone,
  { ring: string; name: string; score: string }
> = {
  target: {
    ring: 'ring-1 ring-cyan-400/50',
    name: 'text-cyan-100/95',
    score: 'text-cyan-300',
  },
  viewer: {
    ring: 'ring-1 ring-amber-400/55',
    name: 'text-amber-100/95',
    score: 'text-amber-300',
  },
};

const BADGE_ICON_BOX = 'size-3.5 shrink-0';

function BattleBadgeIcon({ status }: { status: RadarPkBattleStatus }): ReactNode {
  switch (status) {
    case 'dominance':
      return (
        <svg viewBox="0 0 16 16" className={BADGE_ICON_BOX} fill="currentColor" aria-hidden>
          <path d="M8 1.4c.4 1.6-.2 2.7-1.2 3.7C5.6 6.3 4.7 7.4 4.7 9a3.3 3.3 0 0 0 6.6 0c0-1.7-.8-2.7-1.7-3.7-.7-.8-1.2-1.6-1.1-2.9-.2.6-.4 1.1-.5 1.4Z" />
        </svg>
      );
    case 'lead':
      return (
        <svg viewBox="0 0 16 16" className={BADGE_ICON_BOX} fill="currentColor" aria-hidden>
          <path d="M9.2 1.2 3.5 9.1h3.3L6.4 14.8l6.2-8.6H9.4L9.2 1.2Z" />
        </svg>
      );
    case 'even':
      return (
        <svg
          viewBox="0 0 16 16"
          className={BADGE_ICON_BOX}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M8 1.8 13 3.6v4.2c0 3.1-2.1 5.4-5 6.4-2.9-1-5-3.3-5-6.4V3.6L8 1.8Z" />
        </svg>
      );
    case 'trailing':
      return (
        <svg
          viewBox="0 0 16 16"
          className={BADGE_ICON_BOX}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M8 2.2v2.2M8 11.6v2.2M2.2 8h2.2M11.6 8h2.2M3.9 3.9l1.5 1.5M10.6 10.6l1.5 1.5M12.1 3.9l-1.5 1.5M5.4 10.6l-1.5 1.5" />
          <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    default: {
      // Compile-time exhaustiveness — new RadarPkBattleStatus values must map an icon.
      const _never: never = status;
      return _never;
    }
  }
}

const FighterColumn: FC<{
  fighter: RadarPkBattleFighter;
  tone: FighterTone;
  animClass: string;
}> = ({ fighter, tone, animClass }) => {
  const palette = FIGHTER_TONE[tone];
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-1 text-center',
        animClass
      )}
    >
      <ProAvatarRing
        isPro={false}
        size="sm"
        src={fighter.avatarUrl}
        alt=""
        fallback={fighter.initial}
        className={palette.ring}
      />
      <p className={cn('w-full truncate text-[11px] font-medium', palette.name)}>
        {fighter.displayName}
      </p>
      <p className={cn('font-mono text-sm font-semibold tabular-nums', palette.score)}>
        {formatOverallResonanceScore(fighter.score)}
      </p>
    </div>
  );
};

/**
 * Opt-in PK clash header — cyan target vs gold viewer, plus vector battle-report badge.
 * WHY: Presentational only; wins/losses resolved in `logic/core/radarPkBattleReport`.
 */
const RadarPkBattleBanner: FC<RadarPkBattleBannerProps> = ({
  target,
  viewer,
  vsLabel,
  badgeLabel,
  badgeStatus,
  ariaLabel,
  exiting = false,
  className,
}) => {
  const animId = useId().replace(/:/g, '_');

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2.5',
        exiting ? `radar-pk-banner-exit-${animId}` : undefined,
        className
      )}
      data-testid="radar-pk-battle-banner"
      data-banner-motion={exiting ? 'exit' : 'enter'}
      role="group"
      aria-label={ariaLabel}
    >
      <style>{buildRadarPkBannerStyleSheet(animId)}</style>

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <FighterColumn
          fighter={target}
          tone="target"
          animClass={exiting ? '' : `radar-pk-banner-slide-left-${animId}`}
        />

        <div
          className={cn(
            'select-none px-1 font-black italic tracking-tight',
            'bg-gradient-to-b from-zinc-100 via-amber-100/90 to-zinc-400 bg-clip-text text-transparent',
            'text-lg drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] sm:text-xl',
            exiting ? '' : `radar-pk-banner-vs-${animId}`
          )}
          aria-hidden
        >
          {vsLabel}
        </div>

        <FighterColumn
          fighter={viewer}
          tone="viewer"
          animClass={exiting ? '' : `radar-pk-banner-slide-right-${animId}`}
        />
      </div>

      <div
        data-testid="radar-pk-battle-badge"
        data-badge-status={badgeStatus}
        role="status"
        className={cn(
          'inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1',
          'border-amber-400/35 bg-amber-500/10 text-center text-[11px] font-medium leading-snug',
          'text-amber-50/95',
          exiting ? '' : `radar-pk-banner-badge-${animId}`
        )}
      >
        <BattleBadgeIcon status={badgeStatus} />
        <span className="truncate">{badgeLabel}</span>
      </div>

    </div>
  );
};

export default RadarPkBattleBanner;
