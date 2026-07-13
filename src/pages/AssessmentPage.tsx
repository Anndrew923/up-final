import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AssessmentLobbyCard } from '../components/assessment/AssessmentLobbyCard';
import DynoSixAxisSnapshotPanel from '../components/assessment/DynoSixAxisSnapshotPanel';
import { SomatotypeLabEntryCard } from '../components/assessment/SomatotypeLabEntryCard';
import { useAssessmentLobbyCards } from '../hooks/useAssessmentLobbyCards';
import { useMergedScoresFromLocalStores } from '../hooks/useMergedScoresFromLocalStores';
import { ASSESSMENT_LOBBY_FULL_WIDTH_CARD_KEY } from '../config/assessmentLobby';
import { calculateSixAxisOverall } from '../logic/core/scoring';
import { generateLocalId } from '../lib/generateLocalId';
import { useHistoryStore } from '../stores/historyStore';

const SAVE_TOAST_MS = 2400;

/** Dyno lobby — assessment cards first; six-axis board is read-only merged status + snapshot. */
export default function AssessmentPage() {
  const { t } = useTranslation('common');
  const [justSaved, setJustSaved] = useState(false);
  const mergedScores = useMergedScoresFromLocalStores();
  const addHistoryRecord = useHistoryStore((s) => s.addHistoryRecord);
  const lobbyCards = useAssessmentLobbyCards();
  const saveToastTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (saveToastTimerRef.current !== null) {
        window.clearTimeout(saveToastTimerRef.current);
      }
    },
    []
  );

  const saveSnapshotToHistory = useCallback(() => {
    addHistoryRecord({
      id: generateLocalId(),
      createdAt: new Date().toISOString(),
      scores: { ...mergedScores },
      overallScore: calculateSixAxisOverall(mergedScores),
    });
    setJustSaved(true);
    if (saveToastTimerRef.current !== null) {
      window.clearTimeout(saveToastTimerRef.current);
    }
    saveToastTimerRef.current = window.setTimeout(() => {
      setJustSaved(false);
      saveToastTimerRef.current = null;
    }, SAVE_TOAST_MS);
  }, [addHistoryRecord, mergedScores]);

  return (
    <main className="ui-shell max-w-4xl space-y-4">
      <section className="space-y-1">
        <h1 className="max-w-[20rem] text-balance text-2xl font-bold tracking-tight text-zinc-100 sm:max-w-none sm:text-3xl">
          {t('assessment.title')}
        </h1>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {lobbyCards.map((card) => (
          <AssessmentLobbyCard
            key={card.key}
            cardKey={card.key}
            to={card.to}
            title={card.title}
            className={
              card.key === ASSESSMENT_LOBBY_FULL_WIDTH_CARD_KEY ? 'col-span-2' : undefined
            }
          />
        ))}
      </section>

      <section>
        <SomatotypeLabEntryCard />
      </section>

      <DynoSixAxisSnapshotPanel
        scores={mergedScores}
        justSaved={justSaved}
        onSaveSnapshot={saveSnapshotToHistory}
      />
    </main>
  );
}
