import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HistoryFootprintDashboard from '../components/history/HistoryFootprintDashboard';
import HistoryLogCard from '../components/history/HistoryLogCard';
import { useHistoryRhythmExpanded } from '../hooks/useHistoryRhythmExpanded';
import { useTrainingFootprint } from '../hooks/useTrainingFootprint';
import { persistSpecBadgeUnionFromDevice } from '../services/specBadgeDeriveSnapshot';
import { loadSeenBadgeIds, markBadgesAsSeen } from '../services/specBadgeSeenService';
import { loadTrainingFootprint } from '../services/trainingFootprintService';
import { getUnseenBadgeIds } from '../logic/core/specBadgeSeen';
import { useHistoryStore } from '../stores/historyStore';
import { useScoreStore } from '../stores/scoreStore';

export default function HistoryPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const records = useHistoryStore((s) => s.records);
  const loadLocalHistory = useHistoryStore((s) => s.loadLocalHistory);
  const removeHistoryRecord = useHistoryStore((s) => s.removeHistoryRecord);
  const scores = useScoreStore((s) => s.scores);
  const footprint = useTrainingFootprint();
  const { expanded: rhythmExpanded, toggle: toggleRhythm, expand: expandRhythm } =
    useHistoryRhythmExpanded();
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
    <main className="ui-shell mx-auto w-full max-w-md space-y-5">
      <section className="relative overflow-hidden rounded-xl border border-accent-primary/35 bg-bg-card shadow-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
        <div className="border-b border-zinc-800 px-4 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
            {t('history.kicker', { ns: 'common' })}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">
            {t('history.title', { ns: 'common' })}
          </h1>
        </div>

        <div className="border-b border-zinc-800 px-4 py-4">
          <HistoryFootprintDashboard
            {...footprint}
            expanded={rhythmExpanded}
            onToggle={toggleRhythm}
            unseenBadgeIds={unseenBadgeIds}
            focusedBadgeId={focusedBadgeId}
          />
        </div>

        <div className="px-4 py-4">
          {records.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              {t('history.empty', { ns: 'common' })}
            </p>
          ) : (
            <div className="space-y-3" data-testid="history-log-card-list">
              {records.map((row) => (
                <HistoryLogCard
                  key={row.id}
                  record={row}
                  valueEmptyLabel={t('history.valueEmpty', { ns: 'common' })}
                  onDelete={handleRemoveRecord}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
