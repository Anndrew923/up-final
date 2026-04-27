import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { DisclosurePanel } from '../components/DisclosurePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { useMuscleAssessmentPage } from '../hooks/useMuscleAssessmentPage';

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
    submitToRadar,
    smmCeilingKg,
    scoreLocked,
  } = useMuscleAssessmentPage();

  const genderLabel =
    !profile ? '' : profile.gender === 'female'
      ? t('home.profile.female')
      : t('home.profile.male');

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('muscle.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('muscle.title')}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('muscle.subtitle')}</p>
          </div>
          {onBack ? (
            <button type="button" className="ui-btn shrink-0" onClick={onBack}>
              {t('back')}
            </button>
          ) : null}
        </header>

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
            <span className="mr-3">
              {t('muscle.metaWeight', { value: profile.weightKg })}
            </span>
            <span className="mr-3">{t('muscle.metaAge', { value: profile.age })}</span>
            <span>{t('muscle.metaGender', { value: genderLabel })}</span>
          </p>
        ) : null}

        {profileReady && smmCeilingKg != null ? (
          <p className="text-xs text-zinc-500">{t('muscle.smmCeilingLine', { max: smmCeilingKg })}</p>
        ) : null}

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <DisclosurePanel
            instanceId="muscle-standards-info"
            expanded={standardsInfoOpen}
            onToggle={() => setStandardsInfoOpen((v) => !v)}
            title={t('assessment.referenceInfo.title')}
            toggleExpandLabel={t('assessment.referenceInfo.toggleExpand')}
            toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse')}
          >
            <p>{t('muscle.smmHint')}</p>
            <p>{t('muscle.standardsInfo.p1')}</p>
            <p>{t('muscle.standardsInfo.p2')}</p>
            <p>{t('muscle.standardsInfo.p3')}</p>
            <p>{t('muscle.standardsInfo.p4')}</p>
            <p>{t('muscle.standardsInfo.p5')}</p>
          </DisclosurePanel>

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
              <p>{t('muscle.errors.smm-exceeds-ceiling', { max: smmCeilingKg })}</p>
            </section>
          ) : errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`muscle.errors.${errorKey}`)}
            </p>
          ) : null}

          {previewScore !== null && !scoreLocked ? (
            <div className="space-y-2 rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('muscle.previewLabel')}
              </p>
              <p className="font-mono text-2xl tabular-nums text-accent-info">{previewScore.toFixed(2)}</p>
              {previewBreakdown ? (
                <p className="text-xs leading-relaxed text-zinc-500">
                  {t('muscle.breakdownLine', {
                    smmScore: previewBreakdown.smmScoreRaw.toFixed(2),
                    smPct: previewBreakdown.smPercent.toFixed(2),
                    smPctScore: previewBreakdown.smPercentScoreRaw.toFixed(2),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              className="ui-btn ui-btn-primary disabled:pointer-events-none disabled:opacity-40"
              onClick={calculate}
              disabled={!profileReady || scoreLocked}
            >
              {t('muscle.calculate')}
            </button>
            <button
              type="button"
              className="ui-btn disabled:pointer-events-none disabled:opacity-40"
              onClick={submitToRadar}
              disabled={!profileReady || scoreLocked}
            >
              {t('muscle.submitRadar')}
            </button>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {t('muscle.submitDone')}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar scope="muscleMass" />
        </section>
      </div>
    </main>
  );
};

export default MuscleAssessmentPage;
