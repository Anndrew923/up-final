import { Suspense, lazy, type ComponentType, type ReactElement } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import type { NavItemKey } from './config/nav.config';
import { NAV_ITEMS, toRelativeRoutePath } from './config/nav.config';
import { ROUTES } from './config/routes';
import { useAuthSessionBootstrap } from './hooks/useAuthSessionBootstrap';
import { isFirestoreConfigured } from './services/firebaseClient';
import { hasCompletedAuthOnboarding } from './services/authOnboardingService';
import { useAuthStore } from './stores/authStore';
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const AuthChoicePage = lazy(() => import('./pages/AuthChoicePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LadderPage = lazy(() => import('./pages/LadderPage'));
const JoinArenaPage = lazy(() => import('./pages/JoinArenaPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const LeaderboardDebugPage = lazy(() => import('./pages/LeaderboardDebugPage'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const FfmiPage = lazy(() => import('./pages/FfmiPage'));
const CardioAssessmentPage = lazy(() => import('./pages/CardioAssessmentPage'));
const MuscleAssessmentPage = lazy(() => import('./pages/MuscleAssessmentPage'));
const ExplosiveAssessmentPage = lazy(() => import('./pages/ExplosiveAssessmentPage'));
const StrengthAssessmentPage = lazy(() => import('./pages/StrengthAssessmentPage'));
const GripAssessmentPage = lazy(() => import('./pages/GripAssessmentPage'));
const ArmSizeAssessmentPage = lazy(() => import('./pages/ArmSizeAssessmentPage'));

const NAV_TAB_PAGE: Partial<Record<NavItemKey, ComponentType>> = {
  home: HomePage,
  assessment: AssessmentPage,
  ladder: LadderPage,
  history: HistoryPage,
  tools: ToolsPage,
};

function RouteFallback() {
  return <main className="ui-shell min-h-[40vh] animate-pulse rounded-xl bg-bg-card/40" aria-hidden />;
}

function AuthBootstrapFallback() {
  return (
    <main className="ui-shell min-h-[40vh]">
      <div className="min-h-[40vh] animate-pulse rounded-xl bg-bg-card/40" aria-hidden />
    </main>
  );
}

function withRouteSuspense(element: ReactElement): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function JoinArenaRoute() {
  const navigate = useNavigate();

  return withRouteSuspense(<JoinArenaPage onBack={() => navigate(-1)} />);
}

function SettingsRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<SettingsPage onBack={() => navigate(-1)} />);
}

function LeaderboardDebugRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<LeaderboardDebugPage onBack={() => navigate(-1)} />);
}

function FfmiRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<FfmiPage onBack={() => navigate(-1)} />);
}

function CardioRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<CardioAssessmentPage onBack={() => navigate(-1)} />);
}

function MuscleRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<MuscleAssessmentPage onBack={() => navigate(-1)} />);
}

function ExplosiveRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<ExplosiveAssessmentPage onBack={() => navigate(-1)} />);
}

function StrengthRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<StrengthAssessmentPage onBack={() => navigate(-1)} />);
}

function GripRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<GripAssessmentPage onBack={() => navigate(-1)} />);
}

function ArmSizeRoute() {
  const navigate = useNavigate();
  return withRouteSuspense(<ArmSizeAssessmentPage onBack={() => navigate(-1)} />);
}

export default function App() {
  useAuthSessionBootstrap();
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const hasOnboarding = hasCompletedAuthOnboarding();
  const isFirebaseReady = isFirestoreConfigured();
  const isGoogleSignedIn = authStatus === 'signed-in' && !isAnonymous;
  const shouldForceAuthChoice =
    isFirebaseReady &&
    authStatus !== 'loading' &&
    !isGoogleSignedIn &&
    !hasOnboarding;
  const shouldShowAuthBootstrapFallback =
    isFirebaseReady && authStatus === 'loading' && !isGoogleSignedIn && !hasOnboarding;

  if (shouldShowAuthBootstrapFallback) {
    return <AuthBootstrapFallback />;
  }

  return (
    <Routes>
      <Route
        path={toRelativeRoutePath(ROUTES.authChoice)}
        element={
          shouldForceAuthChoice
            ? withRouteSuspense(<AuthChoicePage />)
            : <Navigate to={ROUTES.home} replace />
        }
      />
      <Route
        path="/"
        element={shouldForceAuthChoice ? <Navigate to={ROUTES.authChoice} replace /> : <AppShell />}
      >
        <Route index element={<Navigate to={ROUTES.home} replace />} />
        {NAV_ITEMS.map((item) => {
          const Tab = NAV_TAB_PAGE[item.key];
          return (
            <Route
              key={item.key}
              path={toRelativeRoutePath(item.path)}
              element={withRouteSuspense(Tab ? <Tab /> : <PlaceholderPage />)}
            />
          );
        })}
        <Route path={toRelativeRoutePath(ROUTES.settings)} element={<SettingsRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.joinArena)} element={<JoinArenaRoute />} />
        <Route
          path={toRelativeRoutePath(ROUTES.leaderboardDebug)}
          element={<LeaderboardDebugRoute />}
        />
        <Route path={toRelativeRoutePath(ROUTES.ffmi)} element={<FfmiRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.cardio)} element={<CardioRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.muscle)} element={<MuscleRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.explosive)} element={<ExplosiveRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.strength)} element={<StrengthRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.grip)} element={<GripRoute />} />
        <Route path={toRelativeRoutePath(ROUTES.armSize)} element={<ArmSizeRoute />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Route>
    </Routes>
  );
}
