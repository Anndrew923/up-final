import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import AssessmentScoreMeaningPanel from '../components/assessment/AssessmentScoreMeaningPanel';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { DisclosurePanel } from '../components/DisclosurePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { ROUTES } from '../config/routes';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useExplosiveAssessmentPage } from '../hooks/useExplosiveAssessmentPage';
import { useScoreMeaning } from '../hooks/useScoreMeaning';

export interface ExplosiveAssessmentPageProps {
  onBack?: () => void;
}

function formatExplosiveAnchorCm(n: number): string {
  return n.toFixed(0);
}

function formatExplosiveAnchorSprintS(n: number): string {
  return n.toFixed(1);
}

const ExplosiveAssessmentPage: FC<ExplosiveAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const [referenceOpen, setReferenceOpen] = useState(false);

  const {
    profile,
    profileReady,
    verticalJumpInput,
    setVerticalJumpInput,
    standingLongJumpInput,
    setStandingLongJumpInput,
    sprintInput,
    setSprintInput,
    previewScore,
    previewBreakdown,
    capNoticeInterpolation,
    powerNormAnchors,
    submitDone,
    errorKey,
    clearError,
    calculate,
    submitToRadar,
  } = useExplosiveAssessmentPage();

  const reveal = useAssessmentRevealFlow({
    pool: 'explosive',
    metric: 'explosivePower',
    scoreDecimals: 2,
    getScore: () =>
      previewScore ?? (previewBreakdown != null ? previewBreakdown.averageRaw : null),
    hasError: () => errorKey != null || !profileReady,
    compute: calculate,
  });
  const { ceremony, isBlocking: revealBlocking, displayScore, revealCalculate, modalOpen, modalPayload, closeModal } =
    reveal;

  const genderLabel =
    !profile ? '' : profile.gender === 'female'
      ? t('home.profile.female')
      : t('home.profile.male');

  const dash = t('explosive.branchDash');
  const fmtBranch = (v: number | null) => (v === null ? dash : v.toFixed(2));

  const showCapNoticeBlock =
    profileReady && profile && capNoticeInterpolation != null;

  const interpretationScore =
    previewScore ?? (previewBreakdown != null ? previewBreakdown.averageRaw : null);
  const heroScore = displayScore ?? interpretationScore;
  const scoreMeaning = useScoreMeaning('explosivePower', heroScore);

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="explosive" />
      <PerformanceBreakthroughModal open={modalOpen} payload={modalPayload} onClose={closeModal} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/20 via-transparent to-transparent" />
      </div>

      <div className="ui-shell relative max-w-3xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
              {t('explosive.kicker')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t('explosive.title')}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{t('explosive.subtitle')}</p>
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
            <p>{t('explosive.profileIncompleteHint')}</p>
            <Link className="mt-3 inline-block text-accent-info underline" to={ROUTES.home}>
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

        <section className="space-y-6 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <DisclosurePanel
            instanceId="explosive-reference"
            expanded={referenceOpen}
            onToggle={() => setReferenceOpen((v) => !v)}
            title={t('assessment.referenceInfo.title')}
            toggleExpandLabel={t('assessment.referenceInfo.toggleExpand')}
            toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse')}
            panelBodyClassName="space-y-3 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400"
          >
            <p className="font-medium text-zinc-300">{t('explosive.howToInfo.verticalJump')}</p>
            <p>{t('explosive.howToInfo.standingLongJump')}</p>
            <p>{t('explosive.howToInfo.sprint')}</p>
            <p>{t('explosive.fieldsHint')}</p>
            <p className="text-zinc-500">{t('explosive.howToInfo.tip')}</p>
            <p>{t('explosive.standardsInfo.disclaimer')}</p>
            {powerNormAnchors ? (
              <>
                <p className="font-medium text-zinc-300">{t('explosive.standardsInfo.anchorsIntro')}</p>
                <p className="text-xs text-zinc-500">
                  {t('explosive.standardsInfo.ageBand', {
                    band: t(`explosive.standardsInfo.ageBands.${powerNormAnchors.ageRange}`),
                  })}
                </p>
                <ul className="list-inside list-disc space-y-1.5 font-mono text-xs tabular-nums text-zinc-300 sm:text-sm">
                  <li>
                    {t('explosive.standardsInfo.anchorVerticalLine', {
                      v0: formatExplosiveAnchorCm(powerNormAnchors.vjump[0]),
                      v50: formatExplosiveAnchorCm(powerNormAnchors.vjump[50]),
                      v100: formatExplosiveAnchorCm(powerNormAnchors.vjump[100]),
                    })}
                  </li>
                  <li>
                    {t('explosive.standardsInfo.anchorSljLine', {
                      v0: formatExplosiveAnchorCm(powerNormAnchors.slj[0]),
                      v50: formatExplosiveAnchorCm(powerNormAnchors.slj[50]),
                      v100: formatExplosiveAnchorCm(powerNormAnchors.slj[100]),
                    })}
                  </li>
                  <li>
                    {t('explosive.standardsInfo.anchorSprintLine', {
                      v0: formatExplosiveAnchorSprintS(powerNormAnchors.sprint[0]),
                      v50: formatExplosiveAnchorSprintS(powerNormAnchors.sprint[50]),
                      v100: formatExplosiveAnchorSprintS(powerNormAnchors.sprint[100]),
                    })}
                  </li>
                </ul>
              </>
            ) : profileReady && profile ? (
              <p className="text-amber-100/90">{t('explosive.standardsInfo.noAnchorsHint')}</p>
            ) : (
              <p className="text-zinc-500">{t('explosive.standardsInfo.profileIncompleteForAnchors')}</p>
            )}
            <p>
              <span className="font-medium text-zinc-300">{t('explosive.standardsInfo.sourceLabel')}</span>{' '}
              {t('explosive.standardsInfo.sourceBody')}
            </p>
            <p className="font-medium text-zinc-300">{t('explosive.standardsInfo.basisLabel')}</p>
            <ul className="list-inside list-disc space-y-1 text-zinc-400">
              <li>{t('explosive.standardsInfo.basisVjump')}</li>
              <li>{t('explosive.standardsInfo.basisSlj')}</li>
              <li>{t('explosive.standardsInfo.basisSprint')}</li>
            </ul>
            <p className="text-xs text-zinc-500">{t('explosive.standardsInfo.remark')}</p>
          </DisclosurePanel>

          <div className="grid gap-5">
            <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="exp-vj">
              <span className="font-medium text-zinc-200">{t('explosive.verticalJumpLabel')}</span>
              <input
                id="exp-vj"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                className="ui-input max-w-xs"
                placeholder={t('explosive.verticalJumpPlaceholder')}
                value={verticalJumpInput}
                onChange={(e) => {
                  clearError();
                  setVerticalJumpInput(e.target.value);
                }}
                aria-label={t('explosive.verticalJumpLabel')}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="exp-slj">
              <span className="font-medium text-zinc-200">{t('explosive.standingLongJumpLabel')}</span>
              <input
                id="exp-slj"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                className="ui-input max-w-xs"
                placeholder={t('explosive.standingLongJumpPlaceholder')}
                value={standingLongJumpInput}
                onChange={(e) => {
                  clearError();
                  setStandingLongJumpInput(e.target.value);
                }}
                aria-label={t('explosive.standingLongJumpLabel')}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="exp-sprint">
              <span className="font-medium text-zinc-200">{t('explosive.sprintLabel')}</span>
              <input
                id="exp-sprint"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                className="ui-input max-w-xs"
                placeholder={t('explosive.sprintPlaceholder')}
                value={sprintInput}
                onChange={(e) => {
                  clearError();
                  setSprintInput(e.target.value);
                }}
                aria-label={t('explosive.sprintLabel')}
              />
            </label>
          </div>
          {showCapNoticeBlock ? (
            <div
              className="space-y-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-50">{t('explosive.capNoticeTitle')}</p>
              {capNoticeInterpolation.maxVerticalJumpCm != null ? (
                <p className="leading-relaxed">
                  {t('explosive.capVerticalJump', {
                    max: capNoticeInterpolation.maxVerticalJumpCm,
                  })}
                </p>
              ) : null}
              {capNoticeInterpolation.maxStandingLongJumpCm != null ? (
                <p className="leading-relaxed">
                  {t('explosive.capStandingLongJump', {
                    max: capNoticeInterpolation.maxStandingLongJumpCm,
                  })}
                </p>
              ) : null}
              {capNoticeInterpolation.sprint100mFloorSeconds != null ? (
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
              {t(`explosive.errors.${errorKey}`)}
            </p>
          ) : null}

          {previewBreakdown ? (
            <div className="space-y-3 rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('explosive.branchScoresHeading')}
              </p>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li className="flex justify-between gap-4 font-mono tabular-nums">
                  <span className="text-zinc-400">{t('explosive.branchVerticalJumpShort')}</span>
                  <span>{fmtBranch(previewBreakdown.verticalJumpRaw)}</span>
                </li>
                <li className="flex justify-between gap-4 font-mono tabular-nums">
                  <span className="text-zinc-400">{t('explosive.branchStandingLongJumpShort')}</span>
                  <span>{fmtBranch(previewBreakdown.standingLongJumpRaw)}</span>
                </li>
                <li className="flex justify-between gap-4 font-mono tabular-nums">
                  <span className="text-zinc-400">{t('explosive.branchSprintShort')}</span>
                  <span>{fmtBranch(previewBreakdown.sprintRaw)}</span>
                </li>
              </ul>
              <div className="border-t border-zinc-700/80 pt-3">
                <p className="text-xs text-zinc-400">{t('explosive.averageRawLabel')}</p>
                <p className="mt-0.5 font-mono text-lg tabular-nums text-zinc-100">
                  {previewBreakdown.averageRaw.toFixed(2)}
                </p>
              </div>
              <div className="border-t border-zinc-700/80 pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  {t('explosive.previewLabel')}
                </p>
                <p className="mt-1 font-mono text-2xl tabular-nums text-accent-info">
                  {(heroScore ?? previewBreakdown.averageRaw).toFixed(2)}
                </p>
                {previewScore !== null &&
                Math.abs(previewScore - previewBreakdown.averageRaw) > 0.001 ? (
                  <p className="mt-1 text-xs text-zinc-500">{t('explosive.radarClampNote')}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {heroScore !== null && scoreMeaning ? (
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

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              disabled={!profileReady || revealBlocking}
              onClick={() => {
                void revealCalculate();
              }}
            >
              {t('explosive.calculate')}
            </button>
            <button type="button" className="ui-btn" disabled={revealBlocking} onClick={submitToRadar}>
              {t('explosive.submitRadar')}
            </button>
            <Link className="ui-btn inline-flex" to={ROUTES.home}>
              {t('assessment.viewHomeRadar')}
            </Link>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {t('explosive.submitDone')}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar scope="explosivePower" />
        </section>
      </div>
    </main>
  );
};

export default ExplosiveAssessmentPage;
