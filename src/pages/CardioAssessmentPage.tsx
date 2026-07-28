import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import AssessmentFieldHintBubble from '../components/assessment/AssessmentFieldHintBubble';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import { HeroNumberInput } from '../components/assessment/HeroNumberInput';
import {
  AssessmentSegmentedControl,
  AssessmentTabPanel,
} from '../components/assessment/AssessmentSegmentedControl';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { ROUTES } from '../config/routes';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import { ReferenceSimpleCopy } from '../components/assessment/AssessmentReferenceProse';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useCardioAssessmentPage } from '../hooks/useCardioAssessmentPage';
import type { CardioTab } from '../hooks/useCardioAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { scoreMeaningMetricForCardioTab } from '../logic/core/scoreMeaningCatalog';
import { buildCardioAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import { loadPhysicalProfile } from '../services/localStorageService';

const CardioAssessmentPage: FC = () => {
  const { t } = useTranslation('common');
  const [cooperInfoOpen, setCooperInfoOpen] = useState(false);
  const [run5kmInfoOpen, setRun5kmInfoOpen] = useState(false);
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
    submitAssessment,
  } = useCardioAssessmentPage();
  const scoreMeaningMetric = scoreMeaningMetricForCardioTab(activeTab);
  const isCooperTab = activeTab === 'cooper';
  const isSpecialtyTab = activeTab === '5km';

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

  const segmentOptions = useMemo(
    () => [
      {
        id: 'cooper' as const,
        tabId: 'cardio-tab-cooper',
        panelId: 'cardio-panel-cooper',
        label: t('cardio.tabCooper'),
        badgeLabel: t('cardio.badgeRadarCore'),
        badgeTone: 'core' as const,
        disabled: !profileReady || revealBlocking,
      },
      {
        id: '5km' as const,
        tabId: 'cardio-tab-5km',
        panelId: 'cardio-panel-5km',
        label: t('cardio.tab5km'),
        badgeLabel: t('cardio.badgeSpecialtyOptional'),
        badgeTone: 'specialty' as const,
        disabled: revealBlocking,
      },
    ],
    [t, profileReady, revealBlocking]
  );

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="cardio" />
      <PerformanceBreakthroughModal
        open={modalOpen}
        payload={modalPayload}
        onClose={closeModal}
        onSyncToDashboard={submitAssessment}
        onPersistToDashboard={persistToDashboard}
        syncDisabled={!profileReady}
        arenaSync={ladderSync}
      />
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-5">
        <AssessmentPageHeader kicker={t('cardio.kicker')} title={t('cardio.title')} />

        {!profileReady ? (
          <section
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90"
            role="status"
          >
            <p>{t('cardio.profileIncompleteHint')}</p>
            <Link className="mt-2 inline-block text-accent-info underline" to={ROUTES.home}>
              {t('cardio.ctaProfile')}
            </Link>
          </section>
        ) : null}

        <section className="space-y-3.5 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 shadow-panel backdrop-blur sm:p-5">
          <AssessmentSegmentedControl<CardioTab>
            value={activeTab}
            options={segmentOptions}
            onChange={(tab) => {
              if (tab === '5km') setCooperInfoOpen(false);
              setActiveTab(tab);
            }}
            ariaLabel={t('cardio.tabsAria')}
          />

          <AssessmentTabPanel
            id="cardio-panel-cooper"
            labelledBy="cardio-tab-cooper"
            active={isCooperTab}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('cardio.cooperDistanceLabel')}
                </label>
                <AssessmentFieldHintBubble
                  active={isCooperTab}
                  ariaLabel={t('cardio.cooperInfo.infoButtonAria')}
                  tip={t('cardio.cooperInfo.bubbleTip')}
                  footer={t('cardio.cooperInfo.bubbleReferenceHint', {
                    title: t('assessment.referenceInfo.title'),
                  })}
                />
              </div>
              <HeroNumberInput
                inputMode="decimal"
                min={0}
                className="max-w-md"
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
          </AssessmentTabPanel>

          <AssessmentTabPanel
            id="cardio-panel-5km"
            labelledBy="cardio-tab-5km"
            active={isSpecialtyTab}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t('cardio.run5kmHeading')}
            </p>
            <div className="flex min-w-0 flex-wrap gap-2.5">
              <label className="flex min-w-0 flex-col gap-1 text-xs text-zinc-400">
                <span>{t('cardio.minutesLabel')}</span>
                <HeroNumberInput
                  inputMode="numeric"
                  min={0}
                  density="compact"
                  className="w-28 max-w-full"
                  value={runMinutesInput}
                  disabled={revealBlocking}
                  placeholder={t('cardio.run5kmMinutesPlaceholder')}
                  onChange={(e) => {
                    clearError();
                    setRunMinutesInput(e.target.value);
                  }}
                  aria-label={t('cardio.minutesLabel')}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs text-zinc-400">
                <span>{t('cardio.secondsLabel')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="ui-input w-28"
                  value={runSecondsInput}
                  disabled={revealBlocking}
                  placeholder={t('cardio.run5kmSecondsPlaceholder')}
                  onChange={(e) => {
                    clearError();
                    setRunSecondsInput(e.target.value);
                  }}
                  aria-label={t('cardio.secondsLabel')}
                />
              </label>
            </div>
          </AssessmentTabPanel>

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`cardio.errors.${errorKey}`)}
            </p>
          ) : null}

          {previewScore !== null ? (
            <div className="rounded-lg border border-zinc-700 bg-bg-panel/80 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('cardio.previewLabel')}
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
                {heroScoreText ?? previewScore.toFixed(2)}
              </p>
            </div>
          ) : null}

          {previewScore !== null && scoreMeaning ? (
            <section className="relative overflow-hidden rounded-xl border border-accent-info/35 bg-zinc-950/85 p-3.5 shadow-[inset_0_1px_0_rgba(56,189,248,0.2),0_0_28px_rgba(34,211,238,0.12)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/65 to-transparent" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/90">
                {t('cardio.performanceSpecHeader')}
              </p>
              <h3 className="mt-1.5 text-base font-semibold tracking-tight text-zinc-50">
                {scoreMeaning.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{scoreMeaning.summary}</p>
              {scoreMeaning.nextMilestone !== null && scoreMeaning.remainingPoints !== null ? (
                <p className="mt-2.5 border-t border-zinc-800/90 pt-2.5 text-xs font-medium text-cyan-300">
                  {t('cardio.nextMilestoneHint', { points: scoreMeaning.remainingPoints })}
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-3">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              disabled={(isCooperTab && !profileReady) || revealBlocking}
              onClick={() => {
                void revealCalculate();
              }}
            >
              {t('cardio.calculate')}
            </button>
            <button
              type="button"
              className="ui-btn"
              disabled={(isCooperTab && !profileReady) || revealBlocking}
              onClick={submitAssessment}
            >
              {isSpecialtyTab ? t('cardio.submitSpecialty') : t('cardio.submitRadar')}
            </button>
            <Link className="ui-btn inline-flex" to={ROUTES.home}>
              {t('assessment.viewHomeRadar')}
            </Link>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {isSpecialtyTab ? t('cardio.submitDoneSpecialtyOnly') : t('cardio.submitDone')}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar syncController={ladderSync} />

          <AssessmentReferenceFooter>
            {isCooperTab ? (
              <AssessmentReferenceDisclosure
                instanceId="cooper-info"
                expanded={cooperInfoOpen}
                onToggle={() => setCooperInfoOpen((v) => !v)}
              >
                <ReferenceSimpleCopy
                  paragraphs={[
                    t('cardio.cooperInfo.p1'),
                    t('cardio.cooperInfo.p2'),
                    t('cardio.cooperInfo.p3'),
                    t('cardio.cooperInfo.p4'),
                  ]}
                  footnote={t('cardio.cooperInfo.p5')}
                />
              </AssessmentReferenceDisclosure>
            ) : (
              <AssessmentReferenceDisclosure
                instanceId="run5km-info"
                expanded={run5kmInfoOpen}
                onToggle={() => setRun5kmInfoOpen((v) => !v)}
              >
                <ReferenceSimpleCopy
                  paragraphs={[
                    t('cardio.run5kmInfo.p1'),
                    t('cardio.run5kmInfo.p2'),
                    t('cardio.run5kmInfo.p3'),
                  ]}
                  footnote={t('cardio.run5kmInfo.p4')}
                />
              </AssessmentReferenceDisclosure>
            )}
          </AssessmentReferenceFooter>
        </section>
      </ShellFlowStack>
    </main>
  );
};

export default CardioAssessmentPage;
