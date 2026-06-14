import type { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BootSequenceOverlay from '../onboarding/BootSequenceOverlay';
import BottomNav from '../navigation/BottomNav';
import ShellAnimatedOutlet from '../navigation/ShellAnimatedOutlet';
import { ROUTES, isCompactShellRoutePath } from '../../config/routes';
import { useBootSequence } from '../../hooks/useBootSequence';
import { useNavSensoryFeedback } from '../../hooks/useNavSensoryFeedback';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
import { SHELL_SCROLL_ID } from '../../lib/shellScrollLock';
import DynoIntelConsole from '../dynoIntel/DynoIntelConsole';
import HudProfileControls from './HudProfileControls';

export interface AppShellProps {
  /** Optional: render routes via parent `<Outlet />` when used as route element (default). */
  children?: ReactNode;
}

/**
 * Phase 1 shell — three-layer layout contract (see `docs/PHASE0_SHELL_SPEC.md`).
 * HUD in `layer-shell-frame`; bottom nav is a **sibling** `fixed bottom-0` bar (aligned with
 * reference-app-fitness `BottomNavBar.jsx` APK behavior — avoids WebView clipping / inset bugs).
 */
export const AppShell: FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isShellBlocked = useShellInteractionBlocked();
  const { shouldShow, completeBoot } = useBootSequence();
  useNavSensoryFeedback();
  const bootActive = shouldShow && location.pathname === ROUTES.home;
  const isCompactShellRoute = isCompactShellRoutePath(location.pathname);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-bg-base text-zinc-100">
      <div
        id="layer-shell-bg"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950 via-bg-base to-black"
        aria-hidden={true}
      />

      {/*
        Single scroll outlet — block flow only (no flex-col) to avoid nested flex + overflow-hidden traps.
        Top inset: `pt-shell-top` (default) or `pt-shell-top-compact` on ladder / join-arena.
      */}
      <div
        id={SHELL_SCROLL_ID}
        className={`relative z-[1] h-[100dvh] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pb-[calc(96px+env(safe-area-inset-bottom,0px))] ${isCompactShellRoute ? 'pt-shell-top-compact' : 'pt-shell-top'} ${isShellBlocked ? 'pointer-events-none select-none' : ''}`}
      >
        {children ?? <ShellAnimatedOutlet />}
      </div>

      <div
        id="layer-shell-frame"
        className={`pointer-events-none fixed inset-x-0 top-0 z-[40] flex flex-col justify-start motion-safe:transition-opacity motion-safe:duration-300 ${isShellBlocked ? 'opacity-40 saturate-50' : ''}`}
      >
        {/* `min-h-14` (3.5rem) is the height term inside `spacing.shell-top` — do not drift. */}
        <div
          className={`shell-hud-slot flex min-h-14 shrink-0 items-center px-4 pt-[env(safe-area-inset-top,0px)] ${isShellBlocked ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          <HudProfileControls />
        </div>
      </div>

      <BottomNav />

      <DynoIntelConsole />

      <BootSequenceOverlay active={bootActive} onComplete={completeBoot} />
    </div>
  );
};

export default AppShell;
