import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Layers } from 'lucide-react';
import {
  OVERALL_GRADE_DEFAULT_BAND,
  extractHomologationZh,
  overallGradeBands,
  overallGradeLadderMeta,
  tiersForBand,
  type OverallGradeBandId,
  type OverallGradeTier,
} from '../data/overallGradeLadder';

/**
 * WHY: Single amber chrome for the whole hall — band.accent in data stays for taxonomy,
 * but UI no longer forks energy-blue vs amber (avoids mono-cyan bleed from #systems).
 */
const HALL_TAB = {
  selected: 'border-amber-400/70 bg-amber-500/15 text-amber-300',
  range: 'text-fg-muted',
  focus: 'focus-visible:ring-amber-400/50',
} as const;

const HALL_CARD = {
  shell: 'border-white/10 bg-black/30',
  pill: 'border-amber-400/25 bg-amber-500/5 text-fg',
  homologation: 'text-energy',
  structure: 'text-fg-secondary',
} as const;

/** Elite watershed chrome — only used on TIER_100 (amber band). */
const ELITE_SHELL =
  'border-amber-400/45 border-l-[3px] border-l-amber-400 bg-amber-400/[0.07]';
const ELITE_CHIP = 'border-amber-400/50 bg-amber-400/10 text-amber-400';

/**
 * Decorative axis fills per probe band — Tailwind width classes only.
 * WHY: Watermark bars must visibly track the active band (not a static six-pack),
 * while staying presentational (no scoring math).
 */
const TELEMETRY_WIDTHS: Record<
  OverallGradeBandId,
  readonly [string, string, string, string, string, string]
> = {
  foundation: ['w-[30%]', 'w-[45%]', 'w-[38%]', 'w-[52%]', 'w-[42%]', 'w-1/2'],
  norm: ['w-[55%]', 'w-4/5', 'w-[42%]', 'w-[95%]', 'w-[68%]', 'w-3/4'],
  overclock: ['w-[70%]', 'w-[88%]', 'w-[60%]', 'w-full', 'w-[78%]', 'w-[85%]'],
  pantheon: ['w-[82%]', 'w-[95%]', 'w-[75%]', 'w-full', 'w-[90%]', 'w-[92%]'],
};

/**
 * Bottom-only fade — keeps left/right amber glow intact (no radial side wipe).
 * WHY: Radial mask muted the wing phones; linear bottom fade clears into the tabs.
 */
const WATERMARK_MASK =
  '[-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]';

const PHONE_GLOW_BORDER =
  'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_28px_-4px_rgba(245,158,11,0.55)]';

/** Quiet hex filament — left wing only; stroke via currentColor (no glyph copy). */
function HexFilamentMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-14 w-14 text-amber-300/80 sm:h-16 sm:w-16"
      aria-hidden
    >
      <polygon
        points="32,6 54,19 54,45 32,58 10,45 10,19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <polygon
        points="32,14 46,22 46,42 32,50 18,42 18,22"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.45"
      />
      <polygon
        points="32,18 44,25 42,40 32,46 20,38 22,24"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <line
        x1="32"
        y1="18"
        x2="32"
        y2="46"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.5"
      />
      <line
        x1="22"
        y1="24"
        x2="42"
        y2="40"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.4"
      />
      <line
        x1="42"
        y1="25"
        x2="20"
        y2="38"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.4"
      />
      <circle cx="32" cy="32" r="1.8" fill="currentColor" />
    </svg>
  );
}

function WatermarkPhoneShell({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b p-2 ${PHONE_GLOW_BORDER} ${className}`}
    >
      <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-amber-400/45" />
      {children}
    </div>
  );
}

/**
 * Dual-phone watermark — geometry + band-linked bars only (zero copy).
 * WHY: Any GRADE/TELEMETRY glyphs fought the H2; pure filaments keep wing glow
 * and stage rhythm without reclaiming document-flow height.
 */
function DualPhoneWatermark({ bandId }: { bandId: OverallGradeBandId }) {
  const barWidths = TELEMETRY_WIDTHS[bandId];

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center opacity-35 sm:opacity-40 ${WATERMARK_MASK}`}
      aria-hidden
    >
      <div className="relative h-[200px] w-[min(100%,28rem)] sm:h-[220px] sm:w-[min(100%,32rem)]">
        {/* Right wing — amber telemetry bars (length tracks active band). */}
        <WatermarkPhoneShell className="absolute right-0 top-4 w-[42%] translate-x-8 rotate-[8deg] from-zinc-800 to-zinc-950 sm:right-2 sm:w-[38%] sm:translate-x-12">
          <div className="flex min-h-[7.5rem] flex-col justify-center gap-1.5 rounded-xl bg-void/80 px-2.5 py-3 sm:min-h-[8.25rem]">
            {barWidths.map((widthClass, i) => (
              <div
                key={`bar-${i}`}
                className="h-1.5 overflow-hidden rounded-full bg-zinc-800/90"
              >
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-200 shadow-[0_0_6px_rgba(251,191,36,0.65)] ${widthClass}`}
                />
              </div>
            ))}
          </div>
        </WatermarkPhoneShell>

        {/* Left wing — hex filament only (paints above right for depth). */}
        <WatermarkPhoneShell className="absolute left-0 top-0 w-[46%] -translate-x-8 -rotate-[5deg] from-[#2a2114] to-zinc-950 sm:left-2 sm:w-[40%] sm:-translate-x-12">
          <div className="flex min-h-[7.5rem] w-full items-center justify-center rounded-xl border border-amber-400/35 bg-black/55 px-2 sm:min-h-[8.25rem]">
            <HexFilamentMark />
          </div>
        </WatermarkPhoneShell>
      </div>
    </div>
  );
}

/**
 * Homepage「戰力段位光譜」— 4-band probe + dense two-line accent cards.
 * WHY: Zero horizontal scroll; ZH-only homologation + structure-only second row keep cards two lines.
 */
export function OverallGradeLadderCard() {
  const [activeBand, setActiveBand] = useState<OverallGradeBandId>(
    OVERALL_GRADE_DEFAULT_BAND
  );
  const tiers = tiersForBand(activeBand);

  const focusBand = (bandId: OverallGradeBandId) => {
    setActiveBand(bandId);
    requestAnimationFrame(() => {
      document.getElementById(`grade-band-${bandId}`)?.focus();
    });
  };

  const onTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const last = overallGradeBands.length - 1;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = index === last ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = index === 0 ? last : index - 1;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = last;
    } else {
      return;
    }
    event.preventDefault();
    focusBand(overallGradeBands[next].id);
  };

  return (
    <div className="min-w-0">
      {/*
        No ui-section-head mb-10 — DualPhone is glyph-free watermark; wings need
        overflow-visible (page root already clips x-scroll).
      */}
      <div className="relative mx-auto max-w-2xl overflow-visible text-center">
        <DualPhoneWatermark bandId={activeBand} />
        <div className="relative z-10">
          {/* WHY: Amber kicker — ladder section is the cool→warm mid-page climax. */}
          <p className="ui-kicker-zh">
            <span className="inline-flex items-center justify-center gap-2">
              <Layers className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
              {overallGradeLadderMeta.kicker}
            </span>
          </p>
          <h2 className="ui-h2 mt-2 sm:mt-3">
            {overallGradeLadderMeta.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-secondary sm:mt-4">
            {overallGradeLadderMeta.lead}
          </p>
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4"
        role="tablist"
        aria-label="戰力段位階段"
      >
        {overallGradeBands.map((band, index) => {
          const selected = band.id === activeBand;
          return (
            <button
              key={band.id}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              id={`grade-band-${band.id}`}
              aria-controls="grade-band-panel"
              onClick={() => setActiveBand(band.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`min-h-11 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 ${HALL_TAB.focus} ${
                selected
                  ? HALL_TAB.selected
                  : 'border-white/10 bg-void/40 text-fg-secondary hover:border-white/20 hover:text-fg'
              }`}
            >
              <span className="block text-sm font-medium leading-snug">{band.label}</span>
              <span
                className={`mt-0.5 block font-mono text-xs tabular-nums ${
                  selected ? HALL_TAB.range : 'text-fg-muted'
                }`}
              >
                {band.rangeHint}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="grade-band-panel"
        role="tabpanel"
        aria-labelledby={`grade-band-${activeBand}`}
        className="mt-3 space-y-2.5 sm:mt-4"
      >
        {tiers.map((tier) => (
          <GradeTierCard key={tier.id} tier={tier} />
        ))}
      </div>
    </div>
  );
}

function GradeTierCard({ tier }: { tier: OverallGradeTier }) {
  const isElite = Boolean(tier.eliteWatershed);
  const homologationZh = extractHomologationZh(tier.homologation);

  return (
    <article
      className={`min-w-0 rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 ${
        isElite ? ELITE_SHELL : HALL_CARD.shell
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-xs tabular-nums ${
              isElite ? ELITE_CHIP : HALL_CARD.pill
            }`}
          >
            {tier.scoreRange}
          </span>
          {isElite ? (
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs tracking-wide ${ELITE_CHIP}`}
            >
              {overallGradeLadderMeta.eliteBadge}
            </span>
          ) : null}
          <span className="text-sm font-semibold text-fg">
            {tier.physiologyClass}
          </span>
        </div>
        <p
          className={`shrink-0 text-right text-sm font-medium leading-none ${HALL_CARD.homologation}`}
        >
          {homologationZh}
        </p>
      </div>

      <p
        className={`mt-1.5 min-w-0 break-words text-xs font-semibold leading-snug sm:text-sm ${HALL_CARD.structure}`}
      >
        {tier.structureCode}
      </p>
    </article>
  );
}
