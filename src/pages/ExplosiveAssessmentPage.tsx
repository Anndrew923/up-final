import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import AssessmentScoreMeaningPanel from '../components/assessment/AssessmentScoreMeaningPanel';
import {
  AssessmentSegmentedControl,
  AssessmentTabPanel,
} from '../components/assessment/AssessmentSegmentedControl';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import ExplosiveReferencePanel from '../components/assessment/ExplosiveReferencePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import UnitSystemToggle from '../components/units/UnitSystemToggle';
import { ROUTES } from '../config/routes';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useExplosiveAssessmentPage } from '../hooks/useExplosiveAssessmentPage';
import type { ExplosiveAssessmentTab } from '../hooks/useExplosiveAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { useUnit } from '../hooks/useUnit';
import { buildExplosiveAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';

export interface ExplosiveAssessmentPageProps {
  onBack?: () => void;
}

const ExplosiveAssessmentPage: FC<ExplosiveAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const [referenceOpen, setReferenceOpen] = useState(false);

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
    previewScore,
    previewBreakdown,
    capNoticeInterpolation,
    powerNormAnchors,
    submitDone,
    errorKey,
    clearError,
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
    getScore: () =>
      previewScore ??
      (previewBreakdown?.averageRaw != null
        ? previewBreakdown.averageRaw
        : previewBreakdown?.sprintRaw != null
          ? previewBreakdown.sprintRaw
          : null),
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
  const fmtBranch = (v: number | null) => (v === null ? dash : v.toFixed(2));

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
  const axisAverageRaw = hasRadarAxisPreview ? previewBreakdown!.averageRaw : null;
  const interpretationScore = previewScore ?? axisAverageRaw;
  const heroScore = displayScore ?? interpretationScore;
  const scoreMeaning = useScoreMeaning('explosivePower', heroScore);
  const isSpecialtyOnlyPreview =
    previewBreakdown != null &&
    previewBreakdown.sprintRaw != null &&
    !hasRadarAxisPreview;

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
      />
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-5">
        <AssessmentPageHeader
          kicker={t('explosive.kicker')}
          title={t('explosive.title')}
          onBack={onBack}
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

        {profileReady && profile ? (
          <p className="text-xs text-zinc-500">
            <span className="mr-3">{t('explosive.metaAge', { value: profile.age })}</span>
            <span>{t('explosive.metaGender', { value: genderLabel })}</span>
          </p>
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
            <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="exp-vj">
              <span className="font-medium text-zinc-200">
                {t('explosive.verticalJumpLabel', { unit: labels.length })}
              </span>
              <input
                id="exp-vj"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                className="ui-input max-w-xs"
                placeholder={t('explosive.verticalJumpPlaceholder')}
                value={verticalJumpInput}
                disabled={tabDisabled}
                onChange={(e) => {
                  clearError();
                  setVerticalJumpInput(e.target.value);
                }}
                aria-label={t('explosive.verticalJumpLabel', { unit: labels.length })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="exp-slj">
              <span className="font-medium text-zinc-200">
                {t('explosive.standingLongJumpLabel', { unit: labels.length })}
              </span>
              <input
                id="exp-slj"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                className="ui-input max-w-xs"
                placeholder={t('explosive.standingLongJumpPlaceholder')}
                value={standingLongJumpInput}
                disabled={tabDisabled}
                onChange={(e) => {
                  clearError();
                  setStandingLongJumpInput(e.target.value);
                }}
                aria-label={t('explosive.standingLongJumpLabel', { unit: labels.length })}
              />
            </label>
          </AssessmentTabPanel>

          <AssessmentTabPanel
            id="explosive-panel-sprint"
            labelledBy="explosive-tab-sprint"
            active={isSpecialtyTab}
          >
            <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="exp-sprint">
              <span className="font-medium text-zinc-200">{t('explosive.sprintLabel')}</span>
              {/*
                WHY type=text: specialty placeholder carries locale prose; number inputs truncate it.
              */}
              <input
                id="exp-sprint"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="ui-input max-w-md"
                placeholder={t('explosive.sprintPlaceholder')}
                value={sprintInput}
                disabled={tabDisabled}
                onChange={(e) => {
                  clearError();
                  setSprintInput(e.target.value);
                }}
                aria-label={t('explosive.sprintLabel')}
              />
            </label>
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
            <div className="space-y-2 rounded-lg border border-zinc-700 bg-bg-panel/80 px-3 py-2.5">
              {hasRadarAxisPreview && axisAverageRaw != null ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    {t('explosive.branchScoresHeading')}
                  </p>
                  <ul className="space-y-1 text-sm text-zinc-300">
                    <li className="flex justify-between gap-4 font-mono tabular-nums">
                      <span className="text-zinc-400">{t('explosive.branchVerticalJumpShort')}</span>
                      <span>{fmtBranch(previewBreakdown.verticalJumpRaw)}</span>
                    </li>
                    <li className="flex justify-between gap-4 font-mono tabular-nums">
                      <span className="text-zinc-400">
                        {t('explosive.branchStandingLongJumpShort')}
                      </span>
                      <span>{fmtBranch(previewBreakdown.standingLongJumpRaw)}</span>
                    </li>
                  </ul>
                  <div className="border-t border-zinc-700/80 pt-2">
                    <p className="text-xs text-zinc-400">{t('explosive.averageRawLabel')}</p>
                    <p className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100">
                      {axisAverageRaw.toFixed(2)}
                    </p>
                  </div>
                  <div className="border-t border-zinc-700/80 pt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      {t('explosive.previewLabel')}
                    </p>
                    <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
                      {(heroScore ?? axisAverageRaw).toFixed(2)}
                    </p>
                  </div>
                </>
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

          {heroScore !== null && scoreMeaning && !isSpecialtyOnlyPreview ? (
            <AssessmentScoreMeaningPanel
              tone="amber"
              headerLabel={t('explosive.performanceSpecHeader')}
              meaning={scoreMeaning}
              milestoneHintLabel={
                scoreMeaning.remainingPoints != null
                  ? t('explosive.nextMilestoneHint', { points: scoreMeaning.remainingPoints })
                  : null
              }
            />
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 pt-3">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              disabled={tabDisabled}
              onClick={() => {
                void revealCalculate();
              }}
            >
              {t('explosive.calculate')}
            </button>
            <button
              type="button"
              className="ui-btn"
              disabled={tabDisabled}
              onClick={submitAssessment}
            >
              {isSpecialtyTab ? t('explosive.submitSpecialty') : t('explosive.submitRadar')}
            </button>
            <Link className="ui-btn inline-flex" to={ROUTES.home}>
              {t('assessment.viewHomeRadar')}
            </Link>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {isSpecialtyTab || isSpecialtyOnlyPreview
                ? t('explosive.submitDoneSpecialtyOnly')
                : t('explosive.submitDone')}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar syncController={ladderSync} />

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
