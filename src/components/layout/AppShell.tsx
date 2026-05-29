import type { FC, ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BootSequenceOverlay from '../onboarding/BootSequenceOverlay';
import BottomNav from '../navigation/BottomNav';
import { ROUTES, isLadderRoutePath } from '../../config/routes';
import { useBootSequence } from '../../hooks/useBootSequence';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
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
  const bootActive = shouldShow && location.pathname === ROUTES.home;
  const isLadderRoute = isLadderRoutePath(location.pathname);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-bg-base text-zinc-100">
      <div
        id="layer-shell-bg"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950 via-bg-base to-black"
        aria-hidden={true}
      />

      {/*
        Scroll top inset: `pt-shell-top` (default) or `pt-shell-top-ladder` on `/ladder`.
        Ladder token is tuned separately — see `spacing.shell-top-ladder` in tailwind.config.
      */}
      <div
        id="layer-shell-scroll"
        className={`relative z-[1] flex min-h-[100dvh] flex-1 flex-col pb-[calc(96px+env(safe-area-inset-bottom,0px))] ${isLadderRoute ? 'pt-shell-top-ladder' : 'pt-shell-top'} ${isShellBlocked ? 'pointer-events-none select-none' : ''}`}
      >
        {children ?? <Outlet />}
      </div>

      <div
        id="layer-shell-frame"
        className={`pointer-events-none fixed inset-0 z-[40] flex flex-col justify-start motion-safe:transition-opacity motion-safe:duration-300 ${isShellBlocked ? 'opacity-40 saturate-50' : ''}`}
      >
        {/* `min-h-14` (3.5rem) is the height term inside `spacing.shell-top` — do not drift. */}
        <div
          className={`shell-hud-slot flex min-h-14 shrink-0 items-center px-4 pt-[env(safe-area-inset-top,0px)] ${isShellBlocked ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          <HudProfileControls />
        </div>
      </div>

      <BottomNav />

      <BootSequenceOverlay active={bootActive} onComplete={completeBoot} />
    </div>
  );
};

export default AppShell;
