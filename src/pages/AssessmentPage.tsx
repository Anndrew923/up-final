import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AssessmentLobbyCard } from '../components/assessment/AssessmentLobbyCard';
import { useAssessmentLobbyCards } from '../hooks/useAssessmentLobbyCards';
import { useMergedScoresFromLocalStores } from '../hooks/useMergedScoresFromLocalStores';
import {
  ASSESSMENT_LOBBY_FULL_WIDTH_CARD_KEY,
  ASSESSMENT_RAW_INPUT_GRID_ORDER,
} from '../config/assessmentLobby';
import type { SixAxisMetric } from '../types/scoring';
import {
  calculateSixAxisOverall,
  clampSixAxisRawInput,
  SCORE_AXIS_MAX,
} from '../logic/core/scoring';
import { generateLocalId } from '../lib/generateLocalId';
import { useHistoryStore } from '../stores/historyStore';
import { useScoreStore } from '../stores/scoreStore';

function parseInput(raw: string): number {
  const n = Number(raw);
  return clampSixAxisRawInput(Number.isFinite(n) ? n : 0);
}

/** Core six-axis raw entry — radar lives on Home; scores persist via `scoreStore`. */
export default function AssessmentPage() {
  const { t } = useTranslation('common');
  const [justSaved, setJustSaved] = useState(false);
  const scores = useScoreStore((s) => s.scores);
  const mergedScores = useMergedScoresFromLocalStores();
  const displayOverall = useMemo(() => calculateSixAxisOverall(mergedScores), [mergedScores]);
  const setScore = useScoreStore((s) => s.setScore);
  const resetScores = useScoreStore((s) => s.resetScores);
  const addHistoryRecord = useHistoryStore((s) => s.addHistoryRecord);

  const lobbyCards = useAssessmentLobbyCards();

  const onAxisChange = (metric: SixAxisMetric, value: string) => {
    setJustSaved(false);
    setScore(metric, parseInput(value));
  };

  const saveSnapshotToHistory = () => {
    addHistoryRecord({
      id: generateLocalId(),
      createdAt: new Date().toISOString(),
      scores: { ...mergedScores },
      overallScore: displayOverall,
    });
    setJustSaved(true);
  };

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

      <section className="ui-card space-y-3">
        <h2 className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-medium text-zinc-300">
          {t('assessment.rawInputsHeading')}
          <span className="text-[10px] font-normal text-zinc-500">
            · {t('assessment.homeRadarHint')}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {ASSESSMENT_RAW_INPUT_GRID_ORDER.map((metric) => (
            <label key={metric} className="flex items-center gap-2 text-xs text-zinc-400">
              <span
                className="w-10 shrink-0 truncate text-xs font-medium text-zinc-400"
                title={t(`axisLexicon.output.full.${metric}`)}
              >
                {t(`axisLexicon.input.short.${metric}`)}
              </span>
              <input
                type="number"
                min={0}
                max={SCORE_AXIS_MAX}
                step={0.5}
                value={scores[metric] ?? 0}
                onChange={(e) => onAxisChange(metric, e.target.value)}
                className="min-h-9 min-w-0 flex-1 rounded-md border border-zinc-700 bg-bg-panel px-2 py-1 text-xs tabular-nums text-zinc-100 outline-none ring-accent-info focus:ring-1"
                aria-label={t(`axisLexicon.output.full.${metric}`)}
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-2">
          <button
            type="button"
            className="ui-btn ui-btn-primary text-sm"
            onClick={saveSnapshotToHistory}
          >
            {t('assessment.saveToHistory')}
          </button>
          <button
            type="button"
            className="ui-btn text-sm"
            onClick={() => {
              setJustSaved(false);
              resetScores();
            }}
          >
            {t('assessment.resetScores')}
          </button>
          {justSaved ? (
            <span className="text-xs text-accent-info" role="status">
              {t('assessment.saveToHistoryDone')}
            </span>
          ) : null}
        </div>
      </section>
    </main>
  );
}
