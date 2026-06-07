import {
  resolveUiGate,
  type AuthStatus,
  type UiGateKind,
} from './entitlement';
import type { EntitlementState } from '../../types/entitlement';

export type LeaderboardUploadGate =
  | 'ok'
  | 'no-score'
  | 'invalid-score'
  | Exclude<UiGateKind, 'none'>;

export function resolveLeaderboardUploadGate(
  score: number | null | undefined,
  ent: EntitlementState,
  authStatus: AuthStatus,
  isAnonymous: boolean
): LeaderboardUploadGate {
  if (score === null || score === undefined || !Number.isFinite(score) || score <= 0) {
    return 'no-score';
  }
  const uiGate = resolveUiGate('ladder-upload', ent, authStatus, isAnonymous);
  if (uiGate.kind === 'none') return 'ok';
  return uiGate.kind;
}
