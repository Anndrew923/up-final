/** Query `from` values for contextual Join Arena copy and analytics. */
export type JoinArenaFrom = 'ladder' | 'backup' | 'settings';

/** Visual gate sheet variants — auth (sign-in) vs pro (arena upgrade). */
export type GateSheetKind = 'auth' | 'pro';

/** Join Arena entry points surfaced by UI gate decisions (excludes settings-only flows). */
export type UiGateJoinArenaFrom = Extract<JoinArenaFrom, 'ladder' | 'backup'>;
