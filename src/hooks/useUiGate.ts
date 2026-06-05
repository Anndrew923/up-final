import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  resolveUiGate,
  type GateFeature,
  type UiGateResult,
} from '../logic/core/entitlement';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';

/** Subscribes auth + entitlement stores and returns the unified UI gate decision. */
export function useUiGate(feature: GateFeature): UiGateResult {
  const authStatus = useAuthStore((state) => state.status);
  const isAnonymous = useAuthStore((state) => state.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));

  return useMemo(
    () => resolveUiGate(feature, entitlement, authStatus, isAnonymous),
    [feature, entitlement, authStatus, isAnonymous]
  );
}
