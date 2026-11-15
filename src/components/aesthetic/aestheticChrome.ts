/**
 * Champagne foil tokens for the anatomical certificate plaque.
 * WHY: Armor, title, and caliper must share one hex set — class strings stay literal for Tailwind JIT.
 */
export const FOIL_HEX = {
  light: '#f3e6c8',
  mid: '#c9a227',
  deep: '#7a5c28',
} as const;

/**
 * Hero grade stamp — fluid clamp so CJK reads large while the longest EN
 * overall title stays one line; wings shrink before the title wraps.
 */
export const FOIL_HERO_STAMP_CLASS =
  'flex w-full origin-center items-center justify-center gap-2 overflow-visible px-2 pt-1 pb-0 sm:gap-3';

export const FOIL_HERO_TITLE_CLASS = [
  "shrink-0 text-center font-['UPSerifTC','Songti_TC','Noto_Serif_TC','STSong',Palatino,Georgia,serif]",
  "[font-feature-settings:'palt'] antialiased font-bold uppercase whitespace-nowrap",
  'tracking-[0.2em] pl-[0.2em]',
  'text-[clamp(1.2rem,4.8vw,1.45rem)] leading-normal',
  'bg-gradient-to-b from-[#fff6d6] via-[#f3e6c8] to-[#c9a227] bg-clip-text text-transparent',
  'drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]',
].join(' ');

export const FOIL_HERO_WING_LEFT_CLASS =
  'h-px w-4 min-w-0 shrink bg-gradient-to-r from-transparent to-[#c9a227]/70 sm:w-6';

export const FOIL_HERO_WING_RIGHT_CLASS =
  'h-px w-4 min-w-0 shrink bg-gradient-to-l from-transparent to-[#c9a227]/70 sm:w-6';

export const FOIL_RULE_CLASS = 'border-[#c9a227]/20';

export const FOIL_KICKER_CLASS = 'text-[#c9a227]/80';

export const FOIL_NUMERAL_CLASS = 'text-[#f3e6c8]';

export const FOIL_PLATE_CLASS =
  'inline-flex shrink-0 items-center justify-center border border-[#c9a227]/65 bg-gradient-to-b from-[#f3e6c8]/20 to-[#7a5c28]/35 px-1 py-px text-[7px] tracking-[0.12em] text-[#f3e6c8]';

/**
 * Plate/preview viewport inside the flex-1 stage.
 * WHY: Height follows the stage (`h-full`) so ResizeObserver always has a real box —
 * absolute plate children cannot collapse an `h-auto` article to 0×0. Stage wrap
 * `overflow-hidden` is the hard fence so a wide aspect never paints over 預設/關閉.
 * Class strings stay literal for Tailwind JIT (no template interpolation).
 */
export const CERT_STAGE_FIT_CLASS = 'h-full max-h-full w-auto max-w-full';

export const CERT_STAGE_WRAP_CLASS =
  'flex min-h-0 w-full max-w-[min(24rem,100%)] flex-1 items-center justify-center overflow-hidden';
/**
 * Format pill — owns top safe-area. Modal shell must NOT also apply top inset.
 */
export const CERT_ASPECT_PILL_WRAP_CLASS =
  'mb-2.5 flex w-full max-w-[min(24rem,100%)] shrink-0 justify-center px-8 pt-[max(0.75rem,env(safe-area-inset-top,0px))]';

/**
 * Same max-width as the stage — full-bleed Share aligns with the plaque.
 * Horizontal inset: modal `px-4`. Bottom inset: `.ui-modal-safe-footer` only.
 */
export const CERT_FOOTER_WRAP_CLASS =
  'flex w-full max-w-[min(24rem,100%)] shrink-0 flex-col items-center gap-2.5';
