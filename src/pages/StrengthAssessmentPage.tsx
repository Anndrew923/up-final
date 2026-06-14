import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentReferenceDisclosure from '../components/assessment/AssessmentReferenceDisclosure';
import { ReferenceSimpleCopy } from '../components/assessment/AssessmentReferenceProse';
import { DisclosurePanel } from '../components/DisclosurePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import HexRadarChart from '../components/radar/HexRadarChart';
import { ROUTES } from '../config/routes';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { useStrengthAssessmentPage } from '../hooks/useStrengthAssessmentPage';
import { buildStrengthAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import {
  shouldShowStrengthRepsAccuracyNudge,
  STRENGTH_ASSESSMENT_MAX_REPS,
  type StrengthSingleLiftError,
} from '../logic/core/strengthAssessment';
import { STRENGTH_LIFT_KEYS, type StrengthLiftKey } from '../types/strengthInputs';

export interface StrengthAssessmentPageProps {
  onBack?: () => void;
}

function fmtBranchLine(
  t: (key: string, opts?: Record<string, string | number>) => string,
  b: { weightKg: number; reps: number; oneRepMax: number; finalScore: number }
): string {
  return t('strength.branchLine', {
    weight: b.weightKg,
    reps: b.reps,
    oneRm: b.oneRepMax.toFixed(2),
    score: b.finalScore.toFixed(2),
  });
}

const StrengthAssessmentPage: FC<StrengthAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const [howToOpen, setHowToOpen] = useState(false);
  const [combinedDetailsOpen, setCombinedDetailsOpen] = useState(false);
  const {
    profile,
    profileReady,
    form,
    setWeight,
    setReps,
    perLiftResult,
    perLiftError,
    calculateLift,
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

  const singleErr = (code: StrengthSingleLiftError) => t(`strength.singleErrors.${code}`);
  const ladderUploadBundle = useMemo(
    () =>
      buildStrengthAssessmentSupplementalTargets({
        form,
        profile,
        profileReady,
        combinedScore,
      }),
    [form, profile, profileReady, combinedScore]
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

  return (
    <main className="ui-shell relative max-w-3xl space-y-8 text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="strength" />
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
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.05]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <AssessmentPageHeader
        kicker={t('strength.kicker')}
        title={t('strength.title')}
        subtitle={t('strength.subtitle')}
        onBack={onBack}
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

      {profileReady && profile ? (
        <p className="text-xs text-zinc-500">
          <span className="mr-3">{t('strength.metaWeight', { value: profile.weightKg })}</span>
          <span className="mr-3">{t('strength.metaAge', { value: profile.age })}</span>
          <span>{t('strength.metaGender', { value: genderLabel })}</span>
        </p>
      ) : null}

      <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
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

        <div className="grid gap-6">
          {STRENGTH_LIFT_KEYS.map((lift: StrengthLiftKey) => {
            const rowResult = perLiftResult[lift];
            const rowErr = perLiftError[lift];
            const showRepsAccuracyNudge = shouldShowStrengthRepsAccuracyNudge(
              form[lift].weight,
              form[lift].reps
            );
            const repsAccuracyNudgeId = `strength-reps-accuracy-${lift}`;
            return (
              <fieldset
                key={lift}
                className="space-y-3 rounded-xl border border-zinc-800/80 bg-bg-panel/40 p-4"
              >
                <legend className="text-sm font-medium text-zinc-200">
                  {t(`strength.lifts.${lift}`)}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className="flex flex-col gap-1 text-xs text-zinc-400"
                    htmlFor={`st-w-${lift}`}
                  >
                    <span>{t('strength.weightLabel')}</span>
                    <input
                      id={`st-w-${lift}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      className="ui-input w-full"
                      placeholder={t('strength.weightPlaceholder')}
                      value={form[lift].weight}
                      onChange={(e) => setWeight(lift, e.target.value)}
                      disabled={revealBlocking}
                      aria-label={t('strength.weightAria', { lift: t(`strength.lifts.${lift}`) })}
                    />
                  </label>
                  <label
                    className="flex flex-col gap-1 text-xs text-zinc-400"
                    htmlFor={`st-r-${lift}`}
                  >
                    <span>{t('strength.repsLabel')}</span>
                    <input
                      id={`st-r-${lift}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={STRENGTH_ASSESSMENT_MAX_REPS}
                      step={1}
                      className="ui-input w-full"
                      placeholder={t('strength.repsPlaceholder')}
                      value={form[lift].reps}
                      onChange={(e) => setReps(lift, e.target.value)}
                      disabled={revealBlocking}
                      aria-label={t('strength.repsAria', { lift: t(`strength.lifts.${lift}`) })}
                      aria-describedby={showRepsAccuracyNudge ? repsAccuracyNudgeId : undefined}
                    />
                  </label>
                </div>

                {showRepsAccuracyNudge ? (
                  <p id={repsAccuracyNudgeId} className="text-xs leading-relaxed text-zinc-500">
                    {t('strength.repsAccuracyNudge')}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary text-sm"
                    disabled={!profileReady || revealBlocking}
                    onClick={() => calculateLift(lift)}
                  >
                    {t('strength.calculateThisLift')}
                  </button>
                </div>

                {rowErr ? (
                  <p className="text-sm text-red-400" role="alert">
                    {singleErr(rowErr)}
                  </p>
                ) : null}

                {rowResult ? (
                  <div className="space-y-3">
                    <div
                      className="space-y-1 rounded-lg border border-zinc-700/90 bg-bg-panel/60 px-3 py-2.5 text-sm"
                      role="status"
                    >
                      {rowResult.weightCapped ? (
                        <p
                          className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 text-xs leading-relaxed text-amber-100/95"
                          role="status"
                        >
                          {t('strength.capWeightNotice', {
                            lift: t(`strength.lifts.${lift}`),
                            input: rowResult.weightInputKg,
                            max: rowResult.modelMaxKg,
                          })}
                        </p>
                      ) : null}
                      <p className="font-mono text-xs tabular-nums text-zinc-300">
                        <span className="text-zinc-500">{t('strength.singleOneRmLabel')}</span>{' '}
                        <span className="text-zinc-100">
                          {t('strength.singleOneRmValue', {
                            value: rowResult.oneRepMax.toFixed(2),
                          })}
                        </span>
                      </p>
                      <p className="font-mono text-sm tabular-nums text-accent-info">
                        <span className="text-zinc-500">{t('strength.singleScoreLabel')}</span>{' '}
                        <span className="font-semibold">{rowResult.finalScore.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </fieldset>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-zinc-800 pt-6">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-200">
            {t('strength.combinedSectionTitle')}
          </h2>

          {combinedError ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`strength.errors.${combinedError}`)}
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
                <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
                  {heroScoreText ?? combinedBreakdown.averageRaw.toFixed(2)}
                </p>
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
                                input: b.inputWeightKg,
                                max: b.modelMaxKg,
                              })}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-200 sm:text-right">
                          {fmtBranchLine(t, b)}
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
            <Link className="ui-btn inline-flex" to={ROUTES.home}>
              {t('assessment.viewHomeRadar')}
            </Link>
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
                reason: t(`strength.errors.${submitNotice.error ?? 'no-inputs'}`),
              })}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar syncController={ladderSync} />
        </div>
      </section>
    </main>
  );
};

export default StrengthAssessmentPage;
