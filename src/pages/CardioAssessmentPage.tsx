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
import HallOfFameSpectrumDrawer from '../components/assessment/HallOfFameSpectrumDrawer';
import AssessmentScoreMeaningPanel from '../components/assessment/AssessmentScoreMeaningPanel';
import { ROUTES } from '../config/routes';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import { ReferenceSimpleCopy } from '../components/assessment/AssessmentReferenceProse';
import { Run5KmSpecReferencePanel } from '../components/assessment/Run5KmSpecReferencePanel';
import AssessmentWriteToRadarButton from '../components/assessment/AssessmentWriteToRadarButton';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useHallOfFameSpectrumDrawer } from '../hooks/useHallOfFameSpectrumDrawer';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useAerobicMilestoneHint } from '../hooks/useAerobicMilestoneHint';
import { useCardioAssessmentPage } from '../hooks/useCardioAssessmentPage';
import type { CardioTab } from '../hooks/useCardioAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { formatRun5KmFloorClock } from '../logic/core/cardioScoring';
import { scoreMeaningMetricForCardioTab } from '../logic/core/scoreMeaningCatalog';
import { buildCardioAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import { loadPhysicalProfile } from '../services/localStorageService';

const CardioAssessmentPage: FC = () => {
  const { t } = useTranslation('common');
  const [cooperInfoOpen, setCooperInfoOpen] = useState(false);
  const [run5kmInfoOpen, setRun5kmInfoOpen] = useState(false);
  const {
    profile,
    profileReady,
    cooperDistanceOverCap,
    cooperCapMeters,
    run5KmTimeUnderFloor,
    run5KmFloorSeconds,
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
  const run5KmFloorClock = formatRun5KmFloorClock(run5KmFloorSeconds);
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
  const nextMilestoneHint = useAerobicMilestoneHint(
    scoreMeaning,
    activeTab,
    distanceInput,
    runMinutesInput,
    runSecondsInput,
    profile,
    profileReady
  );
  const hallSpectrum = useHallOfFameSpectrumDrawer({
    axisId: 'cardio',
    // WHY: 5km specialty is not the radar cardio pantheon cell — hide Hall Spectrum on that tab.
    scoreDisplay:
      activeTab === 'cooper'
        ? heroScoreText ?? (previewScore != null ? previewScore.toFixed(2) : null)
        : null,
    decadeKey: activeTab === 'cooper' ? scoreMeaning?.decadeKey : null,
    populationClass: activeTab === 'cooper' ? scoreMeaning?.populationClass : null,
    onBeforeOpenDyno: closeModal,
  });

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
        milestoneHintLabel={nextMilestoneHint}
        onOpenHallSpectrum={hallSpectrum.canOpen ? hallSpectrum.openDrawer : undefined}
        spectrumOverlayOpen={hallSpectrum.drawerProps.open}
      />
      <HallOfFameSpectrumDrawer {...hallSpectrum.drawerProps} />
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
              // WHY: Close the other tab's disclosure so expanded science copy never leaks across panels.
              if (tab === '5km') setCooperInfoOpen(false);
              if (tab === 'cooper') setRun5kmInfoOpen(false);
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
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t('cardio.run5kmHeading')}
                </label>
                <AssessmentFieldHintBubble
                  active={isSpecialtyTab}
                  ariaLabel={t('cardio.run5kmInfo.infoButtonAria')}
                  tip={t('cardio.run5kmInfo.bubbleTip')}
                  footer={t('cardio.run5kmInfo.bubbleReferenceHint', {
                    title: t('assessment.referenceInfo.title'),
                  })}
                />
              </div>

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

              {run5KmTimeUnderFloor ? (
                <p
                  className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90"
                  role="status"
                >
                  {t('cardio.run5kmWorldRecordFloorHint', {
                    capTime: run5KmFloorClock,
                  })}
                </p>
              ) : null}
            </div>
          </AssessmentTabPanel>

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`cardio.errors.${errorKey}`)}
            </p>
          ) : null}

          {previewScore !== null && scoreMeaning ? (
            <AssessmentScoreMeaningPanel
              tone="cyan"
              meaning={scoreMeaning}
              milestoneHintLabel={nextMilestoneHint}
              hallEntry={hallSpectrum.headerActionProps}
              hero={{
                scoreText: heroScoreText ?? previewScore.toFixed(2),
                populationClass: scoreMeaning.populationClass,
                decadeKey: scoreMeaning.decadeKey,
                ...hallSpectrum.badgeProps,
              }}
            />
          ) : null}

          <div className="space-y-3">
            <AssessmentWriteToRadarButton
              axisLabel={t('assessment.axis.cardio')}
              hasScore={previewScore !== null}
              disabled={(isCooperTab && !profileReady) || revealBlocking}
              onClick={() => {
                void revealCalculate();
              }}
            />

            {submitDone ? (
              <p className="text-sm text-accent-info" role="status">
                {isSpecialtyTab ? t('cardio.submitDoneSpecialtyOnly') : t('cardio.submitDone')}
              </p>
            ) : null}
          </div>

          {/* WHY: Scheme C keeps the form clean — scoring anchors live in the shared collapsible footer. */}
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
                <Run5KmSpecReferencePanel />
              </AssessmentReferenceDisclosure>
            )}
          </AssessmentReferenceFooter>
        </section>
      </ShellFlowStack>
    </main>
  );
};

export default CardioAssessmentPage;
