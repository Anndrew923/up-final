import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AthleteEndorsementCard } from './AthleteEndorsementCard';
import {
  athleteMonogram,
  athletePickerImageSrc,
  athleteRecruitInvite,
  filtersWithRosterHits,
  rosterForFilter,
  type AthleteFilterId,
  type AthleteRosterEntry,
  type CommunityAthleteEntry,
  type OpenAthleteEntry,
} from '../data/athletes';

/**
 * Homepage「專項運動員實測」— filter rail + single-row picker + kind-driven cards.
 * WHY: Roster is append-only in `data/athletes.ts`; UI never hardcodes headcount.
 * Single-row snap scroller keeps 20–30 people on one phone screen with the detail card.
 */

const ATHLETE_TAB_PANEL_ID = 'athlete-tab-panel';

/** Hide native scrollbars while keeping touch/trackpad pan. */
const HIDE_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function AthletesShowcase() {
  const visibleFilters = useMemo(() => filtersWithRosterHits(), []);
  const [filter, setFilter] = useState<AthleteFilterId>('all');
  const filtered = useMemo(() => rosterForFilter(filter), [filter]);
  const [activeId, setActiveId] = useState(filtered[0]?.id ?? '');

  // WHY: Filter rail hides empty categories — if roster changes, snap back to `all`.
  useEffect(() => {
    if (!visibleFilters.some((def) => def.id === filter)) {
      setFilter('all');
    }
  }, [visibleFilters, filter]);

  // WHY: Changing filter may drop the active id — keep selection inside the list.
  useEffect(() => {
    setActiveId((current) =>
      filtered.some((entry) => entry.id === current)
        ? current
        : (filtered[0]?.id ?? '')
    );
  }, [filtered]);

  const active =
    filtered.find((entry) => entry.id === activeId) ?? filtered[0] ?? null;

  const selectEntry = (entry: AthleteRosterEntry) => {
    setActiveId(entry.id);
    requestAnimationFrame(() => {
      document
        .getElementById(`athlete-pick-${entry.id}`)
        ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    });
  };

  const focusEntry = (index: number) => {
    const entry = filtered[index];
    if (!entry) return;
    selectEntry(entry);
    requestAnimationFrame(() => {
      document.getElementById(`athlete-pick-${entry.id}`)?.focus();
    });
  };

  const onPickKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const last = filtered.length - 1;
    if (last < 0) return;
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
    focusEntry(next);
  };

  return (
    <div className="min-w-0">
      <div
        className={`flex gap-2 overflow-x-auto pb-1 ${HIDE_SCROLLBAR}`}
        role="toolbar"
        aria-label="運動員分類篩選"
      >
        {visibleFilters.map((def) => {
          const selected = def.id === filter;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => setFilter(def.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 sm:text-[11px] ${
                selected
                  ? 'border-orange-400/70 bg-orange-500/15 text-orange-300'
                  : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              {def.label}
            </button>
          );
        })}
      </div>

      <div
        className={`mt-3 flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory ${HIDE_SCROLLBAR}`}
        role="tablist"
        aria-label="專項運動員實測"
      >
        {filtered.map((entry, index) => {
          const selected = entry.id === active?.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              id={`athlete-pick-${entry.id}`}
              aria-selected={selected}
              aria-controls={ATHLETE_TAB_PANEL_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectEntry(entry)}
              onKeyDown={(event) => onPickKeyDown(event, index)}
              className={`flex w-[4.75rem] shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 sm:w-[5.25rem] ${
                selected
                  ? 'border-orange-400/70 bg-orange-500/15'
                  : 'border-white/10 bg-void/40 hover:border-white/20'
              }`}
            >
              <PickerAvatar entry={entry} selected={selected} />
              <span
                className={`w-full truncate text-center text-[11px] font-medium leading-tight ${
                  selected ? 'text-orange-200' : 'text-zinc-200'
                }`}
              >
                {entry.name}
              </span>
              <span
                className={`w-full truncate text-center font-mono text-[9px] leading-tight tracking-wide ${
                  selected ? 'text-orange-300/80' : 'text-zinc-500'
                }`}
              >
                {entry.pickerTag}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={ATHLETE_TAB_PANEL_ID}
        role="tabpanel"
        aria-labelledby={active ? `athlete-pick-${active.id}` : undefined}
        className="mt-3 sm:mt-3.5"
      >
        {active ? (
          <AthleteDetailCard entry={active} />
        ) : (
          <p className="rounded-xl border border-white/10 bg-void/40 px-3 py-4 text-center text-sm text-zinc-400">
            此分類尚無成員，歡迎稍後回來查看。
          </p>
        )}
      </div>
    </div>
  );
}

function PickerAvatar({
  entry,
  selected,
}: {
  entry: AthleteRosterEntry;
  selected: boolean;
}) {
  const src = athletePickerImageSrc(entry);
  if (src) {
    return (
      <span
        className={`relative h-11 w-11 overflow-hidden rounded-full border sm:h-12 sm:w-12 ${
          selected ? 'border-orange-400/70' : 'border-white/15'
        }`}
      >
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover object-top"
          decoding="async"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full border font-mono text-sm font-semibold sm:h-12 sm:w-12 ${
        selected
          ? 'border-orange-400/70 bg-orange-500/20 text-orange-200'
          : 'border-white/15 bg-zinc-900 text-zinc-300'
      }`}
      aria-hidden
    >
      {athleteMonogram(entry.name)}
    </span>
  );
}

function AthleteDetailCard({ entry }: { entry: AthleteRosterEntry }) {
  if (entry.kind === 'verified') {
    return <AthleteEndorsementCard athlete={entry} />;
  }
  if (entry.kind === 'community') {
    return <CommunityFeedbackCard entry={entry} />;
  }
  return <OpenSeatCard entry={entry} />;
}

function AthleteCardShell({
  washOpacity = 'opacity-50',
  children,
}: {
  washOpacity?: string;
  children: ReactNode;
}) {
  return (
    <article className="ui-card relative overflow-hidden p-3 sm:p-3.5">
      <div
        className={`pointer-events-none absolute inset-0 bg-orange-400/10 ${washOpacity} [mask-image:radial-gradient(circle_at_top_left,black,transparent_55%)]`}
        aria-hidden
      />
      <div className="relative min-w-0">{children}</div>
    </article>
  );
}

function OpenSeatCard({ entry }: { entry: OpenAthleteEntry }) {
  return (
    <AthleteCardShell>
      <span className="inline-flex items-center rounded-md border border-orange-400/40 bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-orange-300 sm:text-[11px]">
        標竿席位開放申請
      </span>
      <h3 className="mt-2 text-base font-semibold text-zinc-100 sm:text-lg">
        {entry.title}
      </h3>
      <p className="mt-1.5 text-pretty text-sm leading-snug text-zinc-300 sm:leading-relaxed">
        {entry.focus}
      </p>
      <p className="mt-2 text-pretty text-sm leading-snug text-zinc-400 sm:leading-relaxed">
        {athleteRecruitInvite}
      </p>
    </AthleteCardShell>
  );
}

function CommunityFeedbackCard({ entry }: { entry: CommunityAthleteEntry }) {
  const thumb = athletePickerImageSrc(entry);

  return (
    <AthleteCardShell washOpacity="opacity-40">
      <div className="flex items-center gap-3">
        {thumb ? (
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 sm:h-16 sm:w-16">
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover object-top"
              decoding="async"
              loading="lazy"
            />
          </span>
        ) : (
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-500/10 font-mono text-lg font-semibold text-orange-200 sm:h-16 sm:w-16"
            aria-hidden
          >
            {athleteMonogram(entry.displayName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-wide text-orange-400 sm:text-[11px]">
            一般訓練者回饋
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-100">
            {entry.displayName}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">{entry.context}</p>
        </div>
      </div>
      {entry.changeTags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {entry.changeTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-orange-400/30 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-orange-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-2.5 text-[12px] italic leading-snug text-zinc-300 sm:text-[13px] sm:leading-relaxed">
        「{entry.testimonial}」
      </p>
    </AthleteCardShell>
  );
}
