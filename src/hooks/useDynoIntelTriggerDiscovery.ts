import { useCallback, useEffect, useState } from 'react';
import {
  loadDynoIntelTriggerDiscovered,
  resolveDynoIntelTriggerDiscovered,
  saveDynoIntelTriggerDiscovered,
} from '../services/localStorageService';

export interface UseDynoIntelTriggerDiscoveryResult {
  discovered: boolean;
  markDiscovered: () => void;
}

export function useDynoIntelTriggerDiscovery(): UseDynoIntelTriggerDiscoveryResult {
  const [discovered, setDiscovered] = useState(resolveDynoIntelTriggerDiscovered);

  useEffect(() => {
    if (!discovered || loadDynoIntelTriggerDiscovered()) return;
    saveDynoIntelTriggerDiscovered(true);
  }, [discovered]);

  const markDiscovered = useCallback(() => {
    setDiscovered((prev) => (prev ? prev : true));
  }, []);

  return { discovered, markDiscovered };
}
