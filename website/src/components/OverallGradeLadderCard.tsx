import { useState, type KeyboardEvent } from 'react';
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
  range: 'text-amber-300/80',
  focus: 'focus-visible:ring-amber-400/50',
} as const;

const HALL_CARD = {
  shell: 'border-white/10 bg-black/30',
  pill: 'border-amber-400/25 bg-amber-500/5 text-amber-100/90',
  homologation: 'text-amber-400',
  structure: 'text-amber-300/90',
} as const;

/** Elite watershed chrome — only used on TIER_100 (amber band). */
const ELITE_SHELL =
  'border-amber-400/45 border-l-[3px] border-l-amber-400 bg-amber-400/[0.07]';
const ELITE_CHIP = 'border-amber-400/50 bg-amber-400/10 text-amber-400';

/** Decorative axis fill widths — Tailwind classes avoid inline style churn. */
const TELEMETRY_BARS = [
  { id: 'a1', widthClass: 'w-[55%]' },
  { id: 'a2', widthClass: 'w-4/5' },
  { id: 'a3', widthClass: 'w-[42%]' },
  { id: 'a4', widthClass: 'w-[95%]' },
  { id: 'a5', widthClass: 'w-[68%]' },
  { id: 'a6', widthClass: 'w-3/4' },
] as const;

/**
 * Ladder dual-phone stage — primary grade card + offset telemetry twin.
 * WHY: Adds depth without replacing the 14-tier interactive list.
 */
function DualPhoneStage({
  bandLabel,
  rangeHint,
  sampleTier,
}: {
  bandLabel: string;
  rangeHint: string;
  sampleTier: OverallGradeTier | undefined;
}) {
  const homologationZh = sampleTier
    ? extractHomologationZh(sampleTier.homologation)
    : '超跑遙測';

  return (
    <div className="relative mx-auto mb-6 h-[220px] w-full max-w-sm sm:mb-8 sm:h-[250px]">
      {/* Secondary phone — telemetry spectrum (offset behind). */}
      <div
        className="absolute right-2 top-4 w-[42%] rotate-[8deg] rounded-2xl border border-amber-400/25 bg-gradient-to-b from-zinc-800 to-zinc-950 p-2 shadow-xl sm:right-6 sm:w-[40%]"
        aria-hidden
      >
        <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-zinc-700" />
        <div className="rounded-xl bg-void/80 p-2.5">
          <p className="font-mono text-[8px] tracking-wide text-amber-400/80">
            TELEMETRY
          </p>
          <p className="mt-1 font-mono text-[10px] text-zinc-200">超跑遙測頻譜</p>
          <div className="mt-2 space-y-1">
            {TELEMETRY_BARS.map((bar, i) => (
              <div key={bar.id} className="flex items-center gap-1">
                <span className="w-4 font-mono text-[7px] text-zinc-500">
                  A{i + 1}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-amber-600/80 to-amber-300 ${bar.widthClass}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[8px] text-zinc-500">{homologationZh}</p>
        </div>
      </div>

      {/* Primary phone — grade readout (front). */}
      <div className="absolute left-2 top-0 w-[48%] -rotate-[5deg] rounded-2xl border border-amber-400/45 bg-gradient-to-b from-[#2a2114] to-zinc-950 p-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] sm:left-4 sm:w-[44%]">
        <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-amber-400/30" />
        <div className="rounded-xl border border-amber-400/20 bg-black/50 p-2.5">
          <p className="font-mono text-[8px] tracking-wide text-amber-300">
            GRADE // LIVE
          </p>
          <p className="mt-1.5 text-sm font-semibold text-zinc-50">{bandLabel}</p>
          <p className="mt-0.5 font-mono text-[10px] tabular-nums text-amber-300/90">
            {rangeHint}
          </p>
          {sampleTier ? (
            <>
              <p className="mt-2 font-mono text-[9px] text-amber-200/90">
                {sampleTier.scoreRange}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-zinc-200">
                {sampleTier.physiologyClass}
              </p>
            </>
          ) : null}
        </div>
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
  const activeBandMeta = overallGradeBands.find((b) => b.id === activeBand);
  const sampleTier = tiers[Math.min(1, tiers.length - 1)] ?? tiers[0];

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
      <div className="flex min-w-0 items-start gap-3">
        <Layers className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1">
          {/* WHY: Amber kicker — ladder section is the cool→warm mid-page climax. */}
          <p className="ui-kicker-zh-amber mb-2">
            {overallGradeLadderMeta.kicker}
          </p>
          <h2 className="font-serif text-xl text-zinc-100 sm:text-3xl">
            {overallGradeLadderMeta.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:mt-4">
            {overallGradeLadderMeta.lead}
          </p>
        </div>
      </div>

      <DualPhoneStage
        bandLabel={activeBandMeta?.label ?? ''}
        rangeHint={activeBandMeta?.rangeHint ?? ''}
        sampleTier={sampleTier}
      />

      <div
        className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4"
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
                  : 'border-white/10 bg-void/40 text-zinc-300 hover:border-white/20 hover:text-zinc-100'
              }`}
            >
              <span className="block text-sm font-medium leading-snug">{band.label}</span>
              <span
                className={`mt-0.5 block font-mono text-[11px] tabular-nums ${
                  selected ? HALL_TAB.range : 'text-zinc-500'
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
        className="mt-4 space-y-2.5 sm:mt-5"
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
            className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
              isElite ? ELITE_CHIP : HALL_CARD.pill
            }`}
          >
            {tier.scoreRange}
          </span>
          {isElite ? (
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${ELITE_CHIP}`}
            >
              {overallGradeLadderMeta.eliteBadge}
            </span>
          ) : null}
          <span className="text-sm font-semibold text-zinc-50">
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
        className={`mt-1.5 min-w-0 break-words text-xs font-semibold leading-snug sm:text-[13px] ${HALL_CARD.structure}`}
      >
        {tier.structureCode}
      </p>
    </article>
  );
}
