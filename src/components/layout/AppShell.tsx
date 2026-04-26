import type { FC, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../navigation/BottomNav';
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
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-bg-base text-zinc-100">
      <div
        id="layer-shell-bg"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950 via-bg-base to-black"
        aria-hidden={true}
      />

      <div
        id="layer-shell-scroll"
        className="relative z-[1] flex min-h-[100dvh] flex-1 flex-col pb-[calc(96px+env(safe-area-inset-bottom,0px))] pt-shell-top"
      >
        {children ?? <Outlet />}
      </div>

      <div
        id="layer-shell-frame"
        className="pointer-events-none fixed inset-0 z-[40] flex flex-col justify-start"
      >
        <div className="shell-hud-slot pointer-events-auto flex min-h-14 shrink-0 items-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <HudProfileControls />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppShell;
