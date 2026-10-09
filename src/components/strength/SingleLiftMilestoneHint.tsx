import type { FC } from 'react';
import { useSingleLiftMilestoneHint } from '../../hooks/useSingleLiftMilestoneHint';
import { useScoreMeaning } from '../../hooks/useScoreMeaning';
import type { StrengthLiftKey } from '../../types/strengthInputs';
import type { PhysicalProfile } from '../../types/userProfile';

export interface SingleLiftMilestoneHintProps {
  liftType: StrengthLiftKey;
  /** Clamped production lift score after calculate-this-lift. */
  liftScore: number;
  currentWeightKg: number;
  reps: number;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}

/**
 * WHY: Hooks cannot run inside STRENGTH_LIFT_KEYS.map — isolate per-lift scoreMeaning + raw-gap here.
 */
const SingleLiftMilestoneHint: FC<SingleLiftMilestoneHintProps> = ({
  liftType,
  liftScore,
  currentWeightKg,
  reps,
  profile,
  profileReady,
}) => {
  const scoreMeaning = useScoreMeaning('strength', liftScore);
  const hint = useSingleLiftMilestoneHint(
    liftType,
    scoreMeaning,
    currentWeightKg,
    reps,
    profile,
    profileReady
  );

  if (!hint) return null;

  return (
    <p className="border-t border-zinc-800/80 pt-1.5 text-xs font-medium text-orange-300/95">
      {hint}
    </p>
  );
};

export default SingleLiftMilestoneHint;
