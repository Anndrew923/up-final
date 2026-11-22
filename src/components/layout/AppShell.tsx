import type { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BootSequenceOverlay from '../onboarding/BootSequenceOverlay';
import BottomNav from '../navigation/BottomNav';
import ShellAnimatedOutlet from '../navigation/ShellAnimatedOutlet';
import TopProgressBar from '../navigation/TopProgressBar';
import {
  APP_SHELL_SCROLL_BOTTOM_PX,
  JOIN_ARENA_SCROLL_BOTTOM_PX,
  LADDER_SCROLL_BOTTOM_INSET_PX,
  bottomChromeCalc,
} from '../../constants/bottomChrome';
import {
  isHomeRoutePath,
  isJoinArenaRoutePath,
  isLadderRoutePath,
} from '../../config/routes';
import { useBootSequence } from '../../hooks/useBootSequence';
import { useNavSensoryFeedback } from '../../hooks/useNavSensoryFeedback';
import { usePushNavigateBridge } from '../../hooks/usePushNotificationLifecycle';
import { useShellInteractionBlocked } from '../../stores/uiInteractionStore';
import { SHELL_SCROLL_ID, WEBKIT_COMPOSITOR_FENCE_CLASS } from '../../lib/shellScrollLock';
import DynoIntelConsole from '../dynoIntel/DynoIntelConsole';
import SpecBadgeUnlockBanner from '../notifications/SpecBadgeUnlockBanner';
import { useSpecBadgeUnlockToast } from '../../hooks/useSpecBadgeUnlockToast';
import AestheticSpecModalHost from '../aesthetic/AestheticSpecModalHost';
import HudBackControl from './HudBackControl';
import HudProfileControls from './HudProfileControls';

export interface AppShellProps {
  /** Optional: render routes via parent `<Outlet />` when used as route element (default). */
  children?: ReactNode;
}

/**
 * Home in-flow top clearance — mirrors `spacing.shell-top` (safe-area + 3.5rem + 6px).
 * WHY exported for tests so the spacer token cannot drift from AppShell markup.
 */
export const HOME_SHELL_TOP_SPACER_CLASS =
  'pointer-events-none h-shell-top shrink-0';

/**
 * Home scroll compositor fence — own GPU layer so radar filters cannot dirty-clip
 * tile [0,0] against the fixed HUD (iOS WKWebView invalidation bug).
 * Alias of shared token so shell / board / chart fences cannot drift.
 */
export const HOME_SCROLL_COMPOSITOR_CLASS = WEBKIT_COMPOSITOR_FENCE_CLASS;

/**
 * Phase 1 shell — three-layer layout contract (see `docs/PHASE0_SHELL_SPEC.md`).
 * HUD in `layer-shell-frame`; bottom nav is a **sibling** `fixed bottom-0` bar (aligned with
 * reference-app-fitness `BottomNavBar.jsx` APK behavior — avoids WebView clipping / inset bugs).
 */
export const AppShell: FC<AppShellProps> = ({ children }) => {
  useSpecBadgeUnlockToast();
  usePushNavigateBridge();
  const location = useLocation();
  const isShellBlocked = useShellInteractionBlocked();
  const { shouldShow, completeBoot } = useBootSequence();
  useNavSensoryFeedback();
  const isHomeRoute = isHomeRoutePath(location.pathname);
  const bootActive = shouldShow && isHomeRoute;
  // WHY: Ladder bridge / Join Arena floating CTA sit above BottomNav — each route owns a taller scroll inset.
  // Calculators use in-flow CTAs and the default Dyno-visible AppShell inset.
  const scrollBottomInsetPx = isLadderRoutePath(location.pathname)
    ? LADDER_SCROLL_BOTTOM_INSET_PX
    : isJoinArenaRoutePath(location.pathname)
      ? JOIN_ARENA_SCROLL_BOTTOM_PX
      : APP_SHELL_SCROLL_BOTTOM_PX;
  // WHY Home pt-0 + in-flow spacer: iOS WKWebView treats overflow padding-top as a non-scrolling
  // clip dead-zone (~status-bar left ear). Spacer scrolls with content so radar can pass the top.
  // Non-Home always uses full `pt-shell-top` so frosted HUD never clips tab titles (ladder/tools).
  const scrollTopPadClass = isHomeRoute ? 'pt-0' : 'pt-shell-top';

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-bg-base text-zinc-100">
      <div
        id="layer-shell-bg"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950 via-bg-base to-black"
        aria-hidden={true}
      />

      {/*
        Single scroll outlet — block flow only (no flex-col) to avoid nested flex + overflow-hidden traps.
        Top inset: Home `pt-0` + in-flow spacer; all other routes `pt-shell-top` (frosted HUD clearance).
      */}
      <div
        id={SHELL_SCROLL_ID}
        data-webkit-scroll-isolate={isHomeRoute ? 'home' : undefined}
        className={`relative z-[1] h-[100dvh] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] ${scrollTopPadClass} ${
          isHomeRoute ? HOME_SCROLL_COMPOSITOR_CLASS : ''
        } ${isShellBlocked ? 'pointer-events-none select-none' : ''}`}
        style={{
          paddingBottom: bottomChromeCalc(scrollBottomInsetPx),
        }}
        // WHY: Ritual / boot overlays portal above shell — inert + aria-hidden stop dual scroll & AT bleed.
        inert={isShellBlocked ? true : undefined}
        aria-hidden={isShellBlocked || undefined}
      >
        {isHomeRoute ? (
          <div
            data-testid="home-shell-top-spacer"
            className={HOME_SHELL_TOP_SPACER_CLASS}
            aria-hidden
          />
        ) : null}
        {children ?? <ShellAnimatedOutlet />}
      </div>

      {/*
        WHY Home right-rail only: Full-width `inset-x-0` fixed HUD over HomeRadarBoard caused iOS
        WKWebView compositor clipping (stepped black under PRO). Non-Home keeps full-width for HudBack.
      */}
      <div
        id="layer-shell-frame"
        data-shell-hud-anchor={isHomeRoute ? 'home-right' : 'full-width'}
        className={`pointer-events-none fixed top-0 z-[40] flex flex-col justify-start motion-safe:transition-opacity motion-safe:duration-300 ${
          isHomeRoute
            ? 'right-0 w-fit'
            : // WHY: Assessment / sub-tool scroll must not ghost through back + PRO rail.
              // Home stays transparent w-fit — full-width frosted HUD re-triggers iOS WKWebView clip.
              // Token `bg-bg-base/90` (not magic hex) stays locked to theme.colors.bg.base.
              'inset-x-0 border-b border-white/5 bg-bg-base/90 backdrop-blur-md'
        } ${isShellBlocked ? 'opacity-40 saturate-50' : ''}`}
        inert={isShellBlocked ? true : undefined}
        aria-hidden={isShellBlocked || undefined}
      >
        {/* `min-h-14` (3.5rem) is the height term inside `spacing.shell-top` — do not drift (no extra pb). */}
        <div
          className={`shell-hud-slot flex min-h-14 shrink-0 items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+6px)] ${isShellBlocked ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          {/* WHY skip on Home: back already self-hides on tabs; omit mount so right-rail stays profile-only. */}
          {isHomeRoute ? null : <HudBackControl />}
          <HudProfileControls />
        </div>
      </div>

      <TopProgressBar />

      <BottomNav />

      <DynoIntelConsole />

      <SpecBadgeUnlockBanner />

      <BootSequenceOverlay active={bootActive} onComplete={completeBoot} />

      <AestheticSpecModalHost />
    </div>
  );
};

export default AppShell;
