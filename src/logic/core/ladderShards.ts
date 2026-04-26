/**
 * Fitness-app (`reference-app-fitness`) ladder parity:
 * `LadderDivisionSelector` + `LadderSubFilters.filterProject` → Firestore shard
 * `leaderboards/{shardId}/entries/{uid}`.
 *
 * Legacy shards (`strength`, `cardio`, …) stay mapped from the primary subdivision
 * so existing documents keep resolving without a one-off migration.
 */

/** Matches `LadderDivisionSelector.jsx` DIVISION_OPTIONS order (plus `stats_grip` for UP grip axis). */
export const FITNESS_LADDER_DIVISION_IDS = [
  'ladderScore',
  'stats_totalLoginDays',
  'stats_sbdTotal',
  'stats_bodyFat',
  'stats_cooper',
  'stats_vertical',
  'stats_ffmi',
  'armSize',
] as const;

export type FitnessLadderDivisionId = (typeof FITNESS_LADDER_DIVISION_IDS)[number];

export const LADDER_DIVISION_IDS = [...FITNESS_LADDER_DIVISION_IDS, 'stats_grip'] as const;

export type LadderDivisionId = (typeof LADDER_DIVISION_IDS)[number];

/** Sentinel: divisions without a project dropdown. */
export const LADDER_PROJECT_NONE = '__none__' as const;

/**
 * Every allowed Firestore `leaderboards/{shardId}/entries` segment.
 * Keep in sync with `getLeaderboardShardId` and Firestore rules allow-pattern.
 */
export const KNOWN_LEADERBOARD_SHARD_IDS = [
  'ladderScore',
  'totalLoginDays',
  'strength',
  'strength_totalFive',
  'strength_squat',
  'strength_bench',
  'strength_deadlift',
  'strength_ohp',
  'strength_latPull',
  'cardio',
  'cardio_5km',
  'explosivePower',
  'explosive_broad',
  'explosive_sprint',
  'bodyFat',
  'bodyFat_ffmi',
  'muscleMass',
  'muscleMass_weightKg',
  'muscleMass_ratio',
  'gripStrength',
  'armSize',
] as const;

export type LeaderboardShardId = (typeof KNOWN_LEADERBOARD_SHARD_IDS)[number];

const LEADERBOARD_SHARD_ID_SET = new Set<string>(KNOWN_LEADERBOARD_SHARD_IDS);

export function isValidLeaderboardShardId(id: string): id is LeaderboardShardId {
  return LEADERBOARD_SHARD_ID_SET.has(id);
}

export function getDefaultProjectForDivision(division: LadderDivisionId): string {
  switch (division) {
    case 'stats_sbdTotal':
      return 'total';
    case 'stats_cooper':
      return 'cooper';
    case 'stats_vertical':
      return 'vertical';
    case 'stats_bodyFat':
      return 'bodyFat';
    case 'stats_ffmi':
      return 'score';
    case 'stats_grip':
      return 'grip';
    case 'ladderScore':
    case 'stats_totalLoginDays':
    case 'armSize':
      return LADDER_PROJECT_NONE;
  }
}

export interface LadderProjectOption {
  value: string;
  /** i18n key under `common` namespace */
  labelKey: string;
}

/** Mirrors `LadderSubFilters.jsx` `getProjectOptions` + UP `stats_grip`. */
export function getProjectOptionsForDivision(division: LadderDivisionId): readonly LadderProjectOption[] {
  switch (division) {
    case 'stats_sbdTotal':
      return [
        { value: 'total_five', labelKey: 'ladder.project.totalFive' },
        { value: 'total', labelKey: 'ladder.project.sbdTotal' },
        { value: 'squat', labelKey: 'ladder.project.squat' },
        { value: 'bench', labelKey: 'ladder.project.benchPress' },
        { value: 'deadlift', labelKey: 'ladder.project.deadlift' },
        { value: 'ohp', labelKey: 'ladder.project.shoulderPress' },
        { value: 'latPull', labelKey: 'ladder.project.latPulldown' },
      ] as const;
    case 'stats_cooper':
      return [
        { value: 'cooper', labelKey: 'ladder.project.cooper' },
        { value: '5km', labelKey: 'ladder.project.run5km' },
      ] as const;
    case 'stats_vertical':
      return [
        { value: 'vertical', labelKey: 'ladder.project.verticalJump' },
        { value: 'broad', labelKey: 'ladder.project.standingLongJump' },
        { value: 'sprint', labelKey: 'ladder.project.sprint' },
      ] as const;
    case 'stats_bodyFat':
      return [
        { value: 'bodyFat', labelKey: 'ladder.project.bodyFatScore' },
        { value: 'ffmi', labelKey: 'ladder.project.ffmi' },
      ] as const;
    case 'stats_ffmi':
      return [
        { value: 'score', labelKey: 'ladder.project.smmScore' },
        { value: 'weight', labelKey: 'ladder.project.smmKg' },
        { value: 'ratio', labelKey: 'ladder.project.smmRatio' },
      ] as const;
    case 'stats_grip':
      return [{ value: 'grip', labelKey: 'ladder.project.grip' }] as const;
    case 'ladderScore':
    case 'stats_totalLoginDays':
    case 'armSize':
      return [];
  }
}

export function divisionUsesProjectFilter(division: LadderDivisionId): boolean {
  return getProjectOptionsForDivision(division).length > 0;
}

/**
 * Maps fitness division + filterProject to Firestore leaderboard shard id.
 * @see reference-app-fitness `useLadder.js` sortField overrides (~431–480).
 */
export function getLeaderboardShardId(division: LadderDivisionId, project: string): LeaderboardShardId {
  const p = project && project !== LADDER_PROJECT_NONE ? project : getDefaultProjectForDivision(division);

  switch (division) {
    case 'ladderScore':
      return 'ladderScore';
    case 'stats_totalLoginDays':
      return 'totalLoginDays';
    case 'armSize':
      return 'armSize';
    case 'stats_grip':
      return 'gripStrength';
    case 'stats_sbdTotal': {
      if (p === 'total_five') return 'strength_totalFive';
      if (p === 'total') return 'strength';
      if (p === 'squat') return 'strength_squat';
      if (p === 'bench') return 'strength_bench';
      if (p === 'deadlift') return 'strength_deadlift';
      if (p === 'ohp') return 'strength_ohp';
      if (p === 'latPull') return 'strength_latPull';
      return 'strength';
    }
    case 'stats_cooper':
      return p === '5km' ? 'cardio_5km' : 'cardio';
    case 'stats_vertical': {
      if (p === 'broad') return 'explosive_broad';
      if (p === 'sprint') return 'explosive_sprint';
      return 'explosivePower';
    }
    case 'stats_bodyFat':
      return p === 'ffmi' ? 'bodyFat_ffmi' : 'bodyFat';
    case 'stats_ffmi': {
      if (p === 'weight') return 'muscleMass_weightKg';
      if (p === 'ratio') return 'muscleMass_ratio';
      return 'muscleMass';
    }
  }
}
