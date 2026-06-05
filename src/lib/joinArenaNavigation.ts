import { ROUTES } from '../config/routes';
import type { GateFeature } from '../logic/core/entitlement';
import type { JoinArenaFrom } from '../types/uiGate';

export type { JoinArenaFrom } from '../types/uiGate';

export function parseJoinArenaFrom(search: string): JoinArenaFrom | null {
  const raw = new URLSearchParams(search).get('from');
  if (raw === 'ladder' || raw === 'backup' || raw === 'settings') return raw;
  return null;
}

export type JoinArenaDescriptionKey =
  | 'joinDescription'
  | 'joinDescriptionFromLadder'
  | 'joinDescriptionFromBackup';

export function joinArenaDescriptionKey(from: JoinArenaFrom | null): JoinArenaDescriptionKey {
  if (from === 'ladder') return 'joinDescriptionFromLadder';
  if (from === 'backup') return 'joinDescriptionFromBackup';
  return 'joinDescription';
}

export function joinArenaPath(from?: JoinArenaFrom): string {
  if (!from) return ROUTES.joinArena;
  return `${ROUTES.joinArena}?from=${from}`;
}

/** Maps Join Arena entry context to the unified UI gate feature key. */
export function joinArenaGateFeature(from: JoinArenaFrom | null): GateFeature {
  return from === 'backup' ? 'cloud-sync' : 'ladder-read';
}
