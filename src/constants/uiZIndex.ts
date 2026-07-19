export const Z_INDEX_CLASS = {
  topProgressBar: 'z-[42]',
  dynoIntelTrigger: 'z-[55]',
  dynoIntelSheet: 'z-[220]',
  dynoIntelClearHistoryDialog: 'z-[250]',
  performanceBreakthroughModal: 'z-[240]',
  toolResultModal: 'z-[240]',
  /** Nested science/help sheet above somatotype report modal. */
  somatotypeScienceHelpSheet: 'z-[250]',
  ladderFilterSheet: 'z-[230]',
  optionSelectSheet: 'z-[260]',
  /** Boot narrative / profile gate — sheets opened from inside must sit above this. */
  bootSequenceOverlay: 'z-[300]',
  genderSelectSheet: 'z-[320]',
  /** Native back-press exit confirm — above boot overlay so shutdown is always reachable. */
  exitConfirmModal: 'z-[330]',
} as const;
