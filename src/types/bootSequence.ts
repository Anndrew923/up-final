/** Ordered boot ritual steps — Phase 1.5 sits between narrative phases 1 and 2. */
export type BootSequenceStep = 'phase1' | 'profile_input' | 'phase2' | 'phase3';

export const BOOT_SEQUENCE_STEPS: readonly BootSequenceStep[] = [
  'phase1',
  'profile_input',
  'phase2',
  'phase3',
] as const;

export type BootSequenceVariant = 'narrative' | 'profile_input';

export function isProfileInputStep(step: BootSequenceStep): boolean {
  return step === 'profile_input';
}

export function getNarrativePhase(step: BootSequenceStep): 1 | 2 | 3 | null {
  if (step === 'phase1') return 1;
  if (step === 'phase2') return 2;
  if (step === 'phase3') return 3;
  return null;
}

export function getBootStorePhase(step: BootSequenceStep): 0 | 1 | 2 | 3 {
  if (step === 'phase2') return 2;
  if (step === 'phase3') return 3;
  return 1;
}
