import { useBootSequenceStore } from '../stores/bootSequenceStore';

export function useBootSequence() {
  const completed = useBootSequenceStore((s) => s.completed);
  const completeBoot = useBootSequenceStore((s) => s.completeBoot);
  const resetBoot = useBootSequenceStore((s) => s.resetBoot);

  return {
    shouldShow: !completed,
    completeBoot,
    resetBoot,
  };
}
