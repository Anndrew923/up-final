import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

/**
 * Local preference: suppress the genesis early-bird ladder intro modal.
 * WHY: Permanent dismiss (checkbox) + session dismiss (Enter without checkbox)
 * so pilots are not nagged every tab revisit in the same session.
 */
const LADDER_GENESIS_EARLY_BIRD_DISMISSED_KEY = 'up.ladder.genesisEarlyBird.dismissed.v1';
const LADDER_GENESIS_EARLY_BIRD_SESSION_KEY = 'up.ladder.genesisEarlyBird.session.v1';

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function safeSessionGetItem(key: string): string | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSetItem(key: string, value: string): boolean {
  const storage = getSessionStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function hasDismissedLadderGenesisEarlyBird(): boolean {
  return safeGetItem(LADDER_GENESIS_EARLY_BIRD_DISMISSED_KEY) === '1';
}

export function hasSessionDismissedLadderGenesisEarlyBird(): boolean {
  return safeSessionGetItem(LADDER_GENESIS_EARLY_BIRD_SESSION_KEY) === '1';
}

/** True when the genesis intro should be shown (neither permanent nor session dismiss). */
export function shouldShowLadderGenesisEarlyBird(): boolean {
  return !hasDismissedLadderGenesisEarlyBird() && !hasSessionDismissedLadderGenesisEarlyBird();
}

export function markLadderGenesisEarlyBirdDismissed(): void {
  safeSetItem(LADDER_GENESIS_EARLY_BIRD_DISMISSED_KEY, '1');
}

/**
 * @param permanent - when true (checkbox), persist across sessions; otherwise session-only.
 */
export function dismissLadderGenesisEarlyBird(permanent: boolean): void {
  safeSessionSetItem(LADDER_GENESIS_EARLY_BIRD_SESSION_KEY, '1');
  if (permanent) {
    markLadderGenesisEarlyBirdDismissed();
  }
}
