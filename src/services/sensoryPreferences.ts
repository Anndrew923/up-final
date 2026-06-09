const SOUND_ENABLED_KEY = 'up.soundEnabled';

function readStorage(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(SOUND_ENABLED_KEY);
    if (raw === null) return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

let cachedSoundEnabled = readStorage();

/** Global sound toggle — default on; persisted in localStorage. */
export const sensoryPreferences = {
  isSoundEnabled(): boolean {
    return cachedSoundEnabled;
  },

  setSoundEnabled(enabled: boolean): void {
    cachedSoundEnabled = enabled;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0');
    } catch {
      // ignore quota / private mode
    }
  },

  /** Re-read from storage (e.g. after external tab change). */
  refreshFromStorage(): void {
    cachedSoundEnabled = readStorage();
  },
};
