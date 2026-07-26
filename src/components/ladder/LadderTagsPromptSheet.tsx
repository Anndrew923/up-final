import { useCallback, useEffect, useId, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { validatePhysicalProfile } from '../../logic/core/physicalProfile';
import {
  dismissFilterTagNudge,
  dismissLadderTagsPrompt,
} from '../../services/ladderTagsPromptPrefService';
import { loadPhysicalProfile, savePhysicalProfile } from '../../services/localStorageService';
import {
  LADDER_COUNTRY_CODES,
  LADDER_JOB_CATEGORIES,
  isLadderCountryCode,
  type LadderCountryCode,
  type LadderJobCategory,
} from '../../types/ladderProfile';
import {
  getAllTaiwanCities,
  getDistrictsByCity,
  getTaiwanCityLabel,
  getTaiwanDistrictLabel,
} from '../../utils/taiwanDistricts';
import OptionSelectSheet from '../home/OptionSelectSheet';

/** `entry` = first ladder visit; `filter` =「更多篩選」soft nudge (independent dismiss). */
export type LadderTagsPromptVariant = 'entry' | 'filter';

export interface LadderTagsPromptSheetProps {
  open: boolean;
  variant?: LadderTagsPromptVariant;
  onClose: () => void;
  /**
   * Fires after Skip or successful Save (and after the matching dismiss flag is written).
   * WHY: Filter flow chains into `openSheet()` without blocking arena entry.
   */
  onFinished?: () => void;
}

function readJobCategory(value: unknown): LadderJobCategory | '' {
  return typeof value === 'string' &&
    (LADDER_JOB_CATEGORIES as readonly string[]).includes(value)
    ? (value as LadderJobCategory)
    : '';
}

function readCountryCode(value: unknown): LadderCountryCode | '' {
  return typeof value === 'string' && isLadderCountryCode(value) ? value : '';
}

function readOptionalString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function dismissForVariant(variant: LadderTagsPromptVariant): void {
  if (variant === 'filter') {
    dismissFilterTagNudge();
    return;
  }
  dismissLadderTagsPrompt();
}

/**
 * Soft prompt for high-value ladder tags (job + country + region cascade).
 * Skip / successful save dismiss the active variant flag — never blocks ladder entry.
 */
const LadderTagsPromptSheet: FC<LadderTagsPromptSheetProps> = ({
  open,
  variant = 'entry',
  onClose,
  onFinished,
}) => {
  const { t, i18n } = useTranslation('common');
  const titleId = useId();
  const descId = useId();
  const [jobCategory, setJobCategory] = useState<LadderJobCategory | ''>('');
  const [countryCode, setCountryCodeState] = useState<LadderCountryCode | ''>('');
  const [region, setRegion] = useState('');
  const [city, setCityState] = useState('');
  const [district, setDistrict] = useState('');
  /** WHY: Skip / backdrop / Escape can fire together — only one dismiss + onFinished chain. */
  const finishLockedRef = useRef(false);

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    finishLockedRef.current = false;
    const profile = loadPhysicalProfile();
    setJobCategory(readJobCategory(profile?.jobCategory));
    setCountryCodeState(readCountryCode(profile?.countryCode));
    setRegion(readOptionalString(profile?.region));
    setCityState(readOptionalString(profile?.city));
    setDistrict(readOptionalString(profile?.district));
  }, [open]);

  const setCountryCode = useCallback((next: LadderCountryCode | '') => {
    setCountryCodeState(next);
    // WHY: Mirror Home profile cascade — TW clears free-text region; other countries clear TW locality.
    if (next === 'TW') {
      setRegion('');
      return;
    }
    setCityState('');
    setDistrict('');
  }, []);

  const setCity = useCallback((next: string) => {
    setCityState(next);
    setDistrict('');
  }, []);

  const finish = useCallback(() => {
    if (finishLockedRef.current) return;
    finishLockedRef.current = true;
    dismissForVariant(variant);
    onClose();
    onFinished?.();
  }, [onClose, onFinished, variant]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, finish]);

  const handleSave = useCallback(() => {
    if (finishLockedRef.current) return;
    const existing = loadPhysicalProfile();
    if (!existing) {
      // WHY: Without a baseline profile there is nothing to merge — dismiss like Skip.
      finish();
      return;
    }
    const isTaiwan = countryCode === 'TW';
    const result = validatePhysicalProfile({
      gender: existing.gender,
      age: existing.age,
      heightCm: existing.heightCm,
      weightKg: existing.weightKg,
      jobCategory,
      weeklyTrainingHours: existing.weeklyTrainingHours ?? null,
      trainingYears: existing.trainingYears ?? null,
      countryCode,
      region: isTaiwan ? '' : region,
      city: isTaiwan ? city : '',
      district: isTaiwan ? district : '',
      isAnonymousInLadder: existing.isAnonymousInLadder === true,
    });
    // WHY: Failed validation must not burn the dismiss flag or drop user edits.
    if (!result.ok) return;
    savePhysicalProfile(result.profile);
    finish();
  }, [city, countryCode, district, finish, jobCategory, region]);

  const isTaiwan = countryCode === 'TW';
  const jobOptions = LADDER_JOB_CATEGORIES.map((value) => ({
    value,
    label: t(`home.profile.jobOptions.${value}`),
  }));
  const countryOptions = LADDER_COUNTRY_CODES.map((value) => ({
    value,
    label: t(`home.profile.countryOptions.${value}`),
  }));
  const taiwanCityOptions = getAllTaiwanCities().map((value) => ({
    value,
    label: getTaiwanCityLabel(value, i18n.language),
  }));
  const taiwanDistrictOptions = getDistrictsByCity(city).map((value) => ({
    value,
    label: getTaiwanDistrictLabel(value, i18n.language),
  }));

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.ladderTagsPromptSheet} flex flex-col justify-end pt-4 pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label={t('home.profile.ladderTagsPrompt.skip')}
        onClick={finish}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-bg-card shadow-panel sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pb-6">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-50">
            {t('home.profile.ladderTagsPrompt.title')}
          </h2>
          <p id={descId} className="mt-2 text-sm leading-relaxed text-zinc-400">
            {t('home.profile.ladderTagsPrompt.body')}
          </p>

          <div className="mt-5 grid gap-4">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">{t('home.profile.jobCategory')}</span>
              <OptionSelectSheet
                value={jobCategory}
                onChange={setJobCategory}
                placeholder={t('home.profile.selectOptional')}
                title={t('home.profile.jobSheetTitle')}
                options={jobOptions}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">{t('home.profile.countryCode')}</span>
              <OptionSelectSheet
                value={countryCode}
                onChange={setCountryCode}
                placeholder={t('home.profile.selectOptional')}
                title={t('home.profile.countrySheetTitle')}
                options={countryOptions}
              />
            </label>

            {/* WHY: Locality cascade only after country is chosen — empty country must not show a stray region field. */}
            {isTaiwan ? (
              <>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('home.profile.city')}</span>
                  <OptionSelectSheet
                    value={city}
                    onChange={setCity}
                    placeholder={t('home.profile.selectCity')}
                    title={t('home.profile.citySheetTitle')}
                    options={taiwanCityOptions}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">{t('home.profile.district')}</span>
                  <OptionSelectSheet
                    value={district}
                    onChange={setDistrict}
                    placeholder={t('home.profile.selectDistrict')}
                    title={t('home.profile.districtSheetTitle')}
                    options={taiwanDistrictOptions}
                  />
                </label>
              </>
            ) : countryCode ? (
              <label className="flex flex-col gap-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{t('home.profile.region')}</span>
                <input
                  type="text"
                  className="ui-input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  aria-label={t('home.profile.region')}
                />
              </label>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              className="ui-btn ui-btn-primary min-h-12 w-full text-sm"
              onClick={handleSave}
            >
              {t('home.profile.ladderTagsPrompt.save')}
            </button>
            <button
              type="button"
              className="min-h-12 w-full rounded-xl border border-zinc-600 bg-transparent text-sm font-semibold text-zinc-200 hover:bg-zinc-800/80"
              onClick={finish}
            >
              {t('home.profile.ladderTagsPrompt.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LadderTagsPromptSheet;
