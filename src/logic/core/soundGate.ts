/**
 * Pure gate for sensory audio (WHY: logic layer stays free of service/storage imports).
 *
 * Tactical silence (2026-06-09): flip `SOUND_PIPELINE_TACTICALLY_SILENCED` to `false` to restore
 * preload + playback without refactoring call sites. Haptics remain independent of this flag.
 */
export const SOUND_PIPELINE_TACTICALLY_SILENCED = true;

export function canPlaySound(reducedMotion: boolean, soundEnabled: boolean): boolean {
  if (SOUND_PIPELINE_TACTICALLY_SILENCED) return false;
  return !reducedMotion && soundEnabled;
}
