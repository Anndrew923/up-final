import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HistoryFootprintDashboard from '../components/history/HistoryFootprintDashboard';
import { formatHistorySavedAt } from '../i18n/formatHistorySavedAt';
import { resolveSixAxisInputShortLabel } from '../i18n/resolveSixAxisInputShortLabel';
import { useHistoryRhythmExpanded } from '../hooks/useHistoryRhythmExpanded';
import { useTrainingFootprint } from '../hooks/useTrainingFootprint';
import { persistSpecBadgeUnionFromDevice } from '../services/specBadgeDeriveSnapshot';
import { loadSeenBadgeIds, markBadgesAsSeen } from '../services/specBadgeSeenService';
import { loadTrainingFootprint } from '../services/trainingFootprintService';
import { getUnseenBadgeIds } from '../logic/core/specBadgeSeen';
import { SIX_AXIS_METRICS } from '../types/scoring';
import { useHistoryStore } from '../stores/historyStore';
import { useScoreStore } from '../stores/scoreStore';

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const records = useHistoryStore((s) => s.records);
  const loadLocalHistory = useHistoryStore((s) => s.loadLocalHistory);
  const removeHistoryRecord = useHistoryStore((s) => s.removeHistoryRecord);
  const scores = useScoreStore((s) => s.scores);
  const footprint = useTrainingFootprint();
  const { expanded: rhythmExpanded, toggle: toggleRhythm, expand: expandRhythm } = useHistoryRhythmExpanded();
  const focusedBadgeId = (location.state as { focusBadgeId?: string } | null)?.focusBadgeId ?? null;

  // WHY: Snapshot unseen IDs once at mount so the glow animation fires only on first visit.
  // Pure read — no writes, no dispatches.
  const unseenBadgeIds = useMemo<ReadonlySet<string>>(() => {
    const stored = loadSeenBadgeIds();
    if (stored === null) return new Set();
    const persisted = loadTrainingFootprint().unlockedBadgeIds;
    const live = footprint.badges.filter((b) => b.unlocked).map((b) => b.id);
    return new Set(getUnseenBadgeIds([...persisted, ...live], stored));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLocalHistory();
  }, [loadLocalHistory]);

  useEffect(() => {
    if (focusedBadgeId == null) return;
    expandRhythm();
  }, [expandRhythm, focusedBadgeId]);

  useEffect(() => {
    persistSpecBadgeUnionFromDevice(scores, records.length);
    const persisted = loadTrainingFootprint().unlockedBadgeIds;
    const live = footprint.badges.filter((badge) => badge.unlocked).map((badge) => badge.id);
    markBadgesAsSeen([...persisted, ...live]);
  }, [footprint.badges, records.length, scores]);

  const handleRemoveRecord = (id: string) => {
    if (!window.confirm(t('history.deleteConfirm', { ns: 'common' }))) return;
    removeHistoryRecord(id);
  };

  return (
    <main className="ui-shell max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-xl border border-accent-primary/35 bg-bg-card shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
        <div className="border-b border-zinc-800 px-5 py-6 md:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
            {t('history.kicker', { ns: 'common' })}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">
            {t('history.title', { ns: 'common' })}
          </h1>
        </div>

        <div className="border-b border-zinc-800 px-5 py-4 md:px-8">
          <HistoryFootprintDashboard
            {...footprint}
            expanded={rhythmExpanded}
            onToggle={toggleRhythm}
            unseenBadgeIds={unseenBadgeIds}
            focusedBadgeId={focusedBadgeId}
          />
        </div>

        <div className="overflow-x-auto px-3 py-4 md:px-6">
          {records.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              {t('history.empty', { ns: 'common' })}
            </p>
          ) : (
            <table className="w-full min-w-[700px] border-collapse text-left text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="whitespace-nowrap px-2 py-2">
                    {t('history.colDate', { ns: 'common' })}
                  </th>
                  <th className="whitespace-nowrap px-2 py-2">
                    {t('history.colOverall', { ns: 'common' })}
                  </th>
                  {SIX_AXIS_METRICS.map((m) => (
                    <th key={m} className="whitespace-nowrap px-1 py-2 font-normal">
                      {resolveSixAxisInputShortLabel(t, m)}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-2 py-2">
                    {t('history.colActions', { ns: 'common' })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800/80 hover:bg-bg-panel/40">
                    <td className="max-w-[10rem] truncate px-2 py-2 font-mono text-[11px] text-zinc-400">
                      {formatHistorySavedAt(row.createdAt, i18n.language)}
                    </td>
                    <td className="px-2 py-2 font-mono tabular-nums text-accent-info">
                      {row.overallScore}
                    </td>
                    {SIX_AXIS_METRICS.map((m) => (
                      <td key={m} className="px-1 py-2 font-mono tabular-nums text-zinc-400">
                        {row.scores[m] != null
                          ? row.scores[m]
                          : t('history.valueEmpty', { ns: 'common' })}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveRecord(row.id)}
                        className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-red-400/60 hover:text-red-300"
                      >
                        {t('history.delete', { ns: 'common' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
