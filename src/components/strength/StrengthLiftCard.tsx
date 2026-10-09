import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeroNumberInput } from '../assessment/HeroNumberInput';
import type { PerLiftScore } from '../../hooks/useStrengthAssessmentPage';
import { useAnimatedScore } from '../../hooks/useAnimatedScore';
import { useDopamineFeedback } from '../../hooks/useDopamineFeedback';
import {
  shouldShowStrengthRepsAccuracyNudge,
  STRENGTH_ASSESSMENT_MAX_REPS,
  type StrengthSingleLiftError,
} from '../../logic/core/strengthAssessment';
import type { FormatUnitOptions } from '../../logic/core/unitConverters';
import type { StrengthLiftKey } from '../../types/strengthInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import SingleLiftMilestoneHint from './SingleLiftMilestoneHint';

const ONE_RM_COUNT_UP_MS = 500;
const LOCKED_CHIP_MS = 1400;

export interface StrengthLiftCardProps {
  lift: StrengthLiftKey;
  weightUnit: string;
  weightValue: string;
  repsValue: string;
  /** Metric (kg) strings for nudge / milestone parsers. */
  metricWeight: string;
  metricReps: string;
  profileReady: boolean;
  inputsDisabled: boolean;
  isArmed: boolean;
  isLocked: boolean;
  result?: PerLiftScore;
  error?: StrengthSingleLiftError;
  profile: PhysicalProfile | null;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  /** Returns true when lock-in compute succeeded. */
  onCalculate: () => boolean;
  formatWeight: (kg: number, options?: FormatUnitOptions) => string;
}

/**
 * Per-lift card with Armed / Clean / Impact button state machine.
 * WHY: Isolates useAnimatedScore + dopamine so StrengthAssessmentPage.map stays hook-safe.
 */
const StrengthLiftCard: FC<StrengthLiftCardProps> = ({
  lift,
  weightUnit,
  weightValue,
  repsValue,
  metricWeight,
  metricReps,
  profileReady,
  inputsDisabled,
  isArmed,
  isLocked,
  result,
  error,
  profile,
  onWeightChange,
  onRepsChange,
  onCalculate,
  formatWeight,
}) => {
  const { t } = useTranslation('common');
  const { triggerImpact } = useDopamineFeedback();
  const { displayValue, animateTo, setInstant } = useAnimatedScore({
    durationMs: ONE_RM_COUNT_UP_MS,
  });
  const [showLockedChip, setShowLockedChip] = useState(false);
  /** Bumps on successful Impact so Strict Mode remounts cannot drop the ceremony. */
  const [impactNonce, setImpactNonce] = useState(0);
  const lastAnimatedNonceRef = useRef(0);
  const chipTimerRef = useRef<number | null>(null);

  const showRepsAccuracyNudge = shouldShowStrengthRepsAccuracyNudge(metricWeight, metricReps);
  const repsAccuracyNudgeId = `strength-reps-accuracy-${lift}`;
  const scoredLiftReps = Number.parseInt(metricReps.trim(), 10);
  const hasScoredLiftReps = Number.isInteger(scoredLiftReps) && scoredLiftReps >= 1;

  useEffect(() => {
    return () => {
      if (chipTimerRef.current !== null) {
        window.clearTimeout(chipTimerRef.current);
      }
    };
  }, []);

  // WHY: Ceremony only when impactNonce advances; never call setInstant after that
  // (setInstant cancels RAF and would kill an in-flight 1RM count-up).
  useEffect(() => {
    if (!result) {
      setInstant(null);
      setShowLockedChip(false);
      if (chipTimerRef.current !== null) {
        window.clearTimeout(chipTimerRef.current);
        chipTimerRef.current = null;
      }
      return;
    }

    if (impactNonce > 0 && impactNonce !== lastAnimatedNonceRef.current) {
      lastAnimatedNonceRef.current = impactNonce;
      void animateTo(result.oneRepMax, 0);
      setShowLockedChip(true);
      if (chipTimerRef.current !== null) {
        window.clearTimeout(chipTimerRef.current);
      }
      chipTimerRef.current = window.setTimeout(() => {
        setShowLockedChip(false);
        chipTimerRef.current = null;
      }, LOCKED_CHIP_MS);
      return;
    }

    // Already ceremonied this nonce — leave RAF alone.
    if (impactNonce > 0 && impactNonce === lastAnimatedNonceRef.current) {
      return;
    }

    setInstant(result.oneRepMax);
  }, [result, impactNonce, animateTo, setInstant]);

  const handleLockIn = () => {
    if (!profileReady || inputsDisabled) return;
    const ok = onCalculate();
    if (!ok) return;
    triggerImpact('medium');
    setImpactNonce((n) => n + 1);
  };

  const buttonClass = isArmed
    ? 'ui-btn ui-btn-armed text-sm disabled:cursor-not-allowed disabled:opacity-45'
    : 'ui-btn ui-btn-ghost text-sm disabled:cursor-not-allowed disabled:opacity-45';
  const buttonLabel = isArmed ? t('strength.lockIn') : t('strength.calculateThisLift');

  const displayOneRmKg =
    displayValue != null && Number.isFinite(displayValue)
      ? displayValue
      : (result?.oneRepMax ?? null);

  return (
    <fieldset className="space-y-2 rounded-xl border border-zinc-800/80 bg-bg-panel/40 p-3">
      <legend className="text-sm font-medium text-zinc-200">{t(`strength.lifts.${lift}`)}</legend>
      {/*
        WHY grid-cols-2 without sm:: force weight|reps side-by-side on ~390px so five
        lift cards stay compact — sm: breakpoint previously stacked them on mobile.
      */}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex min-w-0 flex-col gap-1 text-xs text-zinc-400" htmlFor={`st-w-${lift}`}>
          <span>{t('strength.weightLabel', { unit: weightUnit })}</span>
          <HeroNumberInput
            id={`st-w-${lift}`}
            inputMode="decimal"
            min={0}
            step={0.5}
            density="compact"
            className="w-full max-w-full"
            placeholder={t('strength.weightPlaceholder')}
            value={weightValue}
            onChange={(e) => onWeightChange(e.target.value)}
            disabled={inputsDisabled}
            aria-label={t('strength.weightAria', {
              lift: t(`strength.lifts.${lift}`),
              unit: weightUnit,
            })}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-zinc-400" htmlFor={`st-r-${lift}`}>
          <span>{t('strength.repsLabel')}</span>
          <input
            id={`st-r-${lift}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={STRENGTH_ASSESSMENT_MAX_REPS}
            step={1}
            className="ui-input w-full"
            placeholder={t('strength.repsPlaceholder')}
            value={repsValue}
            onChange={(e) => onRepsChange(e.target.value)}
            disabled={inputsDisabled}
            aria-label={t('strength.repsAria', { lift: t(`strength.lifts.${lift}`) })}
            aria-describedby={showRepsAccuracyNudge ? repsAccuracyNudgeId : undefined}
          />
        </label>
      </div>

      {showRepsAccuracyNudge ? (
        <p id={repsAccuracyNudgeId} className="text-xs leading-relaxed text-zinc-500">
          {t('strength.repsAccuracyNudge')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={!profileReady || inputsDisabled}
          onClick={handleLockIn}
        >
          {buttonLabel}
        </button>
        {showLockedChip && isLocked ? (
          <span
            className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-200/95 transition-opacity duration-300 motion-reduce:transition-none"
            role="status"
          >
            {t('strength.lockedSuccess')}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {t(`strength.singleErrors.${error}`, { unit: weightUnit })}
        </p>
      ) : null}

      {result ? (
        <div
          className="space-y-1.5 rounded-lg border border-zinc-700/90 bg-bg-panel/60 px-3 py-2"
          role="status"
        >
          {result.weightCapped ? (
            <p
              className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 text-xs leading-relaxed text-amber-100/95"
              role="status"
            >
              {t('strength.capWeightNotice', {
                lift: t(`strength.lifts.${lift}`),
                input: formatWeight(result.weightInputKg, {
                  includeUnit: false,
                  digits: 1,
                }),
                max: formatWeight(result.modelMaxKg, {
                  includeUnit: false,
                  digits: 1,
                }),
                unit: weightUnit,
              })}
            </p>
          ) : null}
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {t('strength.singleOneRmLabel')}
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums text-accent-info">
            {t('strength.singleOneRmValue', {
              value: formatWeight(displayOneRmKg ?? result.oneRepMax, {
                includeUnit: false,
                digits: 1,
              }),
              unit: weightUnit,
            })}
          </p>
          <p className="font-mono text-sm tabular-nums text-zinc-300">
            <span className="text-zinc-500">{t('strength.singleScoreLabel')}</span>{' '}
            <span className="font-semibold text-zinc-100">{result.finalScore.toFixed(2)}</span>
          </p>
          {hasScoredLiftReps ? (
            <SingleLiftMilestoneHint
              liftType={lift}
              liftScore={result.finalScore}
              currentWeightKg={result.weightUsedKg}
              reps={scoredLiftReps}
              profile={profile}
              profileReady={profileReady}
            />
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
};

export default StrengthLiftCard;
