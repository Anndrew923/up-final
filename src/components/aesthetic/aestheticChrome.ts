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
  'flex w-full origin-center items-center justify-center gap-2 overflow-visible px-2 pt-1.5 pb-0.5 sm:gap-3';

export const FOIL_HERO_TITLE_CLASS = [
  "shrink-0 text-center font-['Songti_TC','Noto_Serif_TC','STSong',Palatino,Georgia,serif]",
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
 * 9:16 certificate stage — 10rem reserves share / selfie / close rows under the plaque.
 * WHY: Width and height share one dvh budget so the stamp cannot clip on short phones.
 */
export const CERT_STAGE_MAX_H_CLASS = 'max-h-[calc(100dvh-10rem)]';

export const CERT_STAGE_WRAP_CLASS =
  'flex w-full max-w-[min(24rem,calc((100dvh-10rem)*9/16))] shrink-0 items-center justify-center';

/** Same width budget as the 9:16 stage so action chips stay aligned under the plaque. */
export const CERT_FOOTER_WRAP_CLASS =
  'flex w-full max-w-[min(24rem,calc((100dvh-10rem)*9/16))] shrink-0 flex-col items-center gap-2 px-4';
