import type { FC, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../navigation/BottomNav';
import HudAvatar from './HudAvatar';

export interface AppShellProps {
  /** Optional: render routes via parent `<Outlet />` when used as route element (default). */
  children?: ReactNode;
}

/**
 * Phase 1 shell — three-layer layout contract (see `docs/PHASE0_SHELL_SPEC.md`).
 * HUD + Dock: avatar + bottom nav from `NAV_ITEMS`.
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
        className="relative z-[1] flex min-h-[100dvh] flex-1 flex-col pb-[calc(64px+env(safe-area-inset-bottom,0px))] pt-16"
      >
        {children ?? <Outlet />}
      </div>

      <div
        id="layer-shell-frame"
        className="pointer-events-none fixed inset-0 z-[2] flex flex-col justify-between"
      >
        <div className="shell-hud-slot pointer-events-auto flex min-h-14 shrink-0 items-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <HudAvatar />
        </div>
        <div className="shell-dock-slot pointer-events-auto mt-auto w-full shrink-0">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
