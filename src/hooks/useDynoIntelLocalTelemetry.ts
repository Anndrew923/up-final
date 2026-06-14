import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { isDynoIntelProBypassActive } from '../config/dynoIntelAccess';
import { isFirebaseEmulatorEnabled } from '../config/firebaseEmulator';
import { buildDynoIntelLocalTelemetry } from '../logic/core/dynoIntelLocalTelemetry';
import { canUseDynoIntelFull } from '../logic/core/dynoIntelGates';
import { isGoogleLinkedAuth } from '../logic/core/entitlement';
import { useAuthStore } from '../stores/authStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { selectEntitlementState } from '../stores/entitlementSelectors';

export type { DynoIntelTelemetryRow, DynoIntelTelemetryRowId } from '../logic/core/dynoIntelLocalTelemetry';

/**
 * Read-only local DYNO INTEL uplink indicators for the debug panel.
 * WHY: Client bypass and server bypass are separate; this makes gaps scannable on device.
 */
export function useDynoIntelLocalTelemetry() {
  const authStatus = useAuthStore((s) => s.status);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const entitlement = useEntitlementStore(useShallow(selectEntitlementState));

  return useMemo(
    () =>
      buildDynoIntelLocalTelemetry({
        clientDev: import.meta.env.DEV,
        clientBypass: isDynoIntelProBypassActive(),
        emulatorEnabled: isFirebaseEmulatorEnabled(),
        googleLinked: isGoogleLinkedAuth(authStatus, isAnonymous),
        proSurfaceUnlocked: canUseDynoIntelFull(entitlement, authStatus, isAnonymous),
      }),
    [authStatus, entitlement, isAnonymous]
  );
}
