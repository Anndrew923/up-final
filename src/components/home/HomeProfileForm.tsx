import { useTranslation } from 'react-i18next';
import GenderSelectSheet from './GenderSelectSheet';
import OptionSelectSheet from './OptionSelectSheet';
import type { PhysicalProfileValidationErrorCode } from '../../logic/core/physicalProfile';
import { usePhysicalProfileForm } from '../../hooks/usePhysicalProfileForm';
import { LADDER_COUNTRY_CODES, LADDER_JOB_CATEGORIES } from '../../types/ladderProfile';
import {
  getAllTaiwanCities,
  getDistrictsByCity,
  getTaiwanCityLabel,
  getTaiwanDistrictLabel,
} from '../../utils/taiwanDistricts';

function errorTranslationKey(code: PhysicalProfileValidationErrorCode): string {
  return `home.profile.errors.${code}`;
}

export default function HomeProfileForm() {
  const { t, i18n } = useTranslation();
  const {
    gender,
    setGender,
    age,
    setAge,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    jobCategory,
    setJobCategory,
    weeklyTrainingHours,
    setWeeklyTrainingHours,
    trainingYears,
    setTrainingYears,
    countryCode,
    setCountryCode,
    region,
    setRegion,
    city,
    setCity,
    district,
    setDistrict,
    isAnonymousInLadder,
    setIsAnonymousInLadder,
    errorCode,
    loading,
    justSaved,
    baselineComplete,
    handleSubmit,
  } = usePhysicalProfileForm();
  const jobOptions = LADDER_JOB_CATEGORIES.map((value) => ({
    value,
    label: t(`home.profile.jobOptions.${value}`, { ns: 'common' }),
  }));
  const countryOptions = LADDER_COUNTRY_CODES.map((value) => ({
    value,
    label: t(`home.profile.countryOptions.${value}`, { ns: 'common' }),
  }));
  const isTaiwan = countryCode === 'TW';
  const taiwanCityOptions = getAllTaiwanCities().map((value) => ({
    value,
    label: getTaiwanCityLabel(value, i18n.language),
  }));
  const taiwanDistrictOptions = getDistrictsByCity(city).map((value) => ({
    value,
    label: getTaiwanDistrictLabel(value, i18n.language),
  }));

  return (
    <section className="ui-card relative overflow-hidden border-accent-info/25 shadow-panel">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-info/40 to-transparent" />
      <header className="space-y-1 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-info">
          {t('home.profile.kicker', { ns: 'common' })}
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          {t('home.profile.title', { ns: 'common' })}
        </h2>
        {baselineComplete ? (
          <p className="text-xs font-medium text-emerald-400/90">
            {t('home.profile.completeBadge', { ns: 'common' })}
          </p>
        ) : (
          <p className="text-xs text-amber-200/80">
            {t('home.profile.incompleteHint', { ns: 'common' })}
          </p>
        )}
      </header>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
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
              aria-label={t('home.profile.age', { ns: 'common' })}
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
              aria-label={t('home.profile.height', { ns: 'common' })}
              aria-invalid={Boolean(
                errorCode === 'required-height' || errorCode === 'invalid-height'
              )}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400">
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
              aria-label={t('home.profile.weight', { ns: 'common' })}
              aria-invalid={Boolean(
                errorCode === 'required-weight' || errorCode === 'invalid-weight'
              )}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">
              {t('home.profile.jobCategory', { ns: 'common' })}
            </span>
            <OptionSelectSheet
              value={jobCategory}
              onChange={setJobCategory}
              placeholder={t('home.profile.selectOptional', { ns: 'common' })}
              title={t('home.profile.jobSheetTitle', { ns: 'common' })}
              options={jobOptions}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">
              {t('home.profile.weeklyTrainingHours', { ns: 'common' })}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={168}
              step={0.5}
              className="ui-input"
              value={weeklyTrainingHours}
              onChange={(e) => setWeeklyTrainingHours(e.target.value)}
              aria-label={t('home.profile.weeklyTrainingHours', { ns: 'common' })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">
              {t('home.profile.trainingYears', { ns: 'common' })}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={80}
              step={0.5}
              className="ui-input"
              value={trainingYears}
              onChange={(e) => setTrainingYears(e.target.value)}
              aria-label={t('home.profile.trainingYears', { ns: 'common' })}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">
              {t('home.profile.countryCode', { ns: 'common' })}
            </span>
            <OptionSelectSheet
              value={countryCode}
              onChange={setCountryCode}
              placeholder={t('home.profile.selectOptional', { ns: 'common' })}
              title={t('home.profile.countrySheetTitle', { ns: 'common' })}
              options={countryOptions}
            />
          </label>

          {isTaiwan ? (
            <>
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">
                  {t('home.profile.city', { ns: 'common' })}
                </span>
                <OptionSelectSheet
                  value={city}
                  onChange={setCity}
                  placeholder={t('home.profile.selectCity', { ns: 'common' })}
                  title={t('home.profile.citySheetTitle', { ns: 'common' })}
                  options={taiwanCityOptions}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">
                  {t('home.profile.district', { ns: 'common' })}
                </span>
                <OptionSelectSheet
                  value={district}
                  onChange={setDistrict}
                  placeholder={t('home.profile.selectDistrict', { ns: 'common' })}
                  title={t('home.profile.districtSheetTitle', { ns: 'common' })}
                  options={taiwanDistrictOptions}
                />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">
                {t('home.profile.region', { ns: 'common' })}
              </span>
              <input
                type="text"
                className="ui-input"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                aria-label={t('home.profile.region', { ns: 'common' })}
              />
            </label>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={isAnonymousInLadder}
            onChange={(e) => setIsAnonymousInLadder(e.target.checked)}
          />
          <span>{t('home.profile.isAnonymousInLadder', { ns: 'common' })}</span>
        </label>

        {errorCode ? (
          <p
            className="rounded-lg border border-rose-500/35 bg-rose-950/40 px-3 py-2 text-sm text-rose-100"
            role="alert"
          >
            {t(errorTranslationKey(errorCode), { ns: 'common' })}
          </p>
        ) : null}

        {justSaved ? (
          <p className="text-sm font-medium text-emerald-400/90">
            {t('home.profile.saved', { ns: 'common' })}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-zinc-800/90 pt-4">
          <button type="submit" className="ui-btn ui-btn-primary text-sm" disabled={loading}>
            {loading
              ? t('home.profile.saving', { ns: 'common' })
              : t('home.profile.save', { ns: 'common' })}
          </button>
        </div>
      </form>
    </section>
  );
}
