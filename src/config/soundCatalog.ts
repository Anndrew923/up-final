/** Canonical sound cue IDs — maps 1:1 to `public/sounds/*.mp3` after Vite copy. */
export type SoundCue = 'pdk_shift' | 'charge_up' | 'breakthrough' | 'boot_hum';

export const SOUND_CUES: readonly SoundCue[] = [
  'pdk_shift',
  'charge_up',
  'breakthrough',
  'boot_hum',
] as const;

const SOUND_FILE_BY_CUE: Record<SoundCue, string> = {
  pdk_shift: 'pdk_shift.mp3',
  charge_up: 'charge_up.mp3',
  breakthrough: 'breakthrough.mp3',
  boot_hum: 'boot_hum.mp3',
};

/** Resolves a public URL for WebView / HTML5 Audio (WHY: single source in `public/sounds/`). */
export function resolveSoundPublicUrl(cue: SoundCue): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}sounds/${SOUND_FILE_BY_CUE[cue]}`;
}
