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
  const [cardioTabEpoch, setCardioTabEpoch] = useState(0);

  useEffect(() => {
    return subscribeCardioActiveTab(() => setCardioTabEpoch((n) => n + 1));
  }, []);

  return useMemo(
    () =>
      resolveDynoRouteContext(pathname, {
        cardioActiveTab: loadCardioActiveTab(),
      }),
    [cardioTabEpoch, pathname]
  );
}
