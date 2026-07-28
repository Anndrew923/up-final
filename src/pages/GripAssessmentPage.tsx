import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentAmbientGlow } from '../components/assessment/AssessmentAmbientGlow';
import { ShellFlowStack } from '../components/layout/ShellFlowStack';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import { HeroNumberInput } from '../components/assessment/HeroNumberInput';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import { ReferenceSimpleCopy } from '../components/assessment/AssessmentReferenceProse';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import UnitSystemToggle from '../components/units/UnitSystemToggle';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { ROUTES } from '../config/routes';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { useUnit } from '../hooks/useUnit';
import { buildGripAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import { formatOverallResonanceScore } from '../logic/core/scoring';
import { useGripAssessmentPage } from '../hooks/useGripAssessmentPage';

const GripAssessmentPage: FC = () => {
  const { t } = useTranslation('common');
  const [referenceOpen, setReferenceOpen] = useState(false);
  const { labels, unitSystem, setUnitSystem, formatWeight } = useUnit();
  const {
    profile,
    profileReady,
    peakInput,
    setPeakInput,
    previewScore,
    capNotice,
    errorKey,
    submitDone,
    clearError,
    calculate,
    persistToDashboard,
    submitToRadar,
  } = useGripAssessmentPage();
  const reveal = useAssessmentRevealFlow({
    pool: 'grip',
    metric: 'gripStrength',
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

  const ladderUploadBundle = useMemo(
    () => buildGripAssessmentSupplementalTargets(previewScore),
    [previewScore]
  );

  const ladderSync = useLeaderboardSyncAssessmentPage({
    scope: 'gripStrength',
    uploadBundle: ladderUploadBundle,
  });

  const genderLabel = !profile
    ? ''
    : profile.gender === 'female'
      ? t('home.profile.female')
      : t('home.profile.male');
  const heroScore = displayScore ?? previewScore;
  const heroScoreText = heroScore != null ? formatOverallResonanceScore(heroScore) : null;
  const scoreMeaning = useScoreMeaning('gripStrength', previewScore ?? heroScore);
  const peakLabel = t('grip.peakLabel', { unit: labels.weight });

  return (
    <main className="ui-shell relative max-w-3xl text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="grip" />
      <PerformanceBreakthroughModal
        open={modalOpen}
        payload={modalPayload}
        onClose={closeModal}
        onSyncToDashboard={submitToRadar}
        onPersistToDashboard={persistToDashboard}
        syncDisabled={!profileReady}
        arenaSync={ladderSync}
      />
      <AssessmentAmbientGlow />

      <ShellFlowStack gapClassName="space-y-8">
        <AssessmentPageHeader
          kicker={t('grip.kicker')}
          title={t('grip.title')}
          meta={
            profileReady && profile ? (
              <p className="text-xs">
                <span
                  className="inline-flex rounded-full border border-zinc-700/80 bg-zinc-900/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400"
                  aria-label={t('grip.metaGender', { value: genderLabel })}
                >
                  {genderLabel}
                </span>
              </p>
            ) : null
          }
        />

        {!profileReady ? (
          <section
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90"
            role="status"
          >
            <p>{t('grip.profileIncompleteHint')}</p>
            <Link className="mt-3 inline-block text-accent-info underline" to={ROUTES.home}>
              {t('grip.ctaProfile')}
            </Link>
          </section>
        ) : null}

        <section className="space-y-5 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <div className="flex justify-end">
            <UnitSystemToggle value={unitSystem} onChange={setUnitSystem} compact />
          </div>

          <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="grip-peak">
            <span className="font-medium text-zinc-200">{peakLabel}</span>
            <HeroNumberInput
              id="grip-peak"
              inputMode="decimal"
              min={0}
              step={0.1}
              className="max-w-xs"
              placeholder={t('grip.peakPlaceholder')}
              value={peakInput}
              onChange={(e) => {
                clearError();
                setPeakInput(e.target.value);
              }}
              disabled={revealBlocking}
              aria-label={peakLabel}
            />
          </label>

          {capNotice ? (
            <div
              className="space-y-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-50">{t('grip.capNoticeTitle')}</p>
              <p className="leading-relaxed">
                {t('grip.capNoticeBody', {
                  input: formatWeight(capNotice.inputKg, { includeUnit: false, digits: 1 }),
                  max: formatWeight(capNotice.maxKg, { includeUnit: false, digits: 1 }),
                  unit: labels.weight,
                })}
              </p>
              <p className="text-xs text-amber-100/80">{t('grip.capNoticeLegend')}</p>
            </div>
          ) : null}

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`grip.errors.${errorKey}`, { unit: labels.weight })}
            </p>
          ) : null}

          {previewScore !== null ? (
            <div className="space-y-2 rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('grip.previewLabel')}
              </p>
              <p className="font-mono text-2xl tabular-nums text-accent-info">
                {heroScoreText ?? formatOverallResonanceScore(previewScore)}
              </p>
            </div>
          ) : null}

          {previewScore !== null && scoreMeaning ? (
            <section className="relative overflow-hidden rounded-xl border border-blue-400/35 bg-zinc-950/85 p-4 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/65 to-transparent" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue-300/90">
                {t('grip.performanceSpecHeader')}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">
                {scoreMeaning.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{scoreMeaning.summary}</p>
              {scoreMeaning.nextMilestone !== null && scoreMeaning.remainingPoints !== null ? (
                <p className="mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium text-blue-300">
                  {t('grip.nextMilestoneHint', { points: scoreMeaning.remainingPoints })}
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              disabled={revealBlocking}
              onClick={() => {
                void revealCalculate();
              }}
            >
              {t('grip.calculate')}
            </button>
            <button
              type="button"
              className="ui-btn"
              disabled={revealBlocking}
              onClick={submitToRadar}
            >
              {t('grip.submitRadar')}
            </button>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {t('grip.submitDone')}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar syncController={ladderSync} />

          <AssessmentReferenceFooter>
            <AssessmentReferenceDisclosure
              instanceId="grip-reference-info"
              expanded={referenceOpen}
              onToggle={() => setReferenceOpen((v) => !v)}
            >
              <ReferenceSimpleCopy
                paragraphs={[
                  t('grip.referenceInfo.p1'),
                  t('grip.referenceInfo.p2'),
                  t('grip.referenceInfo.p3'),
                  t('grip.referenceInfo.p4'),
                  t('grip.referenceInfo.p6'),
                  t('grip.referenceInfo.p7'),
                  t('grip.referenceInfo.p8'),
                ]}
                footnote={t('grip.referenceInfo.p5')}
              />
            </AssessmentReferenceDisclosure>
          </AssessmentReferenceFooter>
        </section>
      </ShellFlowStack>
    </main>
  );
};

export default GripAssessmentPage;
