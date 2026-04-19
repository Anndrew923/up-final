import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { useCardioAssessmentPage } from '../hooks/useCardioAssessmentPage';

export interface CardioAssessmentPageProps {
  onBack?: () => void;
}

const CardioAssessmentPage: FC<CardioAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const [cooperInfoOpen, setCooperInfoOpen] = useState(false);
  const {
    profileReady,
    cooperDistanceOverCap,
    cooperCapMeters,
    cooperHintCaps,
    activeTab,
    setActiveTab,
    distanceInput,
    setDistanceInput,
    runMinutesInput,
    setRunMinutesInput,
    runSecondsInput,
    setRunSecondsInput,
    previewScore,
    submitDone,
    errorKey,
    clearError,
    calculate,
    submitToRadar,
  } = useCardioAssessmentPage();

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('cardio.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('cardio.title')}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('cardio.subtitle')}</p>
          </div>
          {onBack ? (
            <button type="button" className="ui-btn shrink-0" onClick={onBack}>
              {t('back')}
            </button>
          ) : null}
        </header>

        {!profileReady ? (
          <section
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90"
            role="status"
          >
            <p>{t('cardio.profileIncompleteHint')}</p>
            <Link className="mt-3 inline-block text-accent-info underline" to={ROUTES.home}>
              {t('cardio.ctaProfile')}
            </Link>
          </section>
        ) : null}

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <div
            className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4"
            role="tablist"
            aria-label={t('cardio.tabsAria')}
          >
            <button
              type="button"
              id="cardio-tab-cooper"
              role="tab"
              aria-selected={activeTab === 'cooper'}
              aria-controls="cardio-panel-cooper"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'cooper'
                  ? 'bg-accent-primary/15 text-accent-primary ring-1 ring-accent-primary/40'
                  : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('cooper')}
            >
              {t('cardio.tabCooper')}
            </button>
            <button
              type="button"
              id="cardio-tab-5km"
              role="tab"
              aria-selected={activeTab === '5km'}
              aria-controls="cardio-panel-5km"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === '5km'
                  ? 'bg-accent-primary/15 text-accent-primary ring-1 ring-accent-primary/40'
                  : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
              }`}
              onClick={() => {
                setCooperInfoOpen(false);
                setActiveTab('5km');
              }}
            >
              {t('cardio.tab5km')}
            </button>
          </div>

          <div
            id="cardio-panel-cooper"
            role="tabpanel"
            aria-labelledby="cardio-tab-cooper"
            hidden={activeTab !== 'cooper'}
            className="space-y-5"
          >
              <div className="rounded-xl border border-zinc-700/70 bg-bg-panel/40">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50"
                  aria-expanded={cooperInfoOpen}
                  aria-controls="cooper-info-panel"
                  id="cooper-info-toggle"
                  onClick={() => setCooperInfoOpen((v) => !v)}
                >
                  <span className="font-medium text-zinc-200">{t('cardio.cooperInfo.title')}</span>
                  <span className="shrink-0 text-xs font-medium text-accent-primary/90">
                    {cooperInfoOpen ? t('cardio.cooperInfo.toggleCollapse') : t('cardio.cooperInfo.toggleExpand')}
                  </span>
                </button>
                <div
                  id="cooper-info-panel"
                  role="region"
                  aria-labelledby="cooper-info-toggle"
                  hidden={!cooperInfoOpen}
                  className="border-t border-zinc-700/60"
                >
                  <div className="space-y-2 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400">
                    <p>{t('cardio.cooperInfo.p1')}</p>
                    <p>{t('cardio.cooperInfo.p2')}</p>
                    <p>{t('cardio.cooperInfo.p3')}</p>
                    <p>{t('cardio.cooperInfo.p4')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('cardio.cooperDistanceLabel')}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="ui-input max-w-md"
                  value={distanceInput}
                  onChange={(e) => {
                    clearError();
                    setDistanceInput(e.target.value);
                  }}
                  placeholder={t('cardio.cooperPlaceholder')}
                  aria-label={t('cardio.cooperDistanceLabel')}
                />
                <p className="text-xs leading-relaxed text-zinc-500">
                  {t('cardio.cooperHint', cooperHintCaps)}
                </p>
                {cooperDistanceOverCap && cooperCapMeters !== null ? (
                  <p
                    className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90"
                    role="status"
                  >
                    {t('cardio.cooperWorldRecordCapHint', { capMeters: cooperCapMeters })}
                  </p>
                ) : null}
              </div>
          </div>
          <div
            id="cardio-panel-5km"
            role="tabpanel"
            aria-labelledby="cardio-tab-5km"
            hidden={activeTab !== '5km'}
            className="space-y-3"
          >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('cardio.run5kmHeading')}
              </p>
              <div className="flex flex-wrap gap-3">
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span>{t('cardio.minutesLabel')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="ui-input w-28"
                    value={runMinutesInput}
                    onChange={(e) => {
                      clearError();
                      setRunMinutesInput(e.target.value);
                    }}
                    aria-label={t('cardio.minutesLabel')}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-400">
                  <span>{t('cardio.secondsLabel')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="ui-input w-28"
                    value={runSecondsInput}
                    onChange={(e) => {
                      clearError();
                      setRunSecondsInput(e.target.value);
                    }}
                    aria-label={t('cardio.secondsLabel')}
                  />
                </label>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">{t('cardio.run5kmHint')}</p>
          </div>

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`cardio.errors.${errorKey}`)}
            </p>
          ) : null}

          {previewScore !== null ? (
            <div className="rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('cardio.previewLabel')}
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
                {previewScore.toFixed(2)}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button type="button" className="ui-btn ui-btn-primary" onClick={calculate}>
              {t('cardio.calculate')}
            </button>
            <button type="button" className="ui-btn" onClick={submitToRadar}>
              {t('cardio.submitRadar')}
            </button>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {t('cardio.submitDone')}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default CardioAssessmentPage;
