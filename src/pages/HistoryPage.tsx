import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HistoryArchiveSection from '../components/history/HistoryArchiveSection';
import HistoryFootprintDashboard from '../components/history/HistoryFootprintDashboard';
import HistoryLogCard from '../components/history/HistoryLogCard';
import LogEvolutionCard from '../components/history/LogEvolutionCard';
import { useHistoryRhythmExpanded } from '../hooks/useHistoryRhythmExpanded';
import { useLogEvolutionShare } from '../hooks/useLogEvolutionShare';
import { useTrainingFootprint } from '../hooks/useTrainingFootprint';
import { persistSpecBadgeUnionFromDevice } from '../services/specBadgeDeriveSnapshot';
import { loadSeenBadgeIds, markBadgesAsSeen } from '../services/specBadgeSeenService';
import { loadTrainingFootprint } from '../services/trainingFootprintService';
import { getUnseenBadgeIds } from '../logic/core/specBadgeSeen';
import { buildHistoryArchiveSummary } from '../logic/core/historyArchiveSummary';
import {
  badgeMapFromReport,
  buildLogEvolutionReport,
} from '../logic/core/logEvolutionReport';
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
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const { sharing, shareEvolution } = useLogEvolutionShare();

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

  const evolutionReport = useMemo(
    () => buildLogEvolutionReport(records, { selectedBaselineId }),
    [records, selectedBaselineId]
  );
  const badgeById = useMemo(() => badgeMapFromReport(evolutionReport), [evolutionReport]);
  const archiveSummary = useMemo(() => buildHistoryArchiveSummary(records), [records]);

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
    if (selectedBaselineId === id) setSelectedBaselineId(null);
  };

  return (
    <main className="ui-shell mx-auto w-full max-w-md space-y-5">
      {/* Soft page stage — section tiles own their own hairline; no nested gold rings / hr. */}
      <section className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-bg-card shadow-panel">
        <div className="px-4 pb-2 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-primary/90">
            {t('history.kicker', { ns: 'common' })}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">
            {t('history.title', { ns: 'common' })}
          </h1>
        </div>

        <div className="space-y-3 px-4 pb-5 pt-2">
          <HistoryFootprintDashboard
            {...footprint}
            expanded={rhythmExpanded}
            onToggle={toggleRhythm}
            unseenBadgeIds={unseenBadgeIds}
            focusedBadgeId={focusedBadgeId}
          />

          {records.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {t('history.empty', { ns: 'common' })}
            </p>
          ) : (
            <>
              <LogEvolutionCard
                report={evolutionReport}
                sharing={sharing}
                onShare={() => {
                  void shareEvolution(evolutionReport);
                }}
                onSelectDay1Baseline={() => {
                  setSelectedBaselineId(evolutionReport.day1BaselineId);
                }}
                onSelectPreviousLog={() => {
                  if (evolutionReport.previousLogId) {
                    setSelectedBaselineId(evolutionReport.previousLogId);
                  }
                }}
              />
              <HistoryArchiveSection summary={archiveSummary}>
                {records.map((row) => {
                  const badge = badgeById.get(row.id);
                  return (
                    <HistoryLogCard
                      key={row.id}
                      record={row}
                      valueEmptyLabel={t('history.valueEmpty', { ns: 'common' })}
                      onDelete={handleRemoveRecord}
                      isDay1Baseline={badge?.isDay1Baseline}
                      isPersonalBest={badge?.isPersonalBest}
                      isSelectedBaseline={evolutionReport.selectedBaselineId === row.id}
                      onSelectAsBaseline={() => setSelectedBaselineId(row.id)}
                    />
                  );
                })}
              </HistoryArchiveSection>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
