import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DiagnosticOverlay from '../components/assessment/DiagnosticOverlay';
import SomatotypeReportModal from '../components/tools/SomatotypeReportModal';
import SomatotypeScientificAppendix from '../components/tools/SomatotypeScientificAppendix';
import { useSomatotypeLab } from '../hooks/useSomatotypeLab';
import { useSomatotypeLabRitual } from '../hooks/useSomatotypeLabRitual';
import { PHYSIQUE_TIERS, SOMATOTYPE_GENDERS } from '../logic/core/somatotypeLab';

export interface SomatotypeLabPageProps {
  onBack?: () => void;
}

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent-primary/60 disabled:cursor-not-allowed disabled:opacity-50';

const segmentClass = (selected: boolean) =>
  `rounded-lg border px-3 py-2.5 font-mono text-[11px] leading-snug transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    selected
      ? 'border-accent-primary/70 bg-accent-primary/10 text-accent-primary'
      : 'border-zinc-700 bg-black/30 text-zinc-300 hover:border-zinc-500'
  }`;

const SomatotypeLabPage: FC<SomatotypeLabPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const lab = useSomatotypeLab();
  const canAnalyze = lab.snapshot != null;
  const ritual = useSomatotypeLabRitual(canAnalyze, lab.snapshot);
  const formLocked = ritual.isAnalyzing;

  const chartRemountKey = `report-${ritual.reportSessionId}`;

  return (
    <main className="ui-shell-compact relative max-w-3xl space-y-6 text-zinc-100">
      <DiagnosticOverlay
        open={ritual.isAnalyzing}
        statusLine={ritual.statusLine}
        scanningLabel={ritual.scanningLabel}
        accent="armSize"
        ariaLabel={ritual.overlayAriaLabel}
      />

      <SomatotypeReportModal
        open={ritual.modalOpen}
        onClose={ritual.closeReport}
        snapshot={ritual.reportSnapshot}
        animationKey={chartRemountKey}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
            {t('tools.somatotypeLab.kicker')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {t('tools.somatotypeLab.title')}
          </h1>
        </div>
        <button
          type="button"
          className="ui-btn"
          disabled={formLocked}
          onClick={onBack ?? (() => navigate(-1))}
        >
          {t('back')}
        </button>
      </header>

      <fieldset
        disabled={formLocked}
        className="grid gap-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 sm:grid-cols-2 sm:p-5"
      >
        <div className="space-y-2 sm:col-span-2">
          <p className="text-xs font-medium tracking-wide text-zinc-400">
            {t('tools.somatotypeLab.gender.label')}
          </p>
          <div
            role="radiogroup"
            aria-label={t('tools.somatotypeLab.gender.label')}
            className="grid grid-cols-2 gap-2"
          >
            {SOMATOTYPE_GENDERS.map((option) => {
              const selected = lab.gender === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={formLocked}
                  onClick={() => lab.setGender(option)}
                  className={`${segmentClass(selected)} text-center`}
                >
                  {t(`tools.somatotypeLab.gender.options.${option}`)}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.height')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.heightInput}
            onChange={(e) => lab.setHeightInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.height')}
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.weight')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.weightInput}
            onChange={(e) => lab.setWeightInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.weight')}
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.bodyFat')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.bodyFatInput}
            onChange={(e) => lab.setBodyFatInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.bodyFat')}
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.wrist')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.wristInput}
            onChange={(e) => lab.setWristInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.wrist')}
          />
        </label>
        <label className="block text-xs text-zinc-400 sm:col-span-2">
          {t('tools.somatotypeLab.fields.arm')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.armGirthInput}
            onChange={(e) => lab.setArmGirthInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.arm')}
          />
        </label>
        <div className="space-y-2 sm:col-span-2">
          <label
            className={`flex items-center gap-2 text-sm ${
              lab.veteranCalibrationLocked ? 'cursor-not-allowed text-zinc-500' : 'text-zinc-300'
            }`}
          >
            <input
              type="checkbox"
              checked={lab.isVeteran}
              disabled={lab.veteranCalibrationLocked || formLocked}
              onChange={(e) => lab.setIsVeteran(e.target.checked)}
              className="size-4 rounded border-zinc-600 bg-zinc-900 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {t('tools.somatotypeLab.fields.veteran')}
          </label>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <p className="text-xs font-medium tracking-wide text-zinc-400">
            {t('tools.somatotypeLab.physiqueTier.label')}
          </p>
          <div
            role="radiogroup"
            aria-label={t('tools.somatotypeLab.physiqueTier.label')}
            className="grid gap-2 sm:grid-cols-3"
          >
            {PHYSIQUE_TIERS.map((tier) => {
              const selected = lab.physiqueTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={formLocked}
                  onClick={() => lab.setPhysiqueTier(tier)}
                  className={`${segmentClass(selected)} text-left`}
                >
                  {t(`tools.somatotypeLab.physiqueLabels.${lab.gender}.${tier}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full py-3 font-mono text-sm tracking-wide"
            disabled={!canAnalyze || formLocked}
            onClick={ritual.runAnalysis}
          >
            {formLocked
              ? t('tools.somatotypeLab.ritual.ctaBusy')
              : t('tools.somatotypeLab.ritual.cta')}
          </button>
          {!canAnalyze ? (
            <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
              {t('tools.somatotypeLab.emptyHint')}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <SomatotypeScientificAppendix />
        </div>
      </fieldset>
    </main>
  );
};

export default SomatotypeLabPage;
