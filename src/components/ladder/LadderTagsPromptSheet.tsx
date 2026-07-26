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

function dismissForVariant(variant: LadderTagsPromptVariant): void {
  if (variant === 'filter') {
    dismissFilterTagNudge();
    return;
  }
  dismissLadderTagsPrompt();
}

/**
 * Soft prompt for high-value ladder tags (job + country).
 * Skip / successful save dismiss the active variant flag — never blocks ladder entry.
 */
const LadderTagsPromptSheet: FC<LadderTagsPromptSheetProps> = ({
  open,
  variant = 'entry',
  onClose,
  onFinished,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();
  const descId = useId();
  const [jobCategory, setJobCategory] = useState<LadderJobCategory | ''>('');
  const [countryCode, setCountryCode] = useState<LadderCountryCode | ''>('');
  /** WHY: Skip / backdrop / Escape can fire together — only one dismiss + onFinished chain. */
  const finishLockedRef = useRef(false);

  useShellScrollLock(open);

  useEffect(() => {
    if (!open) return;
    finishLockedRef.current = false;
    const profile = loadPhysicalProfile();
    setJobCategory(readJobCategory(profile?.jobCategory));
    setCountryCode(readCountryCode(profile?.countryCode));
  }, [open]);

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
    const result = validatePhysicalProfile({
      gender: existing.gender,
      age: existing.age,
      heightCm: existing.heightCm,
      weightKg: existing.weightKg,
      jobCategory,
      weeklyTrainingHours: existing.weeklyTrainingHours ?? null,
      trainingYears: existing.trainingYears ?? null,
      countryCode,
      region: existing.region ?? '',
      city: existing.city ?? '',
      district: existing.district ?? '',
      isAnonymousInLadder: existing.isAnonymousInLadder === true,
    });
    // WHY: Failed validation must not burn the dismiss flag or drop user edits.
    if (!result.ok) return;
    savePhysicalProfile(result.profile);
    finish();
  }, [countryCode, finish, jobCategory]);

  const jobOptions = LADDER_JOB_CATEGORIES.map((value) => ({
    value,
    label: t(`home.profile.jobOptions.${value}`),
  }));
  const countryOptions = LADDER_COUNTRY_CODES.map((value) => ({
    value,
    label: t(`home.profile.countryOptions.${value}`),
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
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-panel sm:rounded-2xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
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
    </div>,
    document.body
  );
};

export default LadderTagsPromptSheet;
