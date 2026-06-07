import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeaderboardUploadGate } from '../logic/core/ladderUploadGate';
import { shouldOpenLadderUploadGateSheet } from '../logic/core/ladderUploadGateSheet';
import { gateSheetKindFromUiGate } from '../lib/uiGatePresentation';
import { navigateFromUiGate } from '../lib/uiGateNavigation';
import { useUiGate } from './useUiGate';

/**
 * Shared ladder-upload gate sheet for assessment sync bar + breakthrough modal.
 * WHY: One gate presentation path — avoids divergent Pro/auth handling across entry points.
 */
export function useLadderUploadGateSheet(returnTo?: string) {
  const navigate = useNavigate();
  const uiGate = useUiGate('ladder-upload');
  const [gateSheetOpen, setGateSheetOpen] = useState(false);
  const gateSheetKind = gateSheetKindFromUiGate(uiGate);

  const tryOpenGateSheet = useCallback(
    (gate: LeaderboardUploadGate): boolean => {
      if (!shouldOpenLadderUploadGateSheet(gate, gateSheetKind)) return false;
      setGateSheetOpen(true);
      return true;
    },
    [gateSheetKind]
  );

  const closeGateSheet = useCallback(() => setGateSheetOpen(false), []);

  const confirmGateSheet = useCallback(() => {
    setGateSheetOpen(false);
    navigateFromUiGate(navigate, uiGate, returnTo);
  }, [navigate, returnTo, uiGate]);

  const resetGateSheet = useCallback(() => setGateSheetOpen(false), []);

  return {
    gateSheetOpen,
    gateSheetKind,
    tryOpenGateSheet,
    closeGateSheet,
    confirmGateSheet,
    resetGateSheet,
  };
}
