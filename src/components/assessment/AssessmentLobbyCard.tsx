import { useCallback, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ASSESSMENT_LOBBY_STATUS_BAR_CLASS,
  type AssessmentLobbyCardKey,
} from '../../config/assessmentLobby';
import type { RoutePath } from '../../config/routes';

const MotionLink = motion.create(Link);

export interface AssessmentLobbyCardProps {
  cardKey: AssessmentLobbyCardKey;
  to: RoutePath;
  kicker: string;
  title: string;
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
 * StatusBar + kicker + title carry dimension identity; navigation uses Framer tap isolation.
 */
export function AssessmentLobbyCard({
  cardKey,
  to,
  kicker,
  title,
}: AssessmentLobbyCardProps) {
  const navigate = useNavigate();
  const statusBarClass = ASSESSMENT_LOBBY_STATUS_BAR_CLASS[cardKey];

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
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      onTap={handleTap}
      onKeyDown={handleKeyDown}
      className="group relative block touch-manipulation overflow-hidden rounded-2xl border border-accent-primary/25 bg-bg-card/95 px-4 py-3 pl-5 shadow-panel backdrop-blur transition-colors duration-200 hover:border-accent-primary/40"
    >
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusBarClass}`}
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary transition-colors group-hover:text-accent-primary">
        {kicker}
      </p>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-zinc-50">
        {title}
      </h2>
    </MotionLink>
  );
}
