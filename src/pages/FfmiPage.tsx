import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import FfmiEducationPanels from '../components/ffmi/FfmiEducationPanels';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { ROUTES } from '../config/routes';
import { FFMI_HUMAN_CAP_FEMALE, FFMI_HUMAN_CAP_MALE } from '../logic/core/ffmiScoring';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useFfmiPage } from '../hooks/useFfmiPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';

export interface FfmiPageProps {
  onBack?: () => void;
}

const FfmiPage: FC<FfmiPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const {
    profileReady,
    gender,
    bodyFatInput,
    setBodyFatInput,
    previewScore,
    breakdown,
    categorySuffix,
    submitDone,
    errorKey,
    calculate,
    submitToRadar,
    goHome,
  } = useFfmiPage();

  const reveal = useAssessmentRevealFlow({
    pool: 'ffmi',
    metric: 'bodyFat',
    scoreDecimals: 2,
    getScore: () => previewScore,
    hasError: () => errorKey != null,
    compute: calculate,
  });
  const { ceremony, isBlocking: revealBlocking, displayScore, revealCalculate, modalOpen, modalPayload, closeModal } =
    reveal;

  const heroScore = displayScore ?? previewScore;
  const heroScoreText = heroScore != null ? heroScore.toFixed(2) : null;
  const scoreMeaning = useScoreMeaning('bodyFat', previewScore ?? heroScore);

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="ffmi" />
      <PerformanceBreakthroughModal open={modalOpen} payload={modalPayload} onClose={closeModal} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <AssessmentPageHeader
          kicker={t('ffmi.kicker')}
          title={t('ffmi.title')}
          subtitle={t('ffmi.subtitle')}
          onBack={onBack ?? goHome}
        />

        {!profileReady ? (
          <section
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-100/90"
            role="status"
          >
            <p>{t('ffmi.errors.missing-profile')}</p>
            <Link className="mt-3 inline-block text-accent-info underline" to={ROUTES.home}>
              {t('ffmi.ctaProfile')}
            </Link>
          </section>
        ) : (
          <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
            <FfmiEducationPanels />

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t('ffmi.bodyFatLabel')}
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  className="ui-input max-w-[10rem]"
                  value={bodyFatInput}
                  disabled={revealBlocking}
                  onChange={(e) => setBodyFatInput(e.target.value)}
                  placeholder={t('ffmi.bodyFatPlaceholder')}
                  autoComplete="off"
                />
                <span className="text-sm text-zinc-500">{t('ffmi.bodyFatUnit')}</span>
              </div>
              <p className="text-xs text-zinc-500">{t('ffmi.bodyFatHint')}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                disabled={revealBlocking}
                onClick={() => {
                  void revealCalculate();
                }}
              >
                {t('ffmi.calculate')}
              </button>
            </div>

            {errorKey ? (
              <p className="text-sm text-red-300" role="alert">
                {t(`ffmi.errors.${errorKey}`)}
              </p>
            ) : null}

            {breakdown ? (
              <div className="space-y-4 border-t border-zinc-800 pt-6">
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-zinc-500">{t('ffmi.resultFfmi')}</dt>
                    <dd className="font-mono text-lg text-zinc-100">{breakdown.rawAdjustedFfmi}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">{t('ffmi.resultRadarScore')}</dt>
                    <dd className="font-mono text-lg text-accent-primary">
                      {breakdown.allowsRadarSubmit ? (
                        heroScoreText ?? breakdown.submittedScore.toFixed(2)
                      ) : (
                        <span className="text-zinc-500">{t('ffmi.radarScoreLockedLabel')}</span>
                      )}
                    </dd>
                  </div>
                  {breakdown.limitedByHumanCap ? (
                    <>
                      <div>
                        <dt className="text-zinc-500">{t('ffmi.resultScoreUncapped')}</dt>
                        <dd className="font-mono text-zinc-300">{breakdown.uncappedScore}</dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500">{t('ffmi.resultFfmiCapped')}</dt>
                        <dd className="font-mono text-zinc-300">{breakdown.cappedAdjustedFfmi}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>

                {previewScore !== null ? (
                  <div className="rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      {t('ffmi.previewLabel')}
                    </p>
                    <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
                      {heroScoreText ?? previewScore.toFixed(2)}
                    </p>
                  </div>
                ) : null}

                {previewScore !== null && scoreMeaning ? (
                  <section className="relative overflow-hidden rounded-xl border border-violet-400/35 bg-zinc-950/85 p-4 shadow-[inset_0_1px_0_rgba(167,139,250,0.22),0_0_28px_rgba(139,92,246,0.14)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/65 to-transparent" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-violet-300/90">
                      {t('ffmi.performanceSpecHeader')}
                    </p>
                    <h3 className="mt-2 text-base font-semibold tracking-tight text-zinc-50">
                      {scoreMeaning.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{scoreMeaning.summary}</p>
                    {scoreMeaning.nextMilestone !== null && scoreMeaning.remainingPoints !== null ? (
                      <p className="mt-3 border-t border-zinc-800/90 pt-3 text-xs font-medium text-violet-300">
                        {t('ffmi.nextMilestoneHint', { points: scoreMeaning.remainingPoints })}
                      </p>
                    ) : null}
                  </section>
                ) : null}

                {categorySuffix && gender ? (
                  <p className="text-sm text-zinc-400">
                    {t('ffmi.categoryLabel')}:{' '}
                    {t(
                      gender === 'male'
                        ? `ffmi.category.male.${categorySuffix}`
                        : `ffmi.category.female.${categorySuffix}`
                    )}
                  </p>
                ) : null}

                {breakdown.limitedByHumanCap ? (
                  <aside
                    className="rounded-xl border border-accent-info/30 bg-accent-info/5 p-4 text-sm leading-relaxed text-zinc-200"
                    role="note"
                  >
                    <p className="font-medium text-accent-info">{t('ffmi.worldRecordLockTitle')}</p>
                    <p className="mt-2 text-zinc-400">{t('ffmi.worldRecordLockIntro')}</p>
                    <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-400">
                      <li>{t('ffmi.anchorMale', { value: FFMI_HUMAN_CAP_MALE })}</li>
                      <li>{t('ffmi.anchorFemale', { value: FFMI_HUMAN_CAP_FEMALE })}</li>
                    </ul>
                  </aside>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary disabled:opacity-40"
                    disabled={!breakdown.allowsRadarSubmit || revealBlocking}
                    onClick={submitToRadar}
                  >
                    {t('ffmi.submitRadar')}
                  </button>
                  <Link className="ui-btn inline-flex" to={ROUTES.home}>
                    {t('assessment.viewHomeRadar')}
                  </Link>
                </div>
                {submitDone ? (
                  <p className="text-sm text-emerald-400/90">{t('ffmi.submitDone')}</p>
                ) : null}

                <LeaderboardAssessmentSyncBar scope="bodyFat_ffmi" />
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
};

export default FfmiPage;
