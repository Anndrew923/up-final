import { useCallback, useMemo, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  resolveAssessmentLobbyAccentRgb,
  type AssessmentLobbyCardKey,
  type AssessmentLobbyCardSize,
} from '../../config/assessmentLobby';
import { buildLobbyCardAuraSurfaceStyle } from '../../config/sharedAxisAccentTokens';
import { cn } from '../../lib/cn';
import { splitAssessmentLobbyTitle } from '../../lib/splitAssessmentLobbyTitle';
import type { RoutePath } from '../../config/routes';

export interface AssessmentLobbyCardProps {
  cardKey: AssessmentLobbyCardKey;
  to: RoutePath;
  title: string;
  size?: AssessmentLobbyCardSize;
  className?: string;
}

function isModifiedPointerEvent(event: {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): boolean {
  return Boolean(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

// WHY: `cn` does not tw-merge — radius must live only in SIZE_SHELL (not base + override).
const SIZE_SHELL: Record<AssessmentLobbyCardSize, string> = {
  hero: 'min-h-[4.75rem] rounded-2xl p-4 pl-5 sm:min-h-[5.25rem] sm:p-5 sm:pl-6',
  standard: 'rounded-2xl p-3 pl-4',
  capsule: 'min-h-0 rounded-xl py-2.5 pl-3.5 pr-3 sm:py-2.5',
};

const SIZE_TITLE: Record<AssessmentLobbyCardSize, string> = {
  hero: 'text-sm font-bold sm:text-base',
  standard: 'text-xs font-semibold sm:text-sm',
  capsule: 'text-[11px] font-semibold sm:text-xs',
};

const SIZE_SUB: Record<AssessmentLobbyCardSize, string> = {
  hero: 'text-xs text-zinc-400 sm:text-[13px]',
  standard: 'text-[11px] text-zinc-500',
  capsule: 'text-[10px] text-zinc-500',
};

/**
 * Presentational assessment lobby card (WHY): Whole card is the tap target—no faux CTA bar.
 * Axis aurora + ambient glow (+ hero border beam) share one RGB source from sharedAxisAccentTokens.
 * Motion is CSS-only (breathe / conic spin) with prefers-reduced-motion static fallback.
 *
 * WHY no `motion.create(Link)`: Framer Motion + RR `Link` composite breaks under Vite HMR
 * (Invalid Hook Call / useContext null) and blacks out the shell. CSS active scale keeps the feel.
 */
export function AssessmentLobbyCard({
  cardKey,
  to,
  title,
  size = 'standard',
  className,
}: AssessmentLobbyCardProps) {
  const navigate = useNavigate();
  const surfaceStyle = useMemo(
    (): CSSProperties => buildLobbyCardAuraSurfaceStyle(resolveAssessmentLobbyAccentRgb(cardKey)),
    [cardKey]
  );
  const { main: titleMain, sub: titleSub } = splitAssessmentLobbyTitle(title);
  const isHero = size === 'hero';

  const goToAssessment = useCallback(() => navigate(to), [navigate, to]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (isModifiedPointerEvent(event) || event.button !== 0) return;
      event.preventDefault();
      goToAssessment();
    },
    [goToAssessment]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      goToAssessment();
    },
    [goToAssessment]
  );

  return (
    <Link
      to={to}
      aria-label={title}
      style={surfaceStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // WHY no overflow-hidden: outer breathe/glow must paint past the shell; beam clips itself.
        'ui-lobby-card group relative block touch-manipulation border',
        'backdrop-blur-sm',
        'transition-[border-color,transform] duration-300 active:scale-[0.99]',
        SIZE_SHELL[size],
        className
      )}
    >
      {isHero ? (
        <span aria-hidden className="ui-lobby-card__beam-wrap">
          <span className="ui-lobby-card__beam" />
        </span>
      ) : null}

      <span aria-hidden className="ui-lobby-card__ambient" />

      <div className="relative z-10 flex h-full flex-col justify-center leading-tight">
        <h2
          className={cn(
            'truncate text-zinc-100 transition-colors group-hover:text-zinc-50',
            SIZE_TITLE[size]
          )}
        >
          {titleMain}
        </h2>
        {titleSub ? (
          <p
            className={cn(
              'truncate transition-colors group-hover:text-zinc-400',
              SIZE_SUB[size]
            )}
          >
            {titleSub}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
