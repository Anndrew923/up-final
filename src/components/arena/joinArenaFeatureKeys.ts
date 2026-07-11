/** Arena namespace keys for Join Arena Pro feature rows — title + body keep i18n type-safe. */
export const JOIN_ARENA_PRO_FEATURES = [
  {
    variant: 'leaderboard',
    titleKey: 'proFeatureLeaderboardTitle',
    bodyKey: 'proFeatureLeaderboardBody',
  },
  {
    variant: 'cloud',
    titleKey: 'proFeatureCloudSyncTitle',
    bodyKey: 'proFeatureCloudSyncBody',
  },
  {
    variant: 'dyno-intel',
    titleKey: 'proFeatureDynoIntelTitle',
    bodyKey: 'proFeatureDynoIntelBody',
  },
] as const;

export type JoinArenaProFeatureVariant = (typeof JOIN_ARENA_PRO_FEATURES)[number]['variant'];
export type JoinArenaProFeatureTitleKey = (typeof JOIN_ARENA_PRO_FEATURES)[number]['titleKey'];
export type JoinArenaProFeatureBodyKey = (typeof JOIN_ARENA_PRO_FEATURES)[number]['bodyKey'];
