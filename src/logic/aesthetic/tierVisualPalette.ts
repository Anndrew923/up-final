/**
 * Shared decade → visual chroma for assessment honor cards.
 * WHY: Score numeral, NormBadge, panel hairline, and ambient border must share one ladder
 * so a single card never mixes page-fixed violet chrome with cyan score + amber CTAs.
 */

export type TierVisualBand =
  | 'zinc'
  | 'cyan'
  | 'amber'
  | 'orange'
  | 'violet'
  | 'champagne';

export interface TierVisualPalette {
  band: TierVisualBand;
  /** Hero score text color (panel variant). */
  scoreTextClass: string;
  /** Hero score drop-shadow glow (panel variant). */
  scoreGlowClass: string;
  /** Spec-card border + ambient inset/outer shadow. */
  panelSectionClass: string;
  /** Top hairline gradient mid stop (`via-*`). */
  panelGradientClass: string;
  /**
   * NormBadge capsule classes (border / fill / text / glow).
   * @param interactive When true, appends hue-matched hover fills.
   */
  badgeClass: (interactive?: boolean) => string;
}

function parseDecade(decadeKey: string | null | undefined): number {
  const decade = Number(decadeKey);
  return Number.isFinite(decade) ? decade : NaN;
}

function withHover(base: string, hover: string, interactive: boolean): string {
  return interactive ? `${base} ${hover}` : base;
}

const ZINC: TierVisualPalette = {
  band: 'zinc',
  scoreTextClass: 'text-zinc-200',
  scoreGlowClass: 'drop-shadow-[0_0_10px_rgba(161,161,170,0.35)]',
  panelSectionClass:
    'border-zinc-500/35 shadow-[inset_0_1px_0_rgba(161,161,170,0.15),0_0_24px_rgba(113,113,122,0.12)]',
  panelGradientClass: 'via-zinc-400/55',
  badgeClass: (interactive = false) =>
    withHover(
      'border-zinc-400/45 bg-zinc-500/10 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
      'hover:bg-zinc-500/20',
      interactive
    ),
};

const CYAN: TierVisualPalette = {
  band: 'cyan',
  scoreTextClass: 'text-sky-300',
  scoreGlowClass: 'drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]',
  panelSectionClass:
    'border-sky-400/35 shadow-[inset_0_1px_0_rgba(125,211,252,0.2),0_0_28px_rgba(56,189,248,0.14)]',
  panelGradientClass: 'via-sky-400/65',
  badgeClass: (interactive = false) =>
    withHover(
      'border-sky-400/45 bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(125,211,252,0.18)] drop-shadow-[0_0_6px_rgba(56,189,248,0.25)]',
      'hover:bg-sky-500/20',
      interactive
    ),
};

const AMBER: TierVisualPalette = {
  band: 'amber',
  scoreTextClass: 'text-amber-300',
  scoreGlowClass: 'drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]',
  panelSectionClass:
    'border-amber-400/35 shadow-[inset_0_1px_0_rgba(251,191,36,0.2),0_0_28px_rgba(245,158,11,0.14)]',
  panelGradientClass: 'via-amber-400/65',
  badgeClass: (interactive = false) =>
    withHover(
      'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[inset_0_1px_0_rgba(251,191,36,0.2)] drop-shadow-[0_0_6px_rgba(251,191,36,0.28)]',
      'hover:bg-amber-500/20',
      interactive
    ),
};

const ORANGE: TierVisualPalette = {
  band: 'orange',
  scoreTextClass: 'text-orange-300',
  scoreGlowClass: 'drop-shadow-[0_0_12px_rgba(251,146,60,0.45)]',
  panelSectionClass:
    'border-orange-400/35 shadow-[inset_0_1px_0_rgba(251,146,60,0.22),0_0_28px_rgba(249,115,22,0.14)]',
  panelGradientClass: 'via-orange-400/65',
  badgeClass: (interactive = false) =>
    withHover(
      'border-orange-400/50 bg-orange-500/10 text-orange-300 shadow-[inset_0_1px_0_rgba(251,146,60,0.2)] drop-shadow-[0_0_6px_rgba(251,146,60,0.28)]',
      'hover:bg-orange-500/20',
      interactive
    ),
};

const VIOLET: TierVisualPalette = {
  band: 'violet',
  scoreTextClass: 'text-violet-300',
  scoreGlowClass: 'drop-shadow-[0_0_12px_rgba(167,139,250,0.45)]',
  panelSectionClass:
    'border-violet-400/35 shadow-[inset_0_1px_0_rgba(167,139,250,0.22),0_0_28px_rgba(139,92,246,0.14)]',
  panelGradientClass: 'via-violet-400/65',
  badgeClass: (interactive = false) =>
    withHover(
      'border-violet-400/50 bg-violet-500/10 text-violet-300 shadow-[inset_0_1px_0_rgba(167,139,250,0.2)] drop-shadow-[0_0_6px_rgba(167,139,250,0.28)]',
      'hover:bg-violet-500/20',
      interactive
    ),
};

const CHAMPAGNE: TierVisualPalette = {
  band: 'champagne',
  scoreTextClass: 'text-amber-200',
  scoreGlowClass: 'drop-shadow-[0_0_14px_rgba(251,191,36,0.5)]',
  panelSectionClass:
    'border-amber-300/40 shadow-[inset_0_1px_0_rgba(253,230,138,0.22),0_0_30px_rgba(245,158,11,0.16)]',
  panelGradientClass: 'via-amber-300/70',
  badgeClass: (interactive = false) =>
    withHover(
      'border-amber-300/55 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 text-amber-200 shadow-[inset_0_1px_0_rgba(253,230,138,0.22)] drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]',
      'hover:from-amber-500/25 hover:via-amber-500/10 hover:to-orange-500/15',
      interactive
    ),
};

/**
 * Map human-scale decadeKey → shared honor-card chroma.
 * Bands mirror NormBadge historical thresholds so badge + score + panel never diverge.
 */
export function resolveTierVisualPalette(
  decadeKey: string | null | undefined
): TierVisualPalette {
  const decade = parseDecade(decadeKey);
  if (!Number.isFinite(decade) || decade < 60) return ZINC;
  if (decade < 70) return CYAN;
  if (decade < 100) return AMBER;
  if (decade < 120) return ORANGE;
  if (decade < 140) return VIOLET;
  return CHAMPAGNE;
}
