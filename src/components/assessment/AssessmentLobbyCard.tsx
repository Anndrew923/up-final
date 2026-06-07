import { useCallback, useMemo, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ASSESSMENT_LOBBY_STATUS_BAR_CLASS,
  resolveAssessmentLobbyAccentRgb,
  type AssessmentLobbyCardKey,
} from '../../config/assessmentLobby';
import { buildLobbyCardAuraSurfaceStyle } from '../../config/sharedAxisAccentTokens';
import { cn } from '../../lib/cn';
import { splitAssessmentLobbyTitle } from '../../lib/splitAssessmentLobbyTitle';
import type { RoutePath } from '../../config/routes';

const MotionLink = motion.create(Link);

export interface AssessmentLobbyCardProps {
  cardKey: AssessmentLobbyCardKey;
  to: RoutePath;
  title: string;
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
 * Presentational assessment lobby card (WHY): Whole card is the tap target—no faux CTA bar.
 * Axis aurora gradient + neon border + status bar share one RGB source from sharedAxisAccentTokens.
 */
export function AssessmentLobbyCard({
  cardKey,
  to,
  title,
  className,
}: AssessmentLobbyCardProps) {
  const navigate = useNavigate();
  const statusBarClass = ASSESSMENT_LOBBY_STATUS_BAR_CLASS[cardKey];
  const surfaceStyle = useMemo(
    (): CSSProperties => buildLobbyCardAuraSurfaceStyle(resolveAssessmentLobbyAccentRgb(cardKey)),
    [cardKey]
  );
  const { main: titleMain, sub: titleSub } = splitAssessmentLobbyTitle(title);

  const goToAssessment = useCallback(() => navigate(to), [navigate, to]);

  const handleClick = useCallback((event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (isModifiedPointerEvent(event) || event.button !== 0) return;
    event.preventDefault();
  }, []);

  const handleTap = useCallback(
    (event: PointerEvent | MouseEvent | TouchEvent) => {
      if (isModifiedPointerEvent(event)) return;
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
    <MotionLink
      to={to}
      aria-label={title}
      style={surfaceStyle}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      onTap={handleTap}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative block touch-manipulation overflow-hidden rounded-2xl border p-3 pl-4',
        'backdrop-blur-sm shadow-panel',
        'transition-all duration-300',
        'hover:border-[color:var(--lobby-border-hover)]',
        'hover:shadow-[0_0_24px_var(--lobby-glow-hover),0_10px_30px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[3px] transition-shadow duration-300',
          'group-hover:shadow-[0_0_18px_var(--lobby-glow-hover)]',
          statusBarClass
        )}
      />

      <div className="relative leading-tight">
        <h2 className="truncate text-xs font-semibold text-zinc-100 transition-colors group-hover:text-zinc-50 sm:text-sm">
          {titleMain}
        </h2>
        {titleSub ? (
          <p className="truncate text-[11px] text-zinc-500 transition-colors group-hover:text-zinc-400">
            {titleSub}
          </p>
        ) : null}
      </div>
    </MotionLink>
  );
}
