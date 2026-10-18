/**
 * Local-only PK battle report — six-axis win/loss tally for club / global radar sheets.
 * WHY: Pure ScoreMap math keeps combat copy + vertex winners offline and Firestore-free.
 */

import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import { calculateSixAxisOverall, clampScoreMapValue } from './scoring';

export type RadarPkAxisWinner = 'viewer' | 'target' | 'tie';

/** Viewer-perspective combat status for i18n badge copy. */
export type RadarPkBattleStatus = 'dominance' | 'lead' | 'even' | 'trailing';

export interface RadarPkBattleReport {
  wins: number;
  losses: number;
  ties: number;
  /** Viewer overall − target overall (2dp mean). */
  overallDelta: number;
  targetOverall: number;
  viewerOverall: number;
  status: RadarPkBattleStatus;
  axisWinners: Record<SixAxisMetric, RadarPkAxisWinner>;
}

function axisValue(scores: ScoreMap | null | undefined, metric: SixAxisMetric): number {
  return clampScoreMapValue(scores?.[metric] ?? 0);
}

/**
 * Classify viewer margin into combat status.
 * WHY: Badge copy needs a stable key; margin ≥2 reads as “crush”, ±1 as edge, 0 as even.
 */
export function resolveRadarPkBattleStatus(wins: number, losses: number): RadarPkBattleStatus {
  const margin = wins - losses;
  if (margin >= 2) return 'dominance';
  if (margin === 1) return 'lead';
  if (margin === 0) return 'even';
  return 'trailing';
}

/** Signed overall delta for battle badge interpolation (e.g. `+10.42`). */
export function formatRadarPkOverallDelta(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) return '0.00';
  return `${delta > 0 ? '+' : '-'}${Math.abs(delta).toFixed(2)}`;
}

/** i18n interpolation bag for `battleReport.*` keys — keeps club / global copy call sites identical. */
export function radarPkBattleBadgeParams(report: RadarPkBattleReport): {
  wins: number;
  losses: number;
  delta: string;
} {
  return {
    wins: report.wins,
    losses: report.losses,
    delta: formatRadarPkOverallDelta(report.overallDelta),
  };
}

/**
 * Compare target vs viewer ScoreMaps on the core six axes.
 * Empty / missing maps treat each axis as 0 (ties when both empty).
 */
export function buildRadarPkBattleReport(
  targetScores: ScoreMap | null | undefined,
  viewerScores: ScoreMap | null | undefined
): RadarPkBattleReport {
  const axisWinners = {} as Record<SixAxisMetric, RadarPkAxisWinner>;
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const metric of SIX_AXIS_METRICS) {
    const target = axisValue(targetScores, metric);
    const viewer = axisValue(viewerScores, metric);
    let winner: RadarPkAxisWinner = 'tie';
    if (viewer > target) {
      winner = 'viewer';
      wins += 1;
    } else if (target > viewer) {
      winner = 'target';
      losses += 1;
    } else {
      ties += 1;
    }
    axisWinners[metric] = winner;
  }

  const targetOverall = calculateSixAxisOverall(targetScores ?? {});
  const viewerOverall = calculateSixAxisOverall(viewerScores ?? {});
  const overallDelta = Number((viewerOverall - targetOverall).toFixed(2));

  return {
    wins,
    losses,
    ties,
    overallDelta,
    targetOverall,
    viewerOverall,
    status: resolveRadarPkBattleStatus(wins, losses),
    axisWinners,
  };
}
