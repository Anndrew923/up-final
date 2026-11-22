import { useState, type KeyboardEvent } from 'react';
import { Layers } from 'lucide-react';
import {
  OVERALL_GRADE_DEFAULT_BAND,
  accentForTierId,
  extractHomologationZh,
  overallGradeBands,
  overallGradeLadderMeta,
  tiersForBand,
  type OverallGradeAccent,
  type OverallGradeBandId,
  type OverallGradeTier,
} from '../data/overallGradeLadder';

const ACCENT_TAB: Record<
  OverallGradeAccent,
  { selected: string; range: string; focus: string }
> = {
  energy: {
    selected: 'border-energy/50 bg-energy/10 text-energy',
    range: 'text-energy/80',
    focus: 'focus-visible:ring-energy/50',
  },
  amber: {
    selected: 'border-amber-400/50 bg-amber-400/10 text-amber-400',
    range: 'text-amber-400/80',
    focus: 'focus-visible:ring-amber-400/50',
  },
};

const ACCENT_CARD: Record<
  OverallGradeAccent,
  { shell: string; pill: string; homologation: string; structure: string }
> = {
  energy: {
    shell: 'border-white/10 bg-void/40',
    pill: 'border-white/15 bg-panel/60 text-zinc-200',
    homologation: 'text-energy',
    structure: 'text-sky-300',
  },
  amber: {
    shell: 'border-white/10 bg-void/40',
    pill: 'border-amber-400/25 bg-amber-400/5 text-amber-100/90',
    homologation: 'text-amber-400',
    structure: 'text-amber-200/90',
  },
};

/** Elite watershed chrome — only used on TIER_100 (amber band). */
const ELITE_SHELL =
  'border-amber-400/45 border-l-[3px] border-l-amber-400 bg-amber-400/[0.07]';
const ELITE_CHIP = 'border-amber-400/50 bg-amber-400/10 text-amber-400';

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
      <div className="flex min-w-0 items-start gap-3">
        <Layers className="mt-0.5 h-5 w-5 shrink-0 text-energy" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="ui-kicker-zh mb-2">{overallGradeLadderMeta.kicker}</p>
          <h2 className="font-serif text-xl text-zinc-100 sm:text-3xl">
            {overallGradeLadderMeta.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:mt-4">
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
          const tabTone = ACCENT_TAB[band.accent];
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
              className={`min-h-11 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 ${tabTone.focus} ${
                selected
                  ? tabTone.selected
                  : 'border-white/10 bg-void/40 text-zinc-300 hover:border-white/20 hover:text-zinc-100'
              }`}
            >
              <span className="block text-sm font-medium leading-snug">{band.label}</span>
              <span
                className={`mt-0.5 block font-mono text-[11px] tabular-nums ${
                  selected ? tabTone.range : 'text-zinc-500'
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
  const tone = ACCENT_CARD[accentForTierId(tier.id)];
  const homologationZh = extractHomologationZh(tier.homologation);

  return (
    <article
      className={`min-w-0 rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 ${
        isElite ? ELITE_SHELL : tone.shell
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
              isElite ? ELITE_CHIP : tone.pill
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
          className={`shrink-0 text-right text-sm font-medium leading-none ${tone.homologation}`}
        >
          {homologationZh}
        </p>
      </div>

      <p
        className={`mt-1.5 min-w-0 break-words text-xs font-semibold leading-snug sm:text-[13px] ${tone.structure}`}
      >
        {tier.structureCode}
      </p>
    </article>
  );
}
