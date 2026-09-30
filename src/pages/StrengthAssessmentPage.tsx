import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import { ReferenceSimpleCopy } from '../components/assessment/AssessmentReferenceProse';
import { DisclosurePanel } from '../components/DisclosurePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import HexRadarChart from '../components/radar/HexRadarChart';
import UnitSystemToggle from '../components/units/UnitSystemToggle';
import { ROUTES } from '../config/routes';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import AssessmentHeroScoreWithNormBadge from '../components/assessment/AssessmentHeroScoreWithNormBadge';
import HallOfFameSpectrumDrawer from '../components/assessment/HallOfFameSpectrumDrawer';
import StrengthLiftCard from '../components/strength/StrengthLiftCard';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useHallOfFameSpectrumDrawer } from '../hooks/useHallOfFameSpectrumDrawer';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { useStrengthAssessmentPage } from '../hooks/useStrengthAssessmentPage';
import { useUnit } from '../hooks/useUnit';
import { buildStrengthAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import type { FormatUnitOptions } from '../logic/core/unitConverters';
import { STRENGTH_LIFT_KEYS, type StrengthLiftKey } from '../types/strengthInputs';

function fmtBranchLine(
  t: (key: string, opts?: Record<string, string | number>) => string,
  b: { weightKg: number; reps: number; oneRepMax: number; finalScore: number },
  formatWeight: (kg: number, options?: FormatUnitOptions) => string,
  unit: string
): string {
  return t('strength.branchLine', {
    weight: formatWeight(b.weightKg, { includeUnit: false, digits: 1 }),
    reps: b.reps,
    oneRm: formatWeight(b.oneRepMax, { includeUnit: false, digits: 1 }),
    score: b.finalScore.toFixed(2),
    unit,
  });
}

const StrengthAssessmentPage: FC = () => {
  const { t } = useTranslation('common');
  const { labels, formatWeight, unitSystem, setUnitSystem } = useUnit();
  const [howToOpen, setHowToOpen] = useState(false);
  const [combinedDetailsOpen, setCombinedDetailsOpen] = useState(false);
  const {
    profile,
    profileReady,
    form,
    metricForm,
    setWeight,
    setReps,
    perLiftResult,
    perLiftError,
    calculateLift,
    isLiftArmed,
    isLiftLocked,
    combinedScore,
    combinedBreakdown,
    combinedError,
    strengthRadarPoints,
    calculateCombined,
    submitBusy,
    submitNotice,
    submitDone,
    persistToDashboard,
    submitToRadar,
  } = useStrengthAssessmentPage();
  const reveal = useAssessmentRevealFlow({
    pool: 'strength',
    metric: 'strength',
    scoreDecimals: 2,
    getScore: () => combinedScore ?? combinedBreakdown?.averageRaw ?? null,
    hasError: () => combinedError != null,
    compute: calculateCombined,
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

  const ladderUploadBundle = useMemo(
    () =>
      buildStrengthAssessmentSupplementalTargets({
        form: metricForm,
        profile,
        profileReady,
        combinedScore,
      }),
    [metricForm, profile, profileReady, combinedScore]
  );

  const ladderSync = useLeaderboardSyncAssessmentPage({
    scope: 'strength',
    uploadBundle: ladderUploadBundle,
  });

  const liveScore = combinedScore ?? combinedBreakdown?.averageRaw ?? null;
  const interpretationScore = displayScore ?? liveScore;
  const heroScoreText =
    interpretationScore != null && Number.isFinite(interpretationScore)
      ? interpretationScore.toFixed(2)
      : null;
  const scoreMeaning = useScoreMeaning('strength', liveScore ?? interpretationScore);
  const hallSpectrum = useHallOfFameSpectrumDrawer({
    axisId: 'strength',
    scoreDisplay:
      heroScoreText ??
      (combinedBreakdown != null ? combinedBreakdown.averageRaw.toFixed(2) : null),
    decadeKey: scoreMeaning?.decadeKey,
    populationClass: scoreMeaning?.populationClass,
  });

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="strength" />
      {/* WHY: Breakthrough modal stays points-only for composite; no milestoneHintLabel. */}
      <PerformanceBreakthroughModal
        open={modalOpen}
        payload={modalPayload}
        onClose={closeModal}
        onSyncToDashboard={submitToRadar}
        onPersistToDashboard={persistToDashboard}
        syncDisabled={!profileReady}
        syncing={submitBusy}
        arenaSync={ladderSync}
      />
      <HallOfFameSpectrumDrawer {...hallSpectrum.drawerProps} />
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-8">
        <AssessmentPageHeader
          kicker={t('strength.kicker')}
          title={t('strength.title')}
          meta={
            profileReady && profile ? (
              <p className="text-xs text-zinc-500">
                <span className="mr-3">
                  {t('strength.metaWeight', {
                    value: formatWeight(profile.weightKg, { includeUnit: false, digits: 1 }),
                    unit: labels.weight,
                  })}
                </span>
                <span className="mr-3">{t('strength.metaAge', { value: profile.age })}</span>
                <span>{t('strength.metaGender', { value: genderLabel })}</span>
              </p>
            ) : null
          }
        />

        {!profileReady ? (
          <section
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90"
            role="status"
          >
            <p>{t('strength.profileIncompleteHint')}</p>
            <Link className="mt-3 inline-block text-accent-info underline" to={ROUTES.home}>
              {t('strength.ctaProfile')}
            </Link>
          </section>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 shadow-panel backdrop-blur sm:p-5">
          <div className="flex justify-end">
            <UnitSystemToggle value={unitSystem} onChange={setUnitSystem} compact />
          </div>
          <div className="grid gap-3">
            {STRENGTH_LIFT_KEYS.map((lift: StrengthLiftKey) => (
              <StrengthLiftCard
                key={lift}
                lift={lift}
                weightUnit={labels.weight}
                weightValue={form[lift].weight}
                repsValue={form[lift].reps}
                metricWeight={metricForm[lift].weight}
                metricReps={metricForm[lift].reps}
                profileReady={profileReady}
                inputsDisabled={revealBlocking}
                isArmed={isLiftArmed(lift)}
                isLocked={isLiftLocked(lift)}
                result={perLiftResult[lift]}
                error={perLiftError[lift]}
                profile={profile}
                onWeightChange={(value) => setWeight(lift, value)}
                onRepsChange={(value) => setReps(lift, value)}
                onCalculate={() => calculateLift(lift)}
                formatWeight={formatWeight}
              />
            ))}
          </div>

          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-200">
              {t('strength.combinedSectionTitle')}
            </h2>

            {combinedError ? (
              <p className="text-sm text-red-400" role="alert">
                {t(`strength.errors.${combinedError}`, { unit: labels.weight })}
              </p>
            ) : null}

            {combinedBreakdown ? (
              <div className="space-y-3 rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
                <div className="border-t border-zinc-700/80 pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    {t('strength.spectrumKicker')}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {t('strength.spectrumSub')}
                  </p>
                  <HexRadarChart
                    points={strengthRadarPoints}
                    scaleMax={100}
                    className="mx-auto mt-2 w-full max-w-[240px] shrink-0"
                    aria-label={t('strength.radarAria')}
                  />
                </div>
                <div className="border-t border-zinc-700/80 pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    {t('strength.previewLabel')}
                  </p>
                  <AssessmentHeroScoreWithNormBadge
                    scoreText={heroScoreText ?? combinedBreakdown.averageRaw.toFixed(2)}
                    populationClass={scoreMeaning?.populationClass}
                    decadeKey={scoreMeaning?.decadeKey}
                    className="mt-1"
                    {...hallSpectrum.badgeProps}
                  />
                  {combinedScore !== null &&
                  Math.abs(combinedScore - combinedBreakdown.averageRaw) > 0.001 ? (
                    <p className="mt-1 text-xs text-zinc-500">{t('strength.radarClampNote')}</p>
                  ) : null}
                </div>
                <div className="border-t border-zinc-700/80 pt-3">
                  <DisclosurePanel
                    instanceId="strength-combined-details"
                    expanded={combinedDetailsOpen}
                    onToggle={() => setCombinedDetailsOpen((v) => !v)}
                    title={t('strength.combinedDetailsTitle')}
                    toggleExpandLabel={t('strength.combinedDetailsExpand')}
                    toggleCollapseLabel={t('strength.combinedDetailsCollapse')}
                    panelBodyClassName="space-y-3 px-4 pb-4 pt-3"
                  >
                    <ul className="space-y-2 text-sm text-zinc-300">
                      {combinedBreakdown.branches.map((b) => (
                        <li
                          key={b.lift}
                          className="flex flex-col gap-1 border-b border-zinc-800/80 pb-2 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="text-zinc-400">{t(`strength.lifts.${b.lift}`)}</span>
                            {b.weightCapped && b.inputWeightKg != null && b.modelMaxKg != null ? (
                              <p className="text-[11px] leading-relaxed text-amber-100/90">
                                {t('strength.capWeightNotice', {
                                  lift: t(`strength.lifts.${b.lift}`),
                                  input: formatWeight(b.inputWeightKg, {
                                    includeUnit: false,
                                    digits: 1,
                                  }),
                                  max: formatWeight(b.modelMaxKg, {
                                    includeUnit: false,
                                    digits: 1,
                                  }),
                                  unit: labels.weight,
                                })}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-200 sm:text-right">
                            {fmtBranchLine(t, b, formatWeight, labels.weight)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-zinc-400">{t('strength.averageRawLabel')}</p>
                    <p className="font-mono text-lg tabular-nums text-zinc-100">
                      {combinedBreakdown.averageRaw.toFixed(2)}
                    </p>
                  </DisclosurePanel>
                </div>
              </div>
            ) : null}

            {/* WHY: Composite average stays points-only — raw Δkg lives on per-lift cards only. */}
            {combinedBreakdown && scoreMeaning ? (
              <section className="relative overflow-hidden rounded-xl border border-orange-400/35 bg-zinc-950/85 p-4 shadow-[inset_0_1px_0_rgba(251,146,60,0.22),0_0_30px_rgba(249,115,22,0.16)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-300/90">
                  {t('strength.performanceSpecHeader')}
                </p>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">
                  {scoreMeaning.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{scoreMeaning.summary}</p>
                {scoreMeaning.nextMilestone !== null && scoreMeaning.remainingPoints !== null ? (
                  <p className="mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium text-orange-300">
                    {t('strength.nextMilestoneHint', { points: scoreMeaning.remainingPoints })}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                disabled={!profileReady || submitBusy || revealBlocking}
                onClick={() => {
                  void revealCalculate();
                }}
              >
                {t('strength.calculateCombined')}
              </button>
              <button
                type="button"
                className="ui-btn"
                disabled={!profileReady || submitBusy || revealBlocking}
                onClick={() => {
                  void submitToRadar();
                }}
              >
                {submitBusy ? t('strength.submitRadarBusy') : t('strength.submitRadar')}
              </button>
            </div>

            {submitNotice?.kind === 'success' && submitDone ? (
              <p className="text-sm text-accent-info" role="status">
                {t('strength.submitDoneWithScore', {
                  score: (submitNotice.savedScore ?? combinedScore ?? 0).toFixed(2),
                })}
              </p>
            ) : null}
            {submitNotice?.kind === 'error' ? (
              <p
                className="text-sm text-amber-300 transition-opacity duration-300 ease-out"
                role="status"
              >
                {t('strength.submitFailedWithReason', {
                  reason: t(`strength.errors.${submitNotice.error ?? 'no-inputs'}`, {
                    unit: labels.weight,
                  }),
                })}
              </p>
            ) : null}

            <LeaderboardAssessmentSyncBar syncController={ladderSync} />
          </div>

          <AssessmentReferenceFooter>
            <AssessmentReferenceDisclosure
              instanceId="strength-howto"
              expanded={howToOpen}
              onToggle={() => setHowToOpen((v) => !v)}
            >
              <ReferenceSimpleCopy
                paragraphs={[
                  t('strength.howToInfo.intro'),
                  t('strength.howToInfo.reps'),
                  t('strength.howToInfo.repsAccuracy'),
                  t('strength.fieldsHint'),
                  t('strength.howToInfo.combinedRule'),
                ]}
                footnote={t('strength.howToInfo.tip')}
              />
            </AssessmentReferenceDisclosure>
          </AssessmentReferenceFooter>
        </section>
      </ShellFlowStack>
    </main>
  );
};

export default StrengthAssessmentPage;
