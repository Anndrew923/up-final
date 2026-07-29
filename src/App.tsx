import { Suspense, lazy, type ComponentType, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import type { NavItemKey } from './config/nav.config';
import { NAV_ITEMS, toRelativeRoutePath } from './config/nav.config';
import { ROUTES } from './config/routes';
import ExitConfirmModal from './components/shell/ExitConfirmModal';
import TermsGatekeeper from './components/legal/TermsGatekeeper';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import { useAuthSessionBootstrap } from './hooks/useAuthSessionBootstrap';
import { useProStructuredUserSyncLifecycle } from './hooks/useProStructuredUserSyncLifecycle';
import {
  canMountAppShell as resolveCanMountAppShell,
  shouldHoldAuthBootstrapSplash as resolveShouldHoldAuthBootstrapSplash,
} from './logic/core/authGate';
import { isFirestoreConfigured } from './services/firebaseClient';
import { hasCompletedAuthOnboarding } from './services/authOnboardingService';
import { useAuthStore } from './stores/authStore';
// WHY: Eager import — lazy AuthChoice + Suspense fallback paints shell-like chrome between splash and modal.
import AuthChoicePage from './pages/AuthChoicePage';
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LadderPage = lazy(() => import('./pages/LadderPage'));
const JoinArenaPage = lazy(() => import('./pages/JoinArenaPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const LeaderboardDebugPage = lazy(() => import('./pages/LeaderboardDebugPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const FfmiPage = lazy(() => import('./pages/FfmiPage'));
const CardioAssessmentPage = lazy(() => import('./pages/CardioAssessmentPage'));
const MuscleAssessmentPage = lazy(() => import('./pages/MuscleAssessmentPage'));
const ExplosiveAssessmentPage = lazy(() => import('./pages/ExplosiveAssessmentPage'));
const StrengthAssessmentPage = lazy(() => import('./pages/StrengthAssessmentPage'));
const GripAssessmentPage = lazy(() => import('./pages/GripAssessmentPage'));
const ArmSizeAssessmentPage = lazy(() => import('./pages/ArmSizeAssessmentPage'));
const OneRmCalculatorPage = lazy(() => import('./pages/OneRmCalculatorPage'));
const PlateCalculatorPage = lazy(() => import('./pages/PlateCalculatorPage'));
const SomatotypeLabPage = lazy(() => import('./pages/SomatotypeLabPage'));

const NAV_TAB_PAGE: Record<NavItemKey, ComponentType> = {
  home: HomePage,
  assessment: AssessmentPage,
  ladder: LadderPage,
  history: HistoryPage,
  tools: ToolsPage,
};

function RouteFallback() {
  return (
    <main className="ui-shell min-h-[40vh] animate-pulse rounded-xl bg-bg-card/40" aria-hidden />
  );
}

/** Pure dark hold — no shell chrome, no pulse cards (those read as Dashboard FOUC). */
function AuthBootstrapSplash() {
  return (
    <div
      className="fixed inset-0 z-[300] bg-bg-base"
      aria-busy="true"
      aria-live="polite"
    />
  );
}

function withRouteSuspense(element: ReactElement): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function LeaderboardDebugRoute() {
  if (!import.meta.env.DEV) {
    return <Navigate to={ROUTES.home} replace />;
  }
  return withRouteSuspense(<LeaderboardDebugPage />);
}

function AuthChoiceOnlyRoutes() {
  return (
    <Routes>
      <Route path={toRelativeRoutePath(ROUTES.authChoice)} element={<AuthChoicePage />} />
      <Route path="*" element={<Navigate to={ROUTES.authChoice} replace />} />
    </Routes>
  );
}

function MainAppRoutes({ isGoogleSignedIn }: { isGoogleSignedIn: boolean }) {
  return (
    <Routes>
      <Route
        path={toRelativeRoutePath(ROUTES.authChoice)}
        element={
          isGoogleSignedIn ? <Navigate to={ROUTES.home} replace /> : <AuthChoicePage />
        }
      />
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.home} replace />} />
        {NAV_ITEMS.map((item) => {
          const Tab = NAV_TAB_PAGE[item.key];
          return (
            <Route
              key={item.key}
              path={toRelativeRoutePath(item.path)}
              element={withRouteSuspense(<Tab />)}
            />
          );
        })}
        <Route
          path={toRelativeRoutePath(ROUTES.settings)}
          element={withRouteSuspense(<SettingsPage />)}
        />
        <Route path={toRelativeRoutePath(ROUTES.about)} element={withRouteSuspense(<AboutPage />)} />
        <Route
          path={toRelativeRoutePath(ROUTES.contact)}
          element={withRouteSuspense(<ContactPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.privacyPolicy)}
          element={withRouteSuspense(<PrivacyPolicyPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.joinArena)}
          element={withRouteSuspense(<JoinArenaPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.leaderboardDebug)}
          element={<LeaderboardDebugRoute />}
        />
        <Route path={toRelativeRoutePath(ROUTES.ffmi)} element={withRouteSuspense(<FfmiPage />)} />
        <Route
          path={toRelativeRoutePath(ROUTES.cardio)}
          element={withRouteSuspense(<CardioAssessmentPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.muscle)}
          element={withRouteSuspense(<MuscleAssessmentPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.explosive)}
          element={withRouteSuspense(<ExplosiveAssessmentPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.strength)}
          element={withRouteSuspense(<StrengthAssessmentPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.grip)}
          element={withRouteSuspense(<GripAssessmentPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.armSize)}
          element={withRouteSuspense(<ArmSizeAssessmentPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.oneRmCalculator)}
          element={withRouteSuspense(<OneRmCalculatorPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.plateCalculator)}
          element={withRouteSuspense(<PlateCalculatorPage />)}
        />
        <Route
          path={toRelativeRoutePath(ROUTES.somatotypeLab)}
          element={withRouteSuspense(<SomatotypeLabPage />)}
        />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  useAuthSessionBootstrap();
  useProStructuredUserSyncLifecycle();
  const { exitModalOpen, closeExitModal } = useAndroidBackButton();
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const hasOnboarding = hasCompletedAuthOnboarding();
  const isFirebaseReady = isFirestoreConfigured();
  const isGoogleSignedIn = authStatus === 'signed-in' && !isAnonymous;
  const gateInput = {
    isFirebaseReady,
    authStatus,
    isAnonymous,
    hasOnboarding,
  };
  const shouldHoldSplash = resolveShouldHoldAuthBootstrapSplash(gateInput);
  const canMountShell = resolveCanMountAppShell(gateInput);

  // WHY: Hard gate — never mount AppShell under splash/auth choice (overlay-only leaked boot UI).
  const gatedTree = canMountShell ? (
    <MainAppRoutes isGoogleSignedIn={isGoogleSignedIn} />
  ) : shouldHoldSplash ? (
    <AuthBootstrapSplash />
  ) : (
    <AuthChoiceOnlyRoutes />
  );

  return (
    <>
      {gatedTree}
      {canMountShell ? <TermsGatekeeper /> : null}
      <ExitConfirmModal open={exitModalOpen} onClose={closeExitModal} />
    </>
  );
}
