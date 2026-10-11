import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AssessmentLobbyCard } from '../components/assessment/AssessmentLobbyCard';
import DynoSixAxisSnapshotPanel from '../components/assessment/DynoSixAxisSnapshotPanel';
import { SomatotypeLabEntryCard } from '../components/assessment/SomatotypeLabEntryCard';
import {
  useAssessmentLobbyCards,
  type AssessmentLobbyCardModel,
} from '../hooks/useAssessmentLobbyCards';
import { useMergedScoresFromLocalStores } from '../hooks/useMergedScoresFromLocalStores';
import { calculateSixAxisOverall } from '../logic/core/scoring';
import { cn } from '../lib/cn';
import { generateLocalId } from '../lib/generateLocalId';
import { useHistoryStore } from '../stores/historyStore';

const SAVE_TOAST_MS = 2400;

function LobbyLayerGrid({ cards }: { cards: AssessmentLobbyCardModel[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <AssessmentLobbyCard
          key={card.key}
          cardKey={card.key}
          to={card.to}
          title={card.title}
          glanceLabel={card.glanceLabel}
          glanceFilled={card.glanceFilled}
          size={card.size}
          className={cn(card.colSpan === 2 && 'col-span-2')}
        />
      ))}
    </div>
  );
}

/** Tech divider between IA layers — margin owns vertical rhythm (parent stack has no space-y). */
function LobbyLayerDivider() {
  return <div className="my-4 border-t border-zinc-800/80" aria-hidden />;
}

/** Dyno lobby — three-layer IA + HUD six-axis snapshot; radar axis order stays config-decoupled. */
export default function AssessmentPage() {
  const { t } = useTranslation('common');
  const [justSaved, setJustSaved] = useState(false);
  const mergedScores = useMergedScoresFromLocalStores();
  const addHistoryRecord = useHistoryStore((s) => s.addHistoryRecord);
  const lobbyCards = useAssessmentLobbyCards(mergedScores);
  const saveToastTimerRef = useRef<number | null>(null);

  const { powerCards, chassisCards, specialtyCards } = useMemo(() => {
    const power: AssessmentLobbyCardModel[] = [];
    const chassis: AssessmentLobbyCardModel[] = [];
    const specialty: AssessmentLobbyCardModel[] = [];
    for (const card of lobbyCards) {
      if (card.layer === 'power') power.push(card);
      else if (card.layer === 'chassis') chassis.push(card);
      else specialty.push(card);
    }
    return { powerCards: power, chassisCards: chassis, specialtyCards: specialty };
  }, [lobbyCards]);

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

      <div>
        <section aria-label={t('assessment.lobby.layerPower')}>
          <LobbyLayerGrid cards={powerCards} />
        </section>

        <LobbyLayerDivider />

        <section aria-label={t('assessment.lobby.layerChassis')}>
          <LobbyLayerGrid cards={chassisCards} />
        </section>

        <LobbyLayerDivider />

        <section
          aria-label={t('assessment.lobby.layerSpecialty')}
          className="grid grid-cols-2 gap-3"
        >
          {specialtyCards.map((card) => (
            <AssessmentLobbyCard
              key={card.key}
              cardKey={card.key}
              to={card.to}
              title={card.title}
              glanceLabel={card.glanceLabel}
              glanceFilled={card.glanceFilled}
              size={card.size}
              className={cn(card.colSpan === 2 && 'col-span-2', 'h-full')}
            />
          ))}
          <SomatotypeLabEntryCard />
        </section>
      </div>

      <DynoSixAxisSnapshotPanel
        scores={mergedScores}
        justSaved={justSaved}
        onSaveSnapshot={saveSnapshotToHistory}
      />
    </main>
  );
}
