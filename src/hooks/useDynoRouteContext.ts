import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  resolveDynoRouteContext,
  type DynoRouteContext,
} from '../logic/core/dynoIntelRouteContext';
import {
  loadCardioActiveTab,
  subscribeCardioActiveTab,
} from '../services/localStorageService';

export function useDynoRouteContext(): DynoRouteContext {
  const { pathname } = useLocation();
  const [cardioActiveTab, setCardioActiveTab] = useState(loadCardioActiveTab);

  useEffect(() => {
    return subscribeCardioActiveTab(() => setCardioActiveTab(loadCardioActiveTab()));
  }, []);

  return useMemo(
    () =>
      resolveDynoRouteContext(pathname, {
        cardioActiveTab,
      }),
    [cardioActiveTab, pathname]
  );
}
