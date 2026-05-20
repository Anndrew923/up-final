import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AssessmentLobbyCard } from '../components/assessment/AssessmentLobbyCard';
import { ASSESSMENT_LOBBY_CARD_KEYS, ASSESSMENT_LOBBY_ROUTES } from '../config/assessmentLobby';
import { useMergedScoresFromLocalStores } from '../hooks/useMergedScoresFromLocalStores';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../types/scoring';
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
  const { t } = useTranslation();
  const [justSaved, setJustSaved] = useState(false);
  const scores = useScoreStore((s) => s.scores);
  const mergedScores = useMergedScoresFromLocalStores();
  const displayOverall = useMemo(() => calculateSixAxisOverall(mergedScores), [mergedScores]);
  const setScore = useScoreStore((s) => s.setScore);
  const resetScores = useScoreStore((s) => s.resetScores);
  const addHistoryRecord = useHistoryStore((s) => s.addHistoryRecord);

  const lobbyCards = useMemo(
    () =>
      ASSESSMENT_LOBBY_CARD_KEYS.map((key) => ({
        key,
        to: ASSESSMENT_LOBBY_ROUTES[key],
        kicker: t(`assessment.${key}.kicker`, { ns: 'common' }),
        title: t(`assessment.${key}.title`, { ns: 'common' }),
        body: t(`assessment.${key}.body`, { ns: 'common' }),
        stampLabel: t(`assessment.${key}.cta`, { ns: 'common' }),
      })),
    [t]
  );

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
    <main className="ui-shell max-w-4xl space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          {t('assessment.title', { ns: 'common' })}
        </h1>
        <p className="text-sm text-zinc-400">{t('assessment.subtitle', { ns: 'common' })}</p>
      </section>

      {lobbyCards.map((card) => (
        <AssessmentLobbyCard
          key={card.key}
          to={card.to}
          kicker={card.kicker}
          title={card.title}
          body={card.body}
          stampLabel={card.stampLabel}
        />
      ))}

      <section className="ui-card space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">
          {t('assessment.rawInputsHeading', { ns: 'common' })}
        </h2>
        <p className="text-xs text-zinc-500">{t('assessment.homeRadarHint', { ns: 'common' })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SIX_AXIS_METRICS.map((metric) => (
            <label key={metric} className="flex flex-col gap-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">
                {t(`assessment.axis.${metric}`, { ns: 'common' })}
              </span>
              <input
                type="number"
                min={0}
                max={SCORE_AXIS_MAX}
                step={0.5}
                value={scores[metric] ?? 0}
                onChange={(e) => onAxisChange(metric, e.target.value)}
                className="rounded-md border border-zinc-700 bg-bg-panel px-2 py-1.5 text-sm text-zinc-100 outline-none ring-accent-info focus:ring-1"
                aria-label={t(`assessment.axis.${metric}`, { ns: 'common' })}
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="ui-btn ui-btn-primary text-sm"
            onClick={saveSnapshotToHistory}
          >
            {t('assessment.saveToHistory', { ns: 'common' })}
          </button>
          <button
            type="button"
            className="ui-btn text-sm"
            onClick={() => {
              setJustSaved(false);
              resetScores();
            }}
          >
            {t('assessment.resetScores', { ns: 'common' })}
          </button>
          {justSaved ? (
            <span className="text-xs text-accent-info" role="status">
              {t('assessment.saveToHistoryDone', { ns: 'common' })}
            </span>
          ) : null}
        </div>
      </section>
    </main>
  );
}
