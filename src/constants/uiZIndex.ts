export const Z_INDEX_CLASS = {
  topProgressBar: 'z-[42]',
  /** Join Arena sticky enter CTA — below BottomNav (`z-50`), above scroll content. */
  joinArenaFloatingCta: 'z-[45]',
  /** Tools calculator floating primary CTA (1RM / plates) — same band as Join Arena dock. */
  toolFloatingCta: 'z-[45]',
  dynoIntelTrigger: 'z-[55]',
  dynoIntelSheet: 'z-[220]',
  dynoIntelClearHistoryDialog: 'z-[250]',
  performanceBreakthroughModal: 'z-[240]',
  toolResultModal: 'z-[240]',
  /** Nested science/help sheet above somatotype report modal. */
  somatotypeScienceHelpSheet: 'z-[250]',
  ladderFilterSheet: 'z-[230]',
  /**
   * Soft ladder-tags prompt — below `optionSelectSheet` so nested job/country sheets stay on top.
   */
  ladderTagsPromptSheet: 'z-[250]',
  optionSelectSheet: 'z-[260]',
  /** Boot narrative / profile gate — sheets opened from inside must sit above this. */
  bootSequenceOverlay: 'z-[300]',
  genderSelectSheet: 'z-[320]',
  /** Native back-press exit confirm — above boot overlay so shutdown is always reachable. */
  exitConfirmModal: 'z-[330]',
  /** Genesis early-bird / Pro subscription ceremony overlays. */
  ladderGenesisModal: 'z-[340]',
  proSubscriptionResultModal: 'z-[340]',
} as const;
