import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import GenderSelectSheet from '../home/GenderSelectSheet';
import UnifiedDynoProtocolPanel from './UnifiedDynoProtocolPanel';
import type { PhysicalProfileValidationErrorCode } from '../../logic/core/physicalProfile';
import { usePhysicalProfileForm } from '../../hooks/usePhysicalProfileForm';

export interface BootProfileBaselineFormProps {
  onSaved?: () => void;
  /** When false, never show the storage-complete badge until this boot save succeeds. */
  showComplete?: boolean;
}

function errorTranslationKey(code: PhysicalProfileValidationErrorCode): string {
  return `home.profile.errors.${code}`;
}

/**
 * Compact baseline body fields for boot Phase 1.5 — gender, age, height, weight only.
 */
const BootProfileBaselineForm: FC<BootProfileBaselineFormProps> = ({
  onSaved,
  showComplete = false,
}) => {
  const { t } = useTranslation();
  const {
    gender,
    setGender,
    age,
    setAge,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    errorCode,
    loading,
    handleSubmit,
  } = usePhysicalProfileForm({ onSaveSuccess: onSaved });

  return (
    <div className="mt-4 space-y-3 border-t border-zinc-800/80 pt-4">
      <UnifiedDynoProtocolPanel />

      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
          <span className="font-medium text-zinc-300">
            {t('home.profile.gender', { ns: 'common' })}
          </span>
          <GenderSelectSheet
            value={gender === 'male' || gender === 'female' ? gender : ''}
            onChange={(v) => setGender(v)}
            aria-invalid={Boolean(
              errorCode === 'required-gender' || errorCode === 'invalid-gender'
            )}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">
            {t('home.profile.age', { ns: 'common' })}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={13}
            max={90}
            step={1}
            className="ui-input"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            aria-invalid={Boolean(errorCode === 'required-age' || errorCode === 'invalid-age')}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">
            {t('home.profile.height', { ns: 'common' })} (
            {t('home.profile.heightUnit', { ns: 'common' })})
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={120}
            max={230}
            step={0.1}
            className="ui-input"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            aria-invalid={Boolean(
              errorCode === 'required-height' || errorCode === 'invalid-height'
            )}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
          <span className="font-medium text-zinc-300">
            {t('home.profile.weight', { ns: 'common' })} (
            {t('home.profile.weightUnit', { ns: 'common' })})
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={35}
            max={250}
            step={0.1}
            className="ui-input"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            aria-invalid={Boolean(
              errorCode === 'required-weight' || errorCode === 'invalid-weight'
            )}
          />
        </label>
      </div>

      {errorCode ? (
        <p className="text-xs text-rose-400" role="alert">
          {t(errorTranslationKey(errorCode), { ns: 'common' })}
        </p>
      ) : null}

      {showComplete ? (
        <p className="text-xs font-medium text-emerald-400/90">
          {t('home.profile.completeBadge', { ns: 'common' })}
        </p>
      ) : (
        <p className="text-xs text-amber-200/80">
          {t('onboarding.profileInput.lockHint', { ns: 'common' })}
        </p>
      )}

      <button type="submit" className="ui-btn ui-btn-primary w-full" disabled={loading}>
        {loading
          ? t('home.profile.saving', { ns: 'common' })
          : t('home.profile.save', { ns: 'common' })}
      </button>
      </form>
    </div>
  );
};

export default BootProfileBaselineForm;
