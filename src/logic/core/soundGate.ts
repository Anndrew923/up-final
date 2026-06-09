/**
 * Pure gate for sensory audio (WHY: logic layer stays free of service/storage imports).
 */
export function canPlaySound(reducedMotion: boolean, soundEnabled: boolean): boolean {
  return !reducedMotion && soundEnabled;
}
