import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { ROUTES } from '../config/routes';
import { DisclosurePanel } from '../components/DisclosurePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useCardioAssessmentPage } from '../hooks/useCardioAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { scoreMeaningMetricForCardioTab } from '../logic/core/scoreMeaningCatalog';
import { buildCardioAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import { loadPhysicalProfile } from '../services/localStorageService';

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
    persistToDashboard,
    submitToRadar,
  } = useCardioAssessmentPage();
  const scoreMeaningMetric = scoreMeaningMetricForCardioTab(activeTab);

  const ladderUploadBundle = useMemo(
    () =>
      buildCardioAssessmentSupplementalTargets({
        tab: activeTab,
        distanceInput,
        runMinutesInput,
        runSecondsInput,
        profile: loadPhysicalProfile(),
        profileReady,
      }),
    [activeTab, distanceInput, runMinutesInput, runSecondsInput, profileReady]
  );

  const ladderSync = useLeaderboardSyncAssessmentPage({
    scope: 'cardio',
    uploadBundle: ladderUploadBundle,
  });

  const reveal = useAssessmentRevealFlow({
    pool: 'cardio',
    metric: scoreMeaningMetric,
    scoreDecimals: 2,
    getScore: () => previewScore,
    hasError: () => errorKey != null,
    compute: calculate,
  });
  const {
    ceremony,
    isBlocking: revealBlocking,
    displayScore,
    revealCalculate,
    modalOpen,
    modalPayload,
    closeModal,
  } = reveal;

  const heroScore = displayScore ?? previewScore;
  const heroScoreText = heroScore != null ? heroScore.toFixed(2) : null;
  const scoreMeaning = useScoreMeaning(scoreMeaningMetric, previewScore ?? heroScore);

  return (
    <main className="ui-shell relative max-w-3xl space-y-8 text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="cardio" />
      <PerformanceBreakthroughModal
        open={modalOpen}
        payload={modalPayload}
        onClose={closeModal}
        onSyncToDashboard={submitToRadar}
        onPersistToDashboard={persistToDashboard}
        syncDisabled={!profileReady}
        arenaSync={ladderSync}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.05]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <AssessmentPageHeader
        kicker={t('cardio.kicker')}
        title={t('cardio.title')}
        subtitle={t('cardio.subtitle')}
        onBack={onBack}
      />

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
            disabled={!profileReady || revealBlocking}
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
            disabled={!profileReady || revealBlocking}
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
          <DisclosurePanel
            instanceId="cooper-info"
            expanded={cooperInfoOpen}
            onToggle={() => setCooperInfoOpen((v) => !v)}
            title={t('assessment.referenceInfo.title')}
            toggleExpandLabel={t('assessment.referenceInfo.toggleExpand')}
            toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse')}
          >
            <p>{t('cardio.cooperInfo.p1')}</p>
            <p>{t('cardio.cooperInfo.p2')}</p>
            <p>{t('cardio.cooperInfo.p3')}</p>
            <p>{t('cardio.cooperInfo.p4')}</p>
            <p>{t('cardio.cooperInfo.p5')}</p>
          </DisclosurePanel>

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
              disabled={!profileReady || revealBlocking}
              onChange={(e) => {
                clearError();
                setDistanceInput(e.target.value);
              }}
              placeholder={t('cardio.cooperPlaceholder')}
              aria-label={t('cardio.cooperDistanceLabel')}
            />
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
                disabled={!profileReady || revealBlocking}
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
                disabled={!profileReady || revealBlocking}
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
              {heroScoreText ?? previewScore.toFixed(2)}
            </p>
          </div>
        ) : null}

        {previewScore !== null && scoreMeaning ? (
          <section className="relative overflow-hidden rounded-xl border border-accent-info/35 bg-zinc-950/85 p-4 shadow-[inset_0_1px_0_rgba(56,189,248,0.2),0_0_28px_rgba(34,211,238,0.12)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/65 to-transparent" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/90">
              {t('cardio.performanceSpecHeader')}
            </p>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">
              {scoreMeaning.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{scoreMeaning.summary}</p>
            {scoreMeaning.nextMilestone !== null && scoreMeaning.remainingPoints !== null ? (
              <p className="mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium text-cyan-300">
                {t('cardio.nextMilestoneHint', { points: scoreMeaning.remainingPoints })}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            disabled={!profileReady || revealBlocking}
            onClick={() => {
              void revealCalculate();
            }}
          >
            {t('cardio.calculate')}
          </button>
          <button
            type="button"
            className="ui-btn"
            disabled={!profileReady || revealBlocking}
            onClick={submitToRadar}
          >
            {t('cardio.submitRadar')}
          </button>
          <Link className="ui-btn inline-flex" to={ROUTES.home}>
            {t('assessment.viewHomeRadar')}
          </Link>
        </div>

        {submitDone ? (
          <p className="text-sm text-accent-info" role="status">
            {t('cardio.submitDone')}
          </p>
        ) : null}

        <LeaderboardAssessmentSyncBar syncController={ladderSync} />
      </section>
    </main>
  );
};

export default CardioAssessmentPage;
