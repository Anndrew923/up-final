/**
 * Champagne foil tokens for the anatomical certificate plaque.
 * WHY: Armor, title, and caliper must share one hex set — class strings stay literal for Tailwind JIT.
 */
export const FOIL_HEX = {
  light: '#f3e6c8',
  mid: '#c9a227',
  deep: '#7a5c28',
} as const;

export const FOIL_TITLE_CLASS =
  'bg-gradient-to-b from-[#f3e6c8] via-[#c9a227] to-[#7a5c28] bg-clip-text text-transparent';

/**
 * Hero grade stamp — clamp + nowrap so 15-char EN titles stay one line inside 9:16.
 * WHY: tracking-[0.18em] at 1.55rem overflowed max-w-[13rem] even after copy shrink.
 */
export const FOIL_HERO_TITLE_CLASS =
  `min-w-0 flex-1 text-center text-[clamp(1.05rem,4.8vw,1.55rem)] font-bold leading-none tracking-[0.08em] whitespace-nowrap ${FOIL_TITLE_CLASS}`;

export const FOIL_RULE_CLASS = 'border-[#c9a227]/20';

export const FOIL_BRACKET_CLASS = 'text-[#c9a227]';

export const FOIL_KICKER_CLASS = 'text-[#c9a227]/80';

export const FOIL_NUMERAL_CLASS = 'text-[#f3e6c8]';

export const FOIL_PLATE_CLASS =
  'inline-flex shrink-0 items-center justify-center border border-[#c9a227]/65 bg-gradient-to-b from-[#f3e6c8]/20 to-[#7a5c28]/35 px-1 py-px text-[7px] tracking-[0.12em] text-[#f3e6c8]';

/**
 * 9:16 certificate stage — 5rem reserves the close row + gap under the plaque.
 * WHY: Width and height share one dvh budget so the stamp cannot clip on short phones.
 */
export const CERT_STAGE_MAX_H_CLASS = 'max-h-[calc(100dvh-5rem)]';

export const CERT_STAGE_WRAP_CLASS =
  'flex w-full max-w-[min(24rem,calc((100dvh-5rem)*9/16))] shrink-0 items-center justify-center';

/** Console fitness-mode spec trigger — foil hairline, not cyan/zinc disabled chrome. */
export const CERT_TRIGGER_CLASS =
  'inline-flex h-12 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#c9a227]/50 bg-[#121214] px-3 text-sm font-medium text-[#f3e6c8] transition-colors hover:border-[#c9a227] hover:bg-[#1a1a1e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]/70 disabled:pointer-events-none disabled:opacity-40';
