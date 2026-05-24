import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AssessmentCeremonyOverlay from '../components/assessment/AssessmentCeremonyOverlay';
import { AssessmentPageHeader } from '../components/assessment/AssessmentPageHeader';
import AssessmentScoreMeaningPanel from '../components/assessment/AssessmentScoreMeaningPanel';
import PerformanceBreakthroughModal from '../components/assessment/PerformanceBreakthroughModal';
import { DisclosurePanel } from '../components/DisclosurePanel';
import LeaderboardAssessmentSyncBar from '../components/ladder/LeaderboardAssessmentSyncBar';
import { ROUTES } from '../config/routes';
import { useArmSizeAssessmentPage } from '../hooks/useArmSizeAssessmentPage';
import { useAssessmentRevealFlow } from '../hooks/useAssessmentRevealFlow';
import { useScoreMeaning } from '../hooks/useScoreMeaning';
import { leaderboardShardForArmSize } from '../logic/core/assessmentLeaderboardShards';
import type { LeaderboardSyncTarget } from '../logic/core/leaderboardSyncTargets';
import { useArmSizeBreakthroughDashboardSync } from '../hooks/useBreakthroughDashboardSync';
import { useScoreStore } from '../stores/scoreStore';

export interface ArmSizeAssessmentPageProps {
  onBack?: () => void;
}

const ArmSizeAssessmentPage: FC<ArmSizeAssessmentPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [referenceOpen, setReferenceOpen] = useState(false);
  const persistedArmSizeScore = useScoreStore((s) => s.scores.armSize);
  const {
    armCircumferenceInput,
    setArmCircumferenceInput,
    bodyFatInput,
    setBodyFatInput,
    previewScore,
    submittedScore,
    limitedByAxisCap,
    errorKey,
    submitDone,
    clearError,
    calculate,
    saveForLeaderboard,
  } = useArmSizeAssessmentPage();

  const reveal = useAssessmentRevealFlow({
    pool: 'armSize',
    metric: 'armSize',
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

  const syncBreakthroughToDashboard = useArmSizeBreakthroughDashboardSync(
    saveForLeaderboard,
    navigate
  );

  const armLadderSupplemental = useMemo((): LeaderboardSyncTarget[] | undefined => {
    const score = submittedScore ?? persistedArmSizeScore;
    if (score == null || !Number.isFinite(score) || score <= 0) return undefined;
    return [{ metric: leaderboardShardForArmSize(), score }];
  }, [submittedScore, persistedArmSizeScore]);

  const interpretationScore = previewScore ?? submittedScore ?? persistedArmSizeScore ?? null;
  const heroScore = displayScore ?? interpretationScore;
  const scoreMeaning = useScoreMeaning('armSize', heroScore);

  return (
    <main className="relative min-h-[70vh] overflow-hidden text-zinc-100">
      <AssessmentCeremonyOverlay ceremony={ceremony} accent="armSize" />
      <PerformanceBreakthroughModal
        open={modalOpen}
        payload={modalPayload}
        onClose={closeModal}
        onSyncToDashboard={syncBreakthroughToDashboard}
      />
      <div className="ui-shell relative max-w-3xl space-y-8">
        <AssessmentPageHeader
          kicker={t('armSize.kicker')}
          title={t('armSize.title')}
          subtitle={t('armSize.subtitle')}
          onBack={onBack}
        />

        <section className="space-y-5 rounded-2xl border border-zinc-800 bg-bg-card/95 p-6 shadow-panel backdrop-blur">
          <DisclosurePanel
            instanceId="arm-size-reference-info"
            expanded={referenceOpen}
            onToggle={() => setReferenceOpen((v) => !v)}
            title={t('assessment.referenceInfo.title')}
            toggleExpandLabel={t('assessment.referenceInfo.toggleExpand')}
            toggleCollapseLabel={t('assessment.referenceInfo.toggleCollapse')}
          >
            <p>{t('armSize.referenceInfo.p1')}</p>
            <p>{t('armSize.referenceInfo.p2')}</p>
            <p className="text-zinc-500">{t('armSize.referenceInfo.p3')}</p>
          </DisclosurePanel>

          <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="arm-cm">
            <span className="font-medium text-zinc-200">{t('armSize.armLabel')}</span>
            <input
              id="arm-cm"
              type="number"
              inputMode="decimal"
              min={1}
              max={70}
              step={0.1}
              className="ui-input max-w-xs"
              placeholder={t('armSize.armPlaceholder')}
              value={armCircumferenceInput}
              onChange={(e) => {
                clearError();
                setArmCircumferenceInput(e.target.value);
              }}
              aria-label={t('armSize.armLabel')}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor="arm-body-fat">
            <span className="font-medium text-zinc-200">{t('armSize.bodyFatLabel')}</span>
            <input
              id="arm-body-fat"
              type="number"
              inputMode="decimal"
              min={3}
              max={50}
              step={0.1}
              className="ui-input max-w-xs"
              placeholder={t('armSize.bodyFatPlaceholder')}
              value={bodyFatInput}
              onChange={(e) => {
                clearError();
                setBodyFatInput(e.target.value);
              }}
              aria-label={t('armSize.bodyFatLabel')}
            />
          </label>

          {limitedByAxisCap ? (
            <div
              className="space-y-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-50">{t('armSize.capNoticeTitle')}</p>
              <p className="leading-relaxed">{t('armSize.capNoticeBody')}</p>
            </div>
          ) : null}

          {errorKey ? (
            <p className="text-sm text-red-400" role="alert">
              {t(`armSize.errors.${errorKey}`)}
            </p>
          ) : null}

          {heroScore !== null ? (
            <div className="space-y-2 rounded-lg border border-zinc-700 bg-bg-panel/80 px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {t('armSize.previewLabel')}
              </p>
              <p className="font-mono text-2xl tabular-nums text-accent-info">
                {heroScore.toFixed(2)}
              </p>
              {submittedScore !== null && submittedScore !== previewScore ? (
                <p className="text-sm text-zinc-300">
                  {t('armSize.submittedScoreLabel', { score: submittedScore.toFixed(2) })}
                </p>
              ) : null}
            </div>
          ) : null}

          {heroScore !== null && scoreMeaning ? (
            <AssessmentScoreMeaningPanel
              tone="slate"
              headerLabel={t('armSize.performanceSpecHeader')}
              meaning={scoreMeaning}
              milestoneHintLabel={
                scoreMeaning.remainingPoints != null
                  ? t('armSize.nextMilestoneHint', { points: scoreMeaning.remainingPoints })
                  : null
              }
            />
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
              {t('armSize.calculate')}
            </button>
            <button
              type="button"
              className="ui-btn"
              disabled={revealBlocking}
              onClick={saveForLeaderboard}
            >
              {t('armSize.saveLeaderboard')}
            </button>
            <Link className="ui-btn inline-flex" to={ROUTES.home}>
              {t('assessment.viewHomeRadar')}
            </Link>
          </div>

          {submitDone ? (
            <p className="text-sm text-accent-info" role="status">
              {t('armSize.submitDone')}
            </p>
          ) : null}

          <LeaderboardAssessmentSyncBar
            scope="armSize"
            supplementalTargets={armLadderSupplemental}
          />
        </section>
      </div>
    </main>
  );
};

export default ArmSizeAssessmentPage;
