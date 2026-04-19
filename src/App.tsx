import type { ComponentType } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import type { NavItemKey } from './config/nav.config';
import { NAV_ITEMS, toRelativeRoutePath } from './config/nav.config';
import { ROUTES } from './config/routes';
import AssessmentPage from './pages/AssessmentPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import LadderPage from './pages/LadderPage';
import JoinArenaPage from './pages/JoinArenaPage';
import LeaderboardDebugPage from './pages/LeaderboardDebugPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { useEntitlementStore } from './stores/entitlementStore';

const NAV_TAB_PAGE: Partial<Record<NavItemKey, ComponentType>> = {
  home: HomePage,
  assessment: AssessmentPage,
  ladder: LadderPage,
  history: HistoryPage,
};

function JoinArenaRoute() {
  const navigate = useNavigate();
  const setSubscriptionStatus = useEntitlementStore((state) => state.setSubscriptionStatus);

  return (
    <JoinArenaPage
      onSubscribe={() => {
        setSubscriptionStatus('pro');
        navigate(ROUTES.home);
      }}
      onBack={() => navigate(-1)}
    />
  );
}

function LeaderboardDebugRoute() {
  const navigate = useNavigate();
  return <LeaderboardDebugPage onBack={() => navigate(-1)} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.home} replace />} />
        {NAV_ITEMS.map((item) => {
          const Tab = NAV_TAB_PAGE[item.key];
          return (
            <Route
              key={item.key}
              path={toRelativeRoutePath(item.path)}
              element={Tab ? <Tab /> : <PlaceholderPage />}
            />
          );
        })}
        <Route path={toRelativeRoutePath(ROUTES.joinArena)} element={<JoinArenaRoute />} />
        <Route
          path={toRelativeRoutePath(ROUTES.leaderboardDebug)}
          element={<LeaderboardDebugRoute />}
        />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Route>
    </Routes>
  );
}
