import { useState, type KeyboardEvent } from 'react';
import { AthleteEndorsementCard } from './AthleteEndorsementCard';
import {
  athleteRecruitInvite,
  athleteShowcaseTabs,
  featuredAthlete,
} from '../data/athletes';
import { MARKETING_POSTER_SRC } from '../config/marketingMedia';

/**
 * Homepage「專項運動員實測」— WHOOP Bento collage + title tabs.
 * WHY: One tabbed stage; verified metrics stay complete; recruit seats keep full focus copy.
 * Tabs: 2×2 phone / 4-col sm+; orange selected chrome matches section kicker.
 */

export function AthletesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = athleteShowcaseTabs[activeIndex];

  const focusTab = (index: number) => {
    setActiveIndex(index);
    requestAnimationFrame(() => {
      document
        .getElementById(`athlete-tab-${athleteShowcaseTabs[index].id}`)
        ?.focus();
    });
  };

  const onTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const last = athleteShowcaseTabs.length - 1;
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
    focusTab(next);
  };

  return (
    <div className="min-w-0">
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="tablist"
        aria-label="專項運動員實測"
      >
        {athleteShowcaseTabs.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`athlete-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`athlete-tab-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`min-h-11 rounded-xl border px-2.5 py-2 text-left text-sm font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 sm:px-3 ${
                selected
                  ? 'border-orange-400/70 bg-orange-500/15 text-orange-300'
                  : 'border-white/10 bg-void/40 text-zinc-300 hover:border-white/20 hover:text-zinc-100'
              }`}
            >
              {item.tab}
            </button>
          );
        })}
      </div>

      <div
        id={`athlete-tab-panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`athlete-tab-${active.id}`}
        className="mt-4 sm:mt-5"
      >
        {active.kind === 'verified' ? (
          <AthleteEndorsementCard athlete={featuredAthlete} />
        ) : (
          <RecruitBento
            title={active.recruit.title}
            focus={active.recruit.focus}
          />
        )}
      </div>
    </div>
  );
}

function RecruitBento({ title, focus }: { title: string; focus: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5 sm:gap-4">
      {/* Visual rail — single recruit badge (no duplicate on copy rail). */}
      <article className="relative min-h-[160px] overflow-hidden rounded-2xl border border-orange-400/20 bg-zinc-950 sm:col-span-2">
        <img
          src={MARKETING_POSTER_SRC}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-[1px]"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-orange-500/20" />
        <div className="relative flex h-full min-h-[160px] flex-col justify-end p-4">
          <span className="inline-flex w-fit items-center rounded-md border border-orange-400/40 bg-orange-500/10 px-2 py-1 font-mono text-[11px] tracking-wide text-orange-300">
            標竿席位開放申請
          </span>
          <p className="mt-3 font-mono text-[10px] tracking-wide text-zinc-400">
            BENCHMARK // OPEN
          </p>
        </div>
      </article>

      <article className="ui-card relative overflow-hidden p-4 sm:col-span-3 sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-orange-400/10 opacity-50 [mask-image:radial-gradient(circle_at_top_left,black,transparent_55%)]"
          aria-hidden
        />
        <div className="relative">
          <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">
            {title}
          </h3>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-300">
            {focus}
          </p>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400">
            {athleteRecruitInvite}
          </p>
        </div>
      </article>
    </div>
  );
}
