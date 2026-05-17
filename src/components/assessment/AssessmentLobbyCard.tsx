import { useCallback, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import type { RoutePath } from '../../config/routes';

const MotionLink = motion.create(Link);

export interface AssessmentLobbyCardProps {
  to: RoutePath;
  kicker: string;
  title: string;
  body: string;
  stampLabel: string;
}

function isModifiedPointerEvent(event: {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): boolean {
  return Boolean(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

/** Presentational lobby card — tap-only navigation via Framer Motion gesture isolation. */
export function AssessmentLobbyCard({ to, kicker, title, body, stampLabel }: AssessmentLobbyCardProps) {
  const navigate = useNavigate();

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
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      onTap={handleTap}
      onKeyDown={handleKeyDown}
      className="group block touch-manipulation rounded-2xl border border-accent-primary/25 bg-bg-card/95 p-5 shadow-panel backdrop-blur transition-colors duration-200"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary transition-colors group-hover:text-accent-primary">
        {kicker}
      </p>
      <h2 className="mt-2 text-base font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-accent-primary">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>

      <div className="mt-4 flex justify-end">
        <div
          className="pointer-events-none inline-flex items-center justify-center rounded-lg border border-accent-primary/40 bg-transparent px-3 py-2 text-xs font-semibold text-accent-primary transition-colors group-hover:border-accent-primary/50 group-hover:text-accent-primary"
          aria-hidden
        >
          {stampLabel}
        </div>
      </div>
    </MotionLink>
  );
}
