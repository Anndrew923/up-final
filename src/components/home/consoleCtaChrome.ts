/**
 * Shared console CTA rail — fitness foil and telemetry amber only swap paint.
 * WHY: One h-12 / rounded-xl / pr-4 skeleton so tab switches cannot jump.
 */
export const CONSOLE_CTA_RAIL_CLASS =
  'relative flex h-12 w-full min-w-0 items-center overflow-hidden rounded-xl pl-4 pr-4 text-sm font-semibold uppercase tracking-wider whitespace-nowrap motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50';

export const CONSOLE_CTA_LABEL_CLASS = 'relative z-10 min-w-0 flex-1 text-center';

/** Static 135° sheen — sits under type so the plate reads as cut metal, not a loop. */
export const CONSOLE_CTA_SWEEP_CLASS =
  'pointer-events-none absolute inset-0 z-0 rounded-xl bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent';

const CONSOLE_CTA_STAMP_SHADOW_CLASS = 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]';

const CONSOLE_CTA_CLIP_CLASS = `bg-clip-text text-transparent ${CONSOLE_CTA_STAMP_SHADOW_CLASS}`;

export const CERT_LABEL_CLASS =
  `${CONSOLE_CTA_LABEL_CLASS} bg-gradient-to-b from-[#fff2cc] via-[#f3e6c8] to-[#c9a227] ${CONSOLE_CTA_CLIP_CLASS}`;

export const DIAGNOSTICS_LABEL_CLASS =
  `${CONSOLE_CTA_LABEL_CLASS} bg-gradient-to-b from-[#fff7ed] via-[#fde68a] to-[#f59e0b] ${CONSOLE_CTA_CLIP_CLASS}`;

export const CERT_CHEVRON_CLASS = `text-[#f3e6c8] ${CONSOLE_CTA_STAMP_SHADOW_CLASS}`;

export const DIAGNOSTICS_CHEVRON_CLASS = `text-amber-200 ${CONSOLE_CTA_STAMP_SHADOW_CLASS}`;

export const CERT_TRIGGER_CLASS =
  `${CONSOLE_CTA_RAIL_CLASS} border border-[#c9a227]/60 bg-[linear-gradient(135deg,#0f0d05_0%,#2a240c_25%,#5a4d1a_50%,#2a240c_75%,#0f0d05_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_0_8px_0_rgba(201,162,39,0.15)] focus-visible:outline-[#c9a227]/70`;

export const DIAGNOSTICS_TRIGGER_CLASS =
  `${CONSOLE_CTA_RAIL_CLASS} border border-amber-500/70 bg-[linear-gradient(135deg,#140e05_0%,#2e1b07_25%,#5a3d1a_50%,#2e1b07_75%,#140e05_100%)] shadow-[inset_0_1px_0_0_rgba(255,230,180,0.3),inset_0_0_8px_0_rgba(245,158,11,0.2)] focus-visible:outline-amber-500/70`;
