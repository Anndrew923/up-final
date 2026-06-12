/** Arena namespace keys for Join Arena Pro feature bullets — keeps i18n refs type-safe. */
export const JOIN_ARENA_PRO_FEATURE_KEYS = [
  'proFeatureLeaderboard',
  'proFeatureCloudSync',
  'proFeatureDynoIntel',
] as const;

export type JoinArenaProFeatureKey = (typeof JOIN_ARENA_PRO_FEATURE_KEYS)[number];
