import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import LadderReportSheet from './LadderReportSheet';
import { useLadderBlockStore } from '../../stores/ladderBlockStore';
import HexRadarChart from '../radar/HexRadarChart';
import type { LadderUserPreview } from '../../services/leaderboardPreviewService';
import { isLadderOverallEntryDriftFromPreview } from '../../logic/core/ladderScoreCompare';
import {
  buildSixAxisRadarData,
  calculateSixAxisOverall,
  clampScoreMapValue,
  formatOverallResonanceScore,
  getWeakestRadarAxis,
  radarDisplayScaleMax,
} from '../../logic/core/scoring';
import type { LeaderboardShardId } from '../../logic/core/ladderShards';
import { resolveSixAxisChartLabel } from '../../i18n/resolveSixAxisChartLabel';
import { SIX_AXIS_COUNT, SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';

export interface LadderUserPreviewModalProps {
  open: boolean;
  loading: boolean;
  error: boolean;
  user: LadderUserPreview | null;
  /** List-row fallback when `leaderboard_previews/{uid}` is missing. */
  entryFallback?: boolean;
  /** Target row uid (required for block/report when not anonymous). */
  targetUid?: string | null;
  /** Signed-in viewer uid — hides moderation actions for self. */
  viewerUid?: string | null;
  /** Active leaderboard shard — drift guard only applies on composite `ladderScore`. */
  viewingShardId?: LeaderboardShardId;
  /** Row `scoreBest` from the list tap; compared to preview six-axis average on overall board. */
  ladderEntryScoreBest?: number | null;
  onClose: () => void;
  /** Called after a successful local block so the parent can refresh the list. */
  onBlocked?: () => void;
}

const LadderUserPreviewModal: FC<LadderUserPreviewModalProps> = ({
  open,
  loading,
  error,
  user,
  entryFallback = false,
  targetUid,
  viewerUid,
  viewingShardId,
  ladderEntryScoreBest,
  onClose,
  onBlocked,
}) => {
  const { t, i18n } = useTranslation('common');
  const blockUid = useLadderBlockStore((s) => s.block);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  const showModerationActions = useMemo(() => {
    if (!targetUid || !viewerUid) return false;
    if (targetUid === viewerUid) return false;
    if (user?.isAnonymousInLadder) return false;
    return true;
  }, [targetUid, viewerUid, user?.isAnonymousInLadder]);

  const handleBlock = () => {
    if (!targetUid) return;
    blockUid(targetUid);
    onBlocked?.();
    onClose();
  };

  const dash = t('ladder.userPreview.valueEmpty', { ns: 'common' });

  const radarPoints = useMemo(() => {
    if (!user || user.isAnonymousInLadder) return [];
    return buildSixAxisRadarData(user.radarScores ?? {});
  }, [user]);

  const localizedRadarPoints = useMemo(
    () =>
      radarPoints.map((point) => ({
        ...point,
        label: resolveSixAxisChartLabel(t, point.key as SixAxisMetric),
      })),
    [i18n.resolvedLanguage, radarPoints, t]
  );

  const weakest = useMemo(() => getWeakestRadarAxis(radarPoints), [radarPoints]);

  const scaleMax = useMemo(() => radarDisplayScaleMax(radarPoints), [radarPoints]);

  const overallScore = useMemo(() => {
    if (!user || user.isAnonymousInLadder) return null;
    return calculateSixAxisOverall(user.radarScores ?? {});
  }, [user]);

  /**
   * Safety net: list row uses `leaderboardScore.scoreBest`; modal average is recomputed from
   * `leaderboard_previews.radarScores`. After legacy partial syncs they can diverge until re-sync.
   */
  const showOverallDriftGuard = useMemo(() => {
    if (viewingShardId !== 'ladderScore') return false;
    return isLadderOverallEntryDriftFromPreview(ladderEntryScoreBest, overallScore);
  }, [viewingShardId, ladderEntryScoreBest, overallScore]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70 p-3 backdrop-blur-[2px] sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t('ladder.userPreview.close', { ns: 'common' })}
        onClick={onClose}
      />
      <section className="ui-card relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto border-zinc-700/90 bg-bg-card/95 p-4">
        <header className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-info">
              {t('ladder.userPreview.kicker', { ns: 'common' })}
            </p>
            <h3 className="mt-1 text-base font-semibold text-zinc-100">
              {user?.displayName || t('ladder.userPreview.title', { ns: 'common' })}
            </h3>
          </div>
          <button type="button" className="ui-btn px-2 py-1 text-xs" onClick={onClose}>
            {t('cancel', { ns: 'common' })}
          </button>
        </header>

        {loading ? (
          <p className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-4 text-sm text-zinc-400">
            {t('ladder.userPreview.loading', { ns: 'common' })}
          </p>
        ) : error || !user ? (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-4 text-sm text-rose-200">
            {t('ladder.userPreview.error', { ns: 'common' })}
          </p>
        ) : (
          <div className="space-y-4">
            {entryFallback ? (
              <p className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-3 py-2.5 text-xs leading-relaxed text-cyan-100/90">
                {t('ladder.userPreview.entryFallbackNotice', { ns: 'common' })}
              </p>
            ) : null}
            <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/30 p-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  aria-hidden
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-lg text-zinc-300">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{user.displayName}</p>
                <p className="text-xs text-zinc-500">
                  {t('ladder.userPreview.updatedAt', {
                    ns: 'common',
                    time: new Date(user.updatedAt).toLocaleString(),
                  })}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-2">
                <dt className="text-zinc-500">{t('ladder.filters.gender', { ns: 'common' })}</dt>
                <dd className="mt-0.5 text-zinc-200">
                  {user.gender ? t(`home.profile.${user.gender}`, { ns: 'common' }) : dash}
                </dd>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-2">
                <dt className="text-zinc-500">{t('ladder.filters.ageBucket', { ns: 'common' })}</dt>
                <dd className="mt-0.5 text-zinc-200">
                  {user.ageBucket
                    ? t(`ladder.filters.ageBucketOptions.${user.ageBucket}`, { ns: 'common' })
                    : dash}
                </dd>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-2">
                <dt className="text-zinc-500">
                  {t('ladder.filters.jobCategory', { ns: 'common' })}
                </dt>
                <dd className="mt-0.5 text-zinc-200">
                  {user.jobCategory
                    ? t(`home.profile.jobOptions.${user.jobCategory}`, { ns: 'common' })
                    : dash}
                </dd>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-2">
                <dt className="text-zinc-500">{t('home.profile.countryCode', { ns: 'common' })}</dt>
                <dd className="mt-0.5 text-zinc-200">
                  {user.countryCode
                    ? t(`home.profile.countryOptions.${user.countryCode}`, { ns: 'common' })
                    : dash}
                </dd>
              </div>
            </dl>

            {user.isAnonymousInLadder ? (
              <p className="rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-3 text-sm text-zinc-400">
                {t('ladder.userPreview.radarHiddenAnonymous', { ns: 'common' })}
              </p>
            ) : (
              <div className="space-y-4">
                {entryFallback ? (
                  <>
                    <p className="rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-4 text-center text-sm text-zinc-400">
                      {t('ladder.userPreview.entryFallbackRadarPending', { ns: 'common' })}
                    </p>
                    {ladderEntryScoreBest != null && Number.isFinite(ladderEntryScoreBest) ? (
                      <div className="text-center">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                          {t('ladder.userPreview.listedOverallScore', { ns: 'common' })}
                        </p>
                        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-accent-info">
                          {formatOverallResonanceScore(ladderEntryScoreBest)}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-center text-xs text-zinc-500">
                      {t('ladder.userPreview.radarCompletion', {
                        ns: 'common',
                        count: user.radarAxisCount ?? 0,
                        total: SIX_AXIS_COUNT,
                      })}
                    </p>

                    <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-2">
                      <HexRadarChart
                        points={localizedRadarPoints}
                        scaleMax={scaleMax}
                        weakestKey={weakest?.key}
                        className="mx-auto w-full max-w-[260px]"
                        aria-label={t('ladder.userPreview.radarAria', { ns: 'common' })}
                      />
                    </div>

                    {showOverallDriftGuard ? (
                      <aside
                        className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm leading-relaxed text-amber-100/90"
                        role="note"
                      >
                        <p>
                          {t('ladder.userPreview.driftWarning', {
                            ns: 'common',
                            listed: formatOverallResonanceScore(ladderEntryScoreBest),
                            preview: formatOverallResonanceScore(overallScore),
                          })}
                        </p>
                      </aside>
                    ) : null}

                    {overallScore != null ? (
                      <div className="text-center">
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                          {t('ladder.userPreview.overallAverage', { ns: 'common' })}
                        </p>
                        {showOverallDriftGuard &&
                        ladderEntryScoreBest != null &&
                        Number.isFinite(ladderEntryScoreBest) ? (
                          <p className="mt-1 font-mono text-xs tabular-nums text-zinc-500">
                            {t('ladder.userPreview.listedOverallScore', { ns: 'common' })}:{' '}
                            {formatOverallResonanceScore(ladderEntryScoreBest)}
                          </p>
                        ) : null}
                        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-accent-info">
                          {overallScore}
                        </p>
                      </div>
                    ) : null}

                    <ul className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-3">
                      {SIX_AXIS_METRICS.map((key) => {
                        const v = clampScoreMapValue(user.radarScores?.[key] ?? 0);
                        const show = v > 0;
                        return (
                          <li
                            key={key}
                            className={`rounded-md border bg-bg-panel/40 px-2 py-1.5 text-center text-zinc-400 ${
                              weakest?.key === key
                                ? 'border-amber-300/50 shadow-[inset_2px_0_0_rgba(252,211,77,0.8)]'
                                : 'border-zinc-800/70'
                            }`}
                          >
                            <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                              {t(`home.radar.axisCard.${key}`, {
                                ns: 'common',
                                defaultValue: t(`home.radar.axis.${key}`, { ns: 'common' }),
                              })}
                            </span>
                            <span
                              className={`mt-0.5 block font-mono tabular-nums ${
                                show && v > 100 ? 'text-accent-info' : 'text-zinc-200'
                              }`}
                            >
                              {show ? v : dash}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}

            {showModerationActions ? (
              <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  className="ui-btn flex-1 border-zinc-600 text-xs text-zinc-300"
                  onClick={() => setReportSheetOpen(true)}
                >
                  {t('ladder.moderation.report', { ns: 'common' })}
                </button>
                <button
                  type="button"
                  className="ui-btn flex-1 border-zinc-600 text-xs text-zinc-300"
                  onClick={handleBlock}
                >
                  {t('ladder.moderation.block', { ns: 'common' })}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {targetUid ? (
        <LadderReportSheet
          open={reportSheetOpen}
          targetUid={targetUid}
          onClose={() => setReportSheetOpen(false)}
          onSuccess={() => {
            setReportSheetOpen(false);
            onClose();
          }}
        />
      ) : null}

    </div>,
    document.body
  );
};

export default LadderUserPreviewModal;
