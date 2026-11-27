import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import AssessmentScoreMeaningPanel from '../components/assessment/AssessmentScoreMeaningPanel';
import HallOfFameSpectrumDrawer from '../components/assessment/HallOfFameSpectrumDrawer';
import {
  AssessmentSegmentedControl,
  AssessmentTabPanel,
} from '../components/assessment/AssessmentSegmentedControl';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import ExplosiveReferencePanel from '../components/assessment/ExplosiveReferencePanel';
import ExplosiveBranchCard from '../components/assessment/ExplosiveBranchCard';
import AssessmentRadarCtaRow from '../components/assessment/AssessmentRadarCtaRow';
import AestheticAxisSummaryTriggerButton from '../components/aesthetic/AestheticAxisSummaryTriggerButton';
import AestheticSingleLeafTriggerButton from '../components/aesthetic/AestheticSingleLeafTriggerButton';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { flushExplosiveDraft } from '../hooks/flushSingleLeafAssessmentDraft';
import { pickHighestExplosiveLeaf } from '../logic/aesthetic/pickHighestExplosiveLeaf';
import UnitSystemToggle from '../components/units/UnitSystemToggle';
import { ROUTES } from '../config/routes';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useHallOfFameSpectrumDrawer } from '../hooks/useHallOfFameSpectrumDrawer';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useExplosiveAssessmentPage } from '../hooks/useExplosiveAssessmentPage';
import type { ExplosiveAssessmentTab } from '../hooks/useExplosiveAssessmentPage';
import { useExplosiveMilestoneHint } from '../hooks/useExplosiveMilestoneHint';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { useUnit } from '../hooks/useUnit';
import { buildExplosiveAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import { parseStrictPositiveMeasurement } from '../logic/core/powerScoring';
import { clampScoreMapValue } from '../logic/core/scoring';
import { useAestheticReportUiStore } from '../stores/aestheticReportUiStore';

const ExplosiveAssessmentPage: FC = () => {
  const { t } = useTranslation('common');
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    profile,
    profileReady,
    activeTab,
    setActiveTab,
    verticalJumpInput,
    setVerticalJumpInput,
    standingLongJumpInput,
    setStandingLongJumpInput,
    sprintInput,
    setSprintInput,
    metricScoringInputs,
    branchMetricInputs,
    previewScore,
    previewBreakdown,
    perBranchResult,
    capNoticeInterpolation,
    powerNormAnchors,
    submitDone,
    errorKey,
    calculateBranch,
    calculate,
    persistToDashboard,
    submitAssessment,
  } = useExplosiveAssessmentPage();
  const { labels, unitSystem, setUnitSystem, displayLength } = useUnit();

  const anchorsFallback = useMemo(() => {
    if (powerNormAnchors) return null;
    return profileReady && profile ? 'age_out_of_range' : 'profile_incomplete';
  }, [powerNormAnchors, profileReady, profile]);

  const ladderUploadBundle = useMemo(
    () =>
      buildExplosiveAssessmentSupplementalTargets({
        verticalJumpInput: metricScoringInputs.verticalJumpInput,
        standingLongJumpInput: metricScoringInputs.standingLongJumpInput,
        sprintInput: metricScoringInputs.sprintInput,
        profile,
        profileReady,
      }),
    [metricScoringInputs, profile, profileReady]
  );

  const ladderSync = useLeaderboardSyncAssessmentPage({
    scope: 'explosivePower',
    uploadBundle: ladderUploadBundle,
  });

  const reveal = useAssessmentRevealFlow({
    pool: 'explosive',
    metric: 'explosivePower',
    scoreDecimals: 2,
    getScore: () => {
      // WHY: Specialty sprint reveal must show ≤200 — same contract as Selfie / ladder upload.
      const unclamped =
        previewScore ??
        (previewBreakdown?.averageRaw != null
          ? previewBreakdown.averageRaw
          : previewBreakdown?.sprintRaw != null
            ? previewBreakdown.sprintRaw
            : null);
      return unclamped != null && Number.isFinite(unclamped)
        ? clampScoreMapValue(unclamped)
        : null;
    },
    hasError: () => errorKey != null || !profileReady,
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

  const genderLabel = !profile
    ? ''
    : profile.gender === 'female'
      ? t('home.profile.female')
      : t('home.profile.male');

  const dash = t('explosive.branchDash');
  const fmtBranch = (v: number | null) =>
    v === null ? dash : clampScoreMapValue(v).toFixed(2);

  const reportLeaf = useMemo(
    () => (previewBreakdown ? pickHighestExplosiveLeaf(previewBreakdown) : null),
    [previewBreakdown]
  );
  const axisCoveredCount = useMemo(() => {
    if (!previewBreakdown) return 0;
    let n = 0;
    if (previewBreakdown.verticalJumpRaw != null && previewBreakdown.verticalJumpRaw > 0) n += 1;
    if (
      previewBreakdown.standingLongJumpRaw != null &&
      previewBreakdown.standingLongJumpRaw > 0
    ) {
      n += 1;
    }
    return n;
  }, [previewBreakdown]);

  const showCapNoticeBlock = profileReady && profile && capNoticeInterpolation != null;
  const isJumpsTab = activeTab === 'jumps';
  const isSpecialtyTab = activeTab === 'sprint';
  const tabDisabled = !profileReady || revealBlocking;

  const segmentOptions = useMemo(
    () => [
      {
        id: 'jumps' as const,
        tabId: 'explosive-tab-jumps',
        panelId: 'explosive-panel-jumps',
        label: t('explosive.tabJumps'),
        badgeLabel: t('explosive.badgeRadarCore'),
        badgeTone: 'core' as const,
        disabled: tabDisabled,
      },
      {
        id: 'sprint' as const,
        tabId: 'explosive-tab-sprint',
        panelId: 'explosive-panel-sprint',
        label: t('explosive.tabSprint'),
        badgeLabel: t('explosive.badgeSpecialtyOptional'),
        badgeTone: 'specialty' as const,
        disabled: tabDisabled,
      },
    ],
    [t, tabDisabled]
  );

  const hasRadarAxisPreview =
    previewBreakdown != null &&
    previewBreakdown.averageRaw != null &&
    Number.isFinite(previewBreakdown.averageRaw);
  // WHY: One clamped axis score for hero / hall / axis-summary / details — matches ladder ≤200.
  const axisAverageRaw =
    hasRadarAxisPreview && previewBreakdown!.averageRaw != null
      ? clampScoreMapValue(previewBreakdown!.averageRaw)
      : null;
  const interpretationScore = previewScore ?? axisAverageRaw;
  const heroScore = displayScore ?? interpretationScore;
  const scoreMeaning = useScoreMeaning('explosivePower', heroScore);
  const nextMilestoneHint = useExplosiveMilestoneHint(
    scoreMeaning,
    {
      verticalJumpInput: metricScoringInputs.verticalJumpInput,
      standingLongJumpInput: metricScoringInputs.standingLongJumpInput,
    },
    profile,
    profileReady
  );
  const hallSpectrum = useHallOfFameSpectrumDrawer({
    axisId: 'explosivePower',
    scoreDisplay: heroScore != null ? heroScore.toFixed(2) : null,
    decadeKey: scoreMeaning?.decadeKey,
    populationClass: scoreMeaning?.populationClass,
    onBeforeOpenDyno: closeModal,
  });
  const isSpecialtyOnlyPreview =
    previewBreakdown != null &&
    previewBreakdown.sprintRaw != null &&
    !hasRadarAxisPreview;

  const openWithLeaf = useAestheticReportUiStore((s) => s.openWithLeaf);
  const openWithAxisSummary = useAestheticReportUiStore((s) => s.openWithAxisSummary);

  const flushExplosiveForReport = () => {
    // metricScoringInputs are already metric (cm / s) — do not re-project units.
    flushExplosiveDraft({
      tab: activeTab,
      verticalJumpCm: parseStrictPositiveMeasurement(metricScoringInputs.verticalJumpInput),
      standingLongJumpCm: parseStrictPositiveMeasurement(
        metricScoringInputs.standingLongJumpInput
      ),
      sprintSeconds: parseStrictPositiveMeasurement(metricScoringInputs.sprintInput),
      profile,
    });
  };

  const openExplosiveAxisSummary = () => {
    if (axisAverageRaw == null || !Number.isFinite(axisAverageRaw) || axisCoveredCount <= 0) {
      return;
    }
    flushExplosiveForReport();
    closeModal();
    openWithAxisSummary('explosivePower', {
      heroScore: axisAverageRaw,
      coveredCount: axisCoveredCount,
    });
  };

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="explosive" />
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
        onGenerateSingleLeafReport={
          hasRadarAxisPreview && axisAverageRaw != null && axisCoveredCount > 0
            ? () => openExplosiveAxisSummary()
            : reportLeaf && isSpecialtyOnlyPreview
              ? () => {
                  flushExplosiveForReport();
                  closeModal();
                  openWithLeaf(reportLeaf);
                }
              : undefined
        }
      />
      <HallOfFameSpectrumDrawer {...hallSpectrum.drawerProps} />
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-5">
        <AssessmentPageHeader
          kicker={t('explosive.kicker')}
          title={t('explosive.title')}
          meta={
            profileReady && profile ? (
              <p className="text-xs text-zinc-500">
                <span className="mr-3">{t('explosive.metaAge', { value: profile.age })}</span>
                <span>{t('explosive.metaGender', { value: genderLabel })}</span>
              </p>
            ) : null
          }
        />

        {!profileReady ? (
          <section
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90"
            role="status"
          >
            <p>{t('explosive.profileIncompleteHint')}</p>
            <Link className="mt-2 inline-block text-accent-info underline" to={ROUTES.home}>
              {t('explosive.ctaProfile')}
            </Link>
          </section>
        ) : null}

        <section className="space-y-3.5 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 shadow-panel backdrop-blur sm:p-5">
          {/*
            WHY: Unit toggle sits as a micro top-right strip (~32px) so the segmented track
            keeps full width for label+badge on ~390px — avoids wrap that orphaned the toggle.
          */}
          <div className="-mb-1 flex justify-end">
            <UnitSystemToggle value={unitSystem} onChange={setUnitSystem} compact />
          </div>

          <AssessmentSegmentedControl<ExplosiveAssessmentTab>
            value={activeTab}
            options={segmentOptions}
            onChange={setActiveTab}
            ariaLabel={t('explosive.tabsAria')}
          />

          <AssessmentTabPanel
            id="explosive-panel-jumps"
            labelledBy="explosive-tab-jumps"
            active={isJumpsTab}
          >
            <div className="space-y-3">
              <ExplosiveBranchCard
                branch="verticalJump"
                value={verticalJumpInput}
                lengthUnit={labels.length}
                metricValue={branchMetricInputs.verticalJumpInput}
                profile={profile}
                profileReady={profileReady}
                inputsDisabled={tabDisabled}
                result={perBranchResult.verticalJump}
                onChange={setVerticalJumpInput}
                onCalculate={() => calculateBranch('verticalJump')}
              />
              <ExplosiveBranchCard
                branch="standingLongJump"
                value={standingLongJumpInput}
                lengthUnit={labels.length}
                metricValue={branchMetricInputs.standingLongJumpInput}
                profile={profile}
                profileReady={profileReady}
                inputsDisabled={tabDisabled}
                result={perBranchResult.standingLongJump}
                onChange={setStandingLongJumpInput}
                onCalculate={() => calculateBranch('standingLongJump')}
              />
            </div>
          </AssessmentTabPanel>

          <AssessmentTabPanel
            id="explosive-panel-sprint"
            labelledBy="explosive-tab-sprint"
            active={isSpecialtyTab}
          >
            <ExplosiveBranchCard
              branch="sprint"
              value={sprintInput}
              metricValue={branchMetricInputs.sprintInput}
              profile={profile}
              profileReady={profileReady}
              inputsDisabled={tabDisabled}
              result={perBranchResult.sprint}
              onChange={setSprintInput}
              onCalculate={() => calculateBranch('sprint')}
            />
          </AssessmentTabPanel>

          {showCapNoticeBlock ? (
            <div
              className="space-y-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-50">{t('explosive.capNoticeTitle')}</p>
              {isJumpsTab && capNoticeInterpolation.maxVerticalJumpCm != null ? (
                <p className="leading-relaxed">
                  {t('explosive.capVerticalJump', {
                    max: Number(displayLength(capNoticeInterpolation.maxVerticalJumpCm).toFixed(1)),
                    unit: labels.length,
                  })}
                </p>
              ) : null}
              {isJumpsTab && capNoticeInterpolation.maxStandingLongJumpCm != null ? (
                <p className="leading-relaxed">
                  {t('explosive.capStandingLongJump', {
                    max: Number(
                      displayLength(capNoticeInterpolation.maxStandingLongJumpCm).toFixed(1)
                    ),
                    unit: labels.length,
                  })}
                </p>
              ) : null}
              {isSpecialtyTab && capNoticeInterpolation.sprint100mFloorSeconds != null ? (
                <p className="leading-relaxed">
                  {t('explosive.capSprint100m', {
                    min: capNoticeInterpolation.sprint100mFloorSeconds,
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`explosive.errors.${errorKey}`, { unit: labels.length })}
            </p>
          ) : null}

          {previewBreakdown ? (
            <div className="space-y-3">
              {hasRadarAxisPreview &&
              axisAverageRaw != null &&
              heroScore !== null &&
              scoreMeaning &&
              !isSpecialtyOnlyPreview ? (
                <AssessmentScoreMeaningPanel
                  meaning={scoreMeaning}
                  milestoneHintLabel={nextMilestoneHint}
                  hallEntry={hallSpectrum.headerActionProps}
                  hero={{
                    scoreText: heroScore.toFixed(2),
                    populationClass: scoreMeaning.populationClass,
                    decadeKey: scoreMeaning.decadeKey,
                    ...hallSpectrum.badgeProps,
                  }}
                />
              ) : null}

              {hasRadarAxisPreview && axisAverageRaw != null ? (
                <DisclosurePanel
                  instanceId="explosive-calc-details"
                  expanded={detailsOpen}
                  onToggle={() => setDetailsOpen((v) => !v)}
                  toggleExpandLabel={t('assessment.viewCalculationDetails')}
                  toggleCollapseLabel={t('assessment.hideCalculationDetails')}
                  variant="link"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      {t('explosive.branchScoresHeading')}
                    </p>
                    <ul className="space-y-1 text-sm text-zinc-300">
                      <li className="flex justify-between gap-4 font-mono tabular-nums">
                        <span className="text-zinc-400">
                          {t('explosive.branchVerticalJumpShort')}
                        </span>
                        <span>{fmtBranch(previewBreakdown.verticalJumpRaw)}</span>
                      </li>
                      <li className="flex justify-between gap-4 font-mono tabular-nums">
                        <span className="text-zinc-400">
                          {t('explosive.branchStandingLongJumpShort')}
                        </span>
                        <span>{fmtBranch(previewBreakdown.standingLongJumpRaw)}</span>
                      </li>
                    </ul>
                    <div className="border-t border-zinc-800/80 pt-2">
                      <p className="text-xs text-zinc-400">{t('explosive.averageRawLabel')}</p>
                      <p
                        className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100"
                        data-testid="explosive-axis-average-raw"
                      >
                        {axisAverageRaw.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </DisclosurePanel>
              ) : null}

              {previewBreakdown.sprintRaw != null ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-200/70">
                    {t('explosive.specialtyScoresHeading')}
                  </p>
                  <div className="flex justify-between gap-4 font-mono text-sm tabular-nums text-zinc-300">
                    <span className="text-zinc-400">{t('explosive.branchSprintShort')}</span>
                    <span>{fmtBranch(previewBreakdown.sprintRaw)}</span>
                  </div>
                  {isSpecialtyOnlyPreview ? (
                    <p className="text-xs text-amber-100/80">{t('explosive.previewSpecialtyOnly')}</p>
                  ) : null}
                </div>
              ) : null}

            </div>
          ) : null}

          <AssessmentRadarCtaRow
            hasScore={heroScore !== null}
            disabled={tabDisabled}
            onClick={() => {
              void revealCalculate();
            }}
            secondary={
              reportLeaf && isSpecialtyOnlyPreview ? (
                <AestheticSingleLeafTriggerButton
                  leaf={reportLeaf}
                  disabled={tabDisabled}
                  onBeforeOpen={flushExplosiveForReport}
                />
              ) : hasRadarAxisPreview &&
                !isSpecialtyOnlyPreview &&
                axisAverageRaw != null &&
                axisCoveredCount > 0 ? (
                <AestheticAxisSummaryTriggerButton
                  axis="explosivePower"
                  heroScore={axisAverageRaw}
                  coveredCount={axisCoveredCount}
                  disabled={tabDisabled}
                  onBeforeOpen={flushExplosiveForReport}
                />
              ) : null
            }
            status={
              submitDone ? (
                <p className="text-sm text-accent-info" role="status">
                  {isSpecialtyTab || isSpecialtyOnlyPreview
                    ? t('explosive.submitDoneSpecialtyOnly')
                    : t('explosive.submitDone')}
                </p>
              ) : null
            }
          />

          <AssessmentReferenceFooter>
            <AssessmentReferenceDisclosure
              instanceId="explosive-reference"
              expanded={referenceOpen}
              onToggle={() => setReferenceOpen((v) => !v)}
            >
              <ExplosiveReferencePanel
                powerNormAnchors={powerNormAnchors}
                anchorsFallback={anchorsFallback}
              />
            </AssessmentReferenceDisclosure>
          </AssessmentReferenceFooter>
        </section>
      </ShellFlowStack>
    </main>
  );
};

export default ExplosiveAssessmentPage;
