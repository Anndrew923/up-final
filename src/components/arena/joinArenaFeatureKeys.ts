/** Arena namespace keys for Join Arena Pro feature rows — title + body keep i18n type-safe. */
export const JOIN_ARENA_PRO_FEATURES = [
  {
    variant: 'leaderboard',
    index: '01',
    titleKey: 'proFeatureLeaderboardTitle',
    bodyKey: 'proFeatureLeaderboardBody',
  },
  {
    variant: 'cloud',
    index: '02',
    titleKey: 'proFeatureCloudSyncTitle',
    bodyKey: 'proFeatureCloudSyncBody',
  },
  {
    variant: 'dyno-intel',
    index: '03',
    titleKey: 'proFeatureDynoIntelTitle',
    bodyKey: 'proFeatureDynoIntelBody',
  },
] as const;
