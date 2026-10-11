import type { ScoreMap, ScoreMetric } from '../../types/scoring';

/**
 * Lobby card → score metric (WHY: Kept in logic, not `config/assessmentLobby`, so pure
 * scoring helpers never load route/accent UI modules. Parity-locked in unit tests.
 */
export const LOBBY_CARD_SCORE_METRIC = {
  strength: 'strength',
  grip: 'gripStrength',
  ffmi: 'bodyFat',
  explosive: 'explosivePower',
  cardio: 'cardio',
  muscle: 'muscleMass',
  armSize: 'armSize',
} as const satisfies Record<string, ScoreMetric>;

export type LobbyGlanceCardKey = keyof typeof LOBBY_CARD_SCORE_METRIC;

export interface LobbyGlanceStatus {
  /** Presentational label (e.g. `81.57` or `未測`) — no mechanical code suffix. */
  label: string;
  /** True when a positive finite score is shown (drives contrast vs empty tone). */
  filled: boolean;
}

export function resolveLobbyCardScoreMetric(cardKey: LobbyGlanceCardKey): ScoreMetric {
  return LOBBY_CARD_SCORE_METRIC[cardKey];
}

/**
 * Lobby glance only (WHY): Always 2dp so micro-progress stays visible on the Bento rail.
 * HUD snapshot uses `formatAxisScoreReadout` in its own module — do not merge contracts.
 */
export function formatLobbyGlanceValue(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(2);
}

/**
 * Positive finite scores count as measured (WHY): `0` is used as a cleared/specialty
 * placeholder in merge pipelines (e.g. 5 km-only cardio) and must not look "tested".
 */
export function isLobbyGlanceScorePresent(value: number | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

export function buildLobbyGlanceStatus(
  cardKey: LobbyGlanceCardKey,
  scores: ScoreMap,
  emptyLabel: string
): LobbyGlanceStatus {
  const metric = resolveLobbyCardScoreMetric(cardKey);
  const value = scores[metric];
  if (!isLobbyGlanceScorePresent(value)) {
    return { label: emptyLabel, filled: false };
  }
  return {
    label: formatLobbyGlanceValue(value),
    filled: true,
  };
}
