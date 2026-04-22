import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useArmSizeAssessmentPage } from '../hooks/useArmSizeAssessmentPage';

export interface ArmSizeAssessmentPageProps {
  onBack?: () => void;
}

const ArmSizeAssessmentPage: FC<ArmSizeAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const {
    armCircumferenceInput,
    setArmCircumferenceInput,
    bodyFatInput,
    setBodyFatInput,
    previewScore,
    submittedScore,
    limitedByAxisCap,
    errorKey,
    submitDone,
    clearError,
    calculate,
    saveForLeaderboard,
  } = useArmSizeAssessmentPage();

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('armSize.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('armSize.title')}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('armSize.subtitle')}</p>
          </div>
          {onBack ? (
            <button type="button" className="ui-btn shrink-0" onClick={onBack}>
              {t('back')}
            </button>
          ) : null}
        </header>

        <section className="space-y-5 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="arm-cm">
            <span className="font-medium text-zinc-200">{t('armSize.armLabel')}</span>
            <input
              id="arm-cm"
              type="number"
              inputMode="decimal"
              min={1}
              max={70}
              step={0.1}
              className="ui-input max-w-xs"
              placeholder={t('armSize.armPlaceholder')}
              value={armCircumferenceInput}
              onChange={(e) => {
                clearError();
                setArmCircumferenceInput(e.target.value);
              }}
              aria-label={t('armSize.armLabel')}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="arm-body-fat">
            <span className="font-medium text-zinc-200">{t('armSize.bodyFatLabel')}</span>
            <input
              id="arm-body-fat"
              type="number"
              inputMode="decimal"
              min={3}
              max={50}
              step={0.1}
              className="ui-input max-w-xs"
              placeholder={t('armSize.bodyFatPlaceholder')}
              value={bodyFatInput}
              onChange={(e) => {
                clearError();
                setBodyFatInput(e.target.value);
              }}
              aria-label={t('armSize.bodyFatLabel')}
            />
          </label>

          <p className="text-xs leading-relaxed text-zinc-500">{t('armSize.formulaHint')}</p>

          {limitedByAxisCap ? (
            <div
              className="space-y-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-50">{t('armSize.capNoticeTitle')}</p>
              <p className="leading-relaxed">{t('armSize.capNoticeBody')}</p>
            </div>
          ) : null}

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`armSize.errors.${errorKey}`)}
            </p>
          ) : null}

          {previewScore !== null ? (
            <div className="space-y-2 rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('armSize.previewLabel')}
              </p>
              <p className="font-mono text-2xl tabular-nums text-accent-info">{previewScore.toFixed(2)}</p>
              {submittedScore !== null && submittedScore !== previewScore ? (
                <p className="text-sm text-zinc-300">
                  {t('armSize.submittedScoreLabel', { score: submittedScore.toFixed(2) })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button type="button" className="ui-btn ui-btn-primary" onClick={calculate}>
              {t('armSize.calculate')}
            </button>
            <button type="button" className="ui-btn" onClick={saveForLeaderboard}>
              {t('armSize.saveLeaderboard')}
            </button>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {t('armSize.submitDone')}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default ArmSizeAssessmentPage;
