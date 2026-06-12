import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  resolveDynoRouteContext,
  type DynoRouteContext,
} from '../logic/core/dynoIntelRouteContext';

export function useDynoRouteContext(): DynoRouteContext {
  const { pathname } = useLocation();
  return useMemo(() => resolveDynoRouteContext(pathname), [pathname]);
}
