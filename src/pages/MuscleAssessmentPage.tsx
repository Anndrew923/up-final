import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { ROUTES } from '../config/routes';
import AssessmentReferenceDisclosure, {
  AssessmentReferenceFooter,
} from '../components/assessment/AssessmentReferenceDisclosure';
import { ReferenceSimpleCopy } from '../components/assessment/AssessmentReferenceProse';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useLeaderboardSyncAssessmentPage } from '../hooks/useLeaderboardSyncAssessmentPage';
import { useMuscleAssessmentPage } from '../hooks/useMuscleAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { buildMuscleAssessmentSupplementalTargets } from '../logic/core/assessmentLadderSupplemental';
import { resolveMuscleDualSovereignI18nKey, SMM_KG_CEILING_FEMALE, SMM_KG_CEILING_MALE } from '../logic/core/muscleScoring';

export interface MuscleAssessmentPageProps {
  onBack?: () => void;
}

const MuscleAssessmentPage: FC<MuscleAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const [standardsInfoOpen, setStandardsInfoOpen] = useState(false);

  const {
    profileReady,
    profile,
    smmInput,
    setSmmInput,
    previewScore,
    previewBreakdown,
    submitDone,
    errorKey,
    clearError,
    calculate,
    persistToDashboard,
    submitToRadar,
    smmCeilingKg,
    scoreLocked,
  } = useMuscleAssessmentPage();

  const ladderUploadBundle = useMemo(
    () =>
      buildMuscleAssessmentSupplementalTargets({
        smmInput,
        profile,
        profileReady,
      }),
    [smmInput, profile, profileReady]
  );

  const ladderSync = useLeaderboardSyncAssessmentPage({
    scope: 'muscleMass',
    uploadBundle: ladderUploadBundle,
  });

  const reveal = useAssessmentRevealFlow({
    pool: 'muscle',
    metric: 'muscleMass',
    scoreDecimals: 2,
    getScore: () => previewScore,
    hasError: () => errorKey != null || scoreLocked,
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

  const heroScore = displayScore ?? previewScore;
  const heroScoreText = heroScore != null ? heroScore.toFixed(2) : null;
  const scoreMeaning = useScoreMeaning('muscleMass', previewScore ?? heroScore);

  const dualSovereignCeilingKey = resolveMuscleDualSovereignI18nKey(profile?.gender, 'ceiling');
  const dualSovereignExceedsKey = resolveMuscleDualSovereignI18nKey(profile?.gender, 'exceedsCeiling');

  return (
    <main className="ui-shell relative max-w-3xl space-y-8 text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="muscle" />
      <PerformanceBreakthroughModal
        open={modalOpen}
        payload={modalPayload}
        onClose={closeModal}
        onSyncToDashboard={submitToRadar}
        onPersistToDashboard={persistToDashboard}
        syncDisabled={!profileReady || scoreLocked}
        arenaSync={ladderSync}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.05]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <AssessmentPageHeader
        kicker={t('muscle.kicker')}
        title={t('muscle.title')}
        subtitle={t('muscle.subtitle')}
        onBack={onBack}
      />

      {!profileReady ? (
        <section
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90"
          role="status"
        >
          <p>{t('muscle.profileIncompleteHint')}</p>
          <Link className="mt-3 inline-block text-accent-info underline" to={ROUTES.home}>
            {t('muscle.ctaProfile')}
          </Link>
        </section>
      ) : null}

      {profileReady && profile ? (
        <p className="text-xs text-zinc-500">
          <span className="mr-3">{t('muscle.metaWeight', { value: profile.weightKg })}</span>
          <span className="mr-3">{t('muscle.metaAge', { value: profile.age })}</span>
          <span>{t('muscle.metaGender', { value: genderLabel })}</span>
        </p>
      ) : null}

      <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="muscle-smm">
            <span className="font-medium text-zinc-200">{t('muscle.smmLabel')}</span>
            <input
              id="muscle-smm"
              type="number"
              inputMode="decimal"
              min={0}
              max={smmCeilingKg ?? undefined}
              step={0.1}
              className="ui-input max-w-xs"
              placeholder={t('muscle.smmPlaceholder')}
              value={smmInput}
              disabled={!profileReady || revealBlocking}
              onChange={(e) => {
                clearError();
                setSmmInput(e.target.value);
              }}
              aria-label={t('muscle.smmLabel')}
              aria-invalid={scoreLocked}
            />
          </label>
        </div>

        {(scoreLocked || errorKey === 'smm-exceeds-ceiling') && smmCeilingKg != null ? (
          <section
            className="rounded-lg border border-amber-500/35 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100/95"
            role="status"
          >
            <p>{t(dualSovereignExceedsKey, { max: smmCeilingKg })}</p>
          </section>
        ) : errorKey ? (
          <p className="text-sm text-red-400" role="alert">
            {t(`muscle.errors.${errorKey}`)}
          </p>
        ) : null}

        {previewScore !== null && !scoreLocked ? (
          <div className="rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {t('muscle.previewLabel')}
            </p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
              {heroScoreText ?? previewScore.toFixed(2)}
            </p>
            {previewBreakdown ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {t('muscle.breakdownLine', {
                  smmScore: previewBreakdown.smmScoreRaw.toFixed(2),
                  smPct: previewBreakdown.smPercent.toFixed(2),
                  smPctScore: previewBreakdown.smPercentScoreRaw.toFixed(2),
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        {previewScore !== null && !scoreLocked && scoreMeaning ? (
          <section className="relative overflow-hidden rounded-xl border border-orange-400/35 bg-zinc-950/85 p-4 shadow-[inset_0_1px_0_rgba(251,146,60,0.22),0_0_30px_rgba(249,115,22,0.16)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-300/90">
              {t('muscle.performanceSpecHeader')}
            </p>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">
              {scoreMeaning.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{scoreMeaning.summary}</p>
            {scoreMeaning.nextMilestone !== null && scoreMeaning.remainingPoints !== null ? (
              <p className="mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium text-orange-300">
                {t('muscle.nextMilestoneHint', { points: scoreMeaning.remainingPoints })}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="ui-btn ui-btn-primary disabled:pointer-events-none disabled:opacity-40"
            disabled={!profileReady || revealBlocking || scoreLocked}
            onClick={() => {
              void revealCalculate();
            }}
          >
            {t('muscle.calculate')}
          </button>
          <button
            type="button"
            className="ui-btn disabled:pointer-events-none disabled:opacity-40"
            disabled={!profileReady || revealBlocking || scoreLocked}
            onClick={submitToRadar}
          >
            {t('muscle.submitRadar')}
          </button>
          <Link className="ui-btn inline-flex" to={ROUTES.home}>
            {t('assessment.viewHomeRadar')}
          </Link>
        </div>

        {submitDone ? (
          <p className="text-sm text-accent-info" role="status">
            {t('muscle.submitDone')}
          </p>
        ) : null}

        <LeaderboardAssessmentSyncBar syncController={ladderSync} />

        <AssessmentReferenceFooter>
          <AssessmentReferenceDisclosure
            instanceId="muscle-standards-info"
            expanded={standardsInfoOpen}
            onToggle={() => setStandardsInfoOpen((v) => !v)}
          >
            <ReferenceSimpleCopy
              paragraphs={[
                t('muscle.smmHint'),
                ...(smmCeilingKg != null && profile
                  ? [
                      t('muscle.standardsInfo.dualSovereignPreamble', {
                        maleMax: SMM_KG_CEILING_MALE,
                        femaleMax: SMM_KG_CEILING_FEMALE,
                      }),
                      t(dualSovereignCeilingKey, { max: smmCeilingKg }),
                    ]
                  : []),
                t('muscle.standardsInfo.p1'),
                t('muscle.standardsInfo.p2'),
                t('muscle.standardsInfo.p3'),
                t('muscle.standardsInfo.p4'),
              ]}
              footnote={t('muscle.standardsInfo.p5')}
            />
          </AssessmentReferenceDisclosure>
        </AssessmentReferenceFooter>
      </section>
    </main>
  );
};

export default MuscleAssessmentPage;
