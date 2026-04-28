import { memo, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import OptionSelectSheet from '../home/OptionSelectSheet';
import { LADDER_DIVISION_IDS } from '../../logic/core/ladderShards';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import type { LadderFilterSheetProps } from '../../types/ladderFilters';

function LadderFilterSheetComponent({
  open,
  values,
  activeFilterCount,
  hasUnappliedChanges,
  projectOptions,
  genderOptions,
  ageBucketOptions,
  heightBucketOptions,
  weightBucketOptions,
  jobCategoryOptions,
  countrySelectOptions,
  citySelectOptions,
  districtSelectOptions,
  effectiveCityValue,
  effectiveDistrictValue,
  syncAllSlot,
  onClose,
  onApply,
  onClear,
  onDivisionChange,
  onProjectChange,
  onGenderChange,
  onAgeBucketChange,
  onHeightBucketChange,
  onWeightBucketChange,
  onJobCategoryChange,
  onCountryCodeChange,
  onCityChange,
  onDistrictChange,
}: LadderFilterSheetProps) {
  const { t } = useTranslation('common');
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.ladderFilterSheet} flex flex-col justify-end overflow-y-auto overscroll-y-contain pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[calc(64px+env(safe-area-inset-bottom,0px))] sm:items-center sm:justify-center sm:px-4 sm:pt-4 sm:pb-[calc(64px+env(safe-area-inset-bottom,0px))]`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label={t('cancel')}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-3xl max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-y-auto rounded-t-2xl border border-zinc-700 bg-bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-panel [-webkit-overflow-scrolling:touch] sm:max-h-[min(88dvh,48rem)] sm:rounded-2xl sm:pb-6 sm:pt-4"
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-sm font-semibold tracking-tight text-zinc-50 sm:text-base">
              {t('ladder.filters.title')}
            </h2>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 ? (
                <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  {activeFilterCount}
                </span>
              ) : null}
              <button type="button" className="ui-btn py-1 text-[11px] sm:py-1.5 sm:text-xs" onClick={onClose}>
                {t('cancel')}
              </button>
            </div>
          </div>

          {syncAllSlot}

          <nav
            className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
            aria-label={t('ladder.divisionPickerTitle')}
          >
            {LADDER_DIVISION_IDS.map((divisionId) => (
              <button
                key={divisionId}
                type="button"
                title={t(`ladder.divisions.${divisionId}.desc`)}
                aria-current={values.division === divisionId ? 'true' : undefined}
                onClick={() => onDivisionChange(divisionId)}
                className={`shrink-0 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all sm:px-3 sm:py-2 sm:text-xs sm:tracking-widest ${
                  values.division === divisionId
                    ? 'border-b-2 border-red-500 bg-gradient-to-t from-red-500/15 to-transparent text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                    : 'border-b-2 border-zinc-800 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {t(`ladder.divisions.${divisionId}.label`)}
              </button>
            ))}
          </nav>

          {projectOptions.length > 1 ? (
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">{t('ladder.projectFilterLabel')}</span>
              <OptionSelectSheet
                value={values.filterProject}
                onChange={(next) => onProjectChange(next)}
                placeholder={t('ladder.filters.all')}
                title={t('ladder.projectFilterLabel')}
                options={projectOptions}
                allowEmpty={false}
              />
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
              <span className="font-medium text-zinc-300">{t('ladder.filters.gender')}</span>
              <OptionSelectSheet
                value={values.gender === 'all' ? '' : values.gender}
                onChange={(next) => onGenderChange(next === '' ? 'all' : next)}
                placeholder={t('ladder.filters.all')}
                title={t('ladder.filters.filterSheetTitles.gender')}
                options={genderOptions}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
              <span className="font-medium text-zinc-300">{t('ladder.filters.ageBucket')}</span>
              <OptionSelectSheet
                value={values.ageBucket === 'all' ? '' : values.ageBucket}
                onChange={(next) => onAgeBucketChange(next === '' ? 'all' : next)}
                placeholder={t('ladder.filters.all')}
                title={t('ladder.filters.filterSheetTitles.ageBucket')}
                options={ageBucketOptions}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
              <span className="font-medium text-zinc-300">{t('ladder.filters.heightBucket')}</span>
              <OptionSelectSheet
                value={values.heightBucket === 'all' ? '' : values.heightBucket}
                onChange={(next) => onHeightBucketChange(next === '' ? 'all' : next)}
                placeholder={t('ladder.filters.all')}
                title={t('ladder.filters.filterSheetTitles.heightBucket')}
                options={heightBucketOptions}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
              <span className="font-medium text-zinc-300">{t('ladder.filters.weightBucket')}</span>
              <OptionSelectSheet
                value={values.weightBucket === 'all' ? '' : values.weightBucket}
                onChange={(next) => onWeightBucketChange(next === '' ? 'all' : next)}
                placeholder={t('ladder.filters.all')}
                title={t('ladder.filters.filterSheetTitles.weightBucket')}
                options={weightBucketOptions}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
              <span className="font-medium text-zinc-300">{t('ladder.filters.jobCategory')}</span>
              <OptionSelectSheet
                value={values.jobCategory === 'all' ? '' : values.jobCategory}
                onChange={(next) => onJobCategoryChange(next === '' ? 'all' : next)}
                placeholder={t('ladder.filters.all')}
                title={t('ladder.filters.filterSheetTitles.jobCategory')}
                options={jobCategoryOptions}
              />
            </label>
            {countrySelectOptions.length > 0 ? (
              <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
                <span className="font-medium text-zinc-300">{t('ladder.filters.country')}</span>
                <OptionSelectSheet
                  value={values.countryCode === 'all' ? '' : values.countryCode}
                  onChange={(next) => onCountryCodeChange(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all')}
                  title={t('ladder.filters.filterSheetTitles.country')}
                  options={countrySelectOptions}
                />
              </label>
            ) : null}
            {values.countryCode !== 'all' && citySelectOptions.length > 0 ? (
              <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
                <span className="font-medium text-zinc-300">{t('ladder.filters.city')}</span>
                <OptionSelectSheet
                  value={effectiveCityValue === 'all' ? '' : effectiveCityValue}
                  onChange={(next) => onCityChange(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all')}
                  title={t('ladder.filters.filterSheetTitles.city')}
                  options={citySelectOptions}
                />
              </label>
            ) : null}
            {values.countryCode !== 'all' && districtSelectOptions.length > 0 ? (
              <label className="flex flex-col gap-0.5 text-[11px] text-zinc-400 sm:gap-1 sm:text-xs">
                <span className="font-medium text-zinc-300">{t('ladder.filters.district')}</span>
                <OptionSelectSheet
                  value={effectiveDistrictValue === 'all' ? '' : effectiveDistrictValue}
                  onChange={(next) => onDistrictChange(next === '' ? 'all' : next)}
                  placeholder={t('ladder.filters.all')}
                  title={t('ladder.filters.filterSheetTitles.district')}
                  options={districtSelectOptions}
                />
              </label>
            ) : null}
          </div>
          <div className="sticky bottom-0 z-20 -mx-4 grid grid-cols-2 gap-2 border-t border-zinc-800/80 bg-bg-card/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-3 sm:backdrop-blur-none">
            <button type="button" className="ui-btn py-1.5 text-[11px] sm:py-2 sm:text-xs" onClick={onClear}>
              {t('ladder.filters.clear')}
            </button>
            <button
              type="button"
              className="ui-btn border-accent-info/35 py-1.5 text-[11px] text-accent-info disabled:opacity-50 sm:py-2 sm:text-xs"
              onClick={onApply}
              disabled={!hasUnappliedChanges}
            >
              {t('ladder.filters.apply')}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

const LadderFilterSheet = memo(LadderFilterSheetComponent);
export default LadderFilterSheet;
