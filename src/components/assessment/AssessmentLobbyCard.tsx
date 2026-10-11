import { useCallback, useMemo, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  resolveAssessmentLobbyAccentRgb,
  type AssessmentLobbyCardKey,
  type AssessmentLobbyCardSize,
} from '../../config/assessmentLobby';
import { buildLobbyCardAuraSurfaceStyle } from '../../config/sharedAxisAccentTokens';
import { cn } from '../../lib/cn';
import type { RoutePath } from '../../config/routes';

export interface AssessmentLobbyCardProps {
  cardKey: AssessmentLobbyCardKey;
  to: RoutePath;
  title: string;
  /** Right-rail glance label from `useAssessmentLobbyCards` (pure 2dp score or unset). */
  glanceLabel: string;
  /** High-contrast when a measured score is present. */
  glanceFilled: boolean;
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

/**
 * WHY single-line titles (Plan A) + right glance (Phase 2): Metaphor subtitles removed;
 * status density moves to mono readout so the Bento does not feel hollow.
 * WHY label/value material split: Title stays zinc medium; filled glance is amber mono so
 * the score reads as the primary datum without competing with the axis name.
 * WHY: `cn` does not tw-merge — radius must live only in SIZE_SHELL (not base + override).
 */
const SIZE_SHELL: Record<AssessmentLobbyCardSize, string> = {
  hero: 'min-h-[4.25rem] rounded-2xl px-5 py-4 sm:min-h-[4.75rem] sm:px-6 sm:py-5',
  standard: 'min-h-[3.5rem] rounded-2xl px-4 py-3.5',
  capsule: 'min-h-[3rem] rounded-xl px-3.5 py-3 sm:min-h-[3.125rem]',
};

const SIZE_TITLE: Record<AssessmentLobbyCardSize, string> = {
  hero: 'text-sm font-medium sm:text-base',
  standard: 'text-xs font-medium sm:text-sm',
  capsule: 'text-[11px] font-medium sm:text-xs',
};

/** Filled glance weight/size — hero is the flagship rail. */
const SIZE_GLANCE_FILLED: Record<AssessmentLobbyCardSize, string> = {
  hero: 'text-base font-bold',
  standard: 'text-sm font-semibold',
  capsule: 'text-sm font-semibold',
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
  glanceLabel,
  glanceFilled,
  size = 'standard',
  className,
}: AssessmentLobbyCardProps) {
  const navigate = useNavigate();
  const surfaceStyle = useMemo(
    (): CSSProperties => buildLobbyCardAuraSurfaceStyle(resolveAssessmentLobbyAccentRgb(cardKey)),
    [cardKey]
  );
  const isHero = size === 'hero';
  const ariaLabel = `${title}, ${glanceLabel}`;

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
      aria-label={ariaLabel}
      style={surfaceStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // WHY no overflow-hidden: outer breathe/glow must paint past the shell; beam clips itself.
        'ui-lobby-card group relative flex items-center justify-between gap-3 touch-manipulation border',
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

      <h2
        className={cn(
          'relative z-10 min-w-0 flex-1 truncate text-zinc-100 transition-colors group-hover:text-zinc-50',
          SIZE_TITLE[size]
        )}
      >
        {title}
      </h2>

      <span className="relative z-10 flex shrink-0 items-center">
        <span
          className={cn(
            'font-mono tabular-nums tracking-tight',
            glanceFilled
              ? cn('text-amber-400/90', SIZE_GLANCE_FILLED[size])
              : 'text-xs text-zinc-600'
          )}
        >
          {glanceLabel}
        </span>
        <span aria-hidden className="ml-1.5 text-xs text-zinc-600">
          ›
        </span>
      </span>
    </Link>
  );
}
