import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Athlete } from '../data/athletes';

/** Emphasize measured numerals inside metric lines (decimals + thousands commas). */
function renderMetricLine(line: string) {
  return line.split(/(\d[\d,]*(?:\.\d+)?)/g).map((part, index) =>
    /^\d[\d,]*(?:\.\d+)?$/.test(part) ? (
      <span key={`n-${index}`} className="font-semibold text-zinc-100">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function AthleteAvatar({ athlete }: { athlete: Athlete }) {
  const [phase, setPhase] = useState<'idle' | 'ready' | 'error'>(() =>
    athlete.avatarUrl ? 'idle' : 'error',
  );
  const monogram = athlete.name.slice(0, 1).toUpperCase();
  const showBadge = phase !== 'ready';

  return (
    <div className="relative h-12 w-12 shrink-0">
      {showBadge ? (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-gradient-to-b from-zinc-700/80 to-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)]"
          aria-hidden
        >
          <span className="font-mono text-sm font-semibold tracking-wider text-zinc-200">
            {monogram}
          </span>
        </div>
      ) : null}
      {athlete.avatarUrl && phase !== 'error' ? (
        <img
          src={athlete.avatarUrl}
          alt={athlete.name}
          onLoad={() => setPhase('ready')}
          onError={() => setPhase('error')}
          className={`absolute inset-0 h-12 w-12 rounded-full border border-zinc-600 object-cover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] ${
            phase === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}
    </div>
  );
}

function BattleCardPlaceholder() {
  return (
    <div
      className="flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-dashed border-zinc-600/80 bg-zinc-950/70 px-3 text-center"
      role="img"
      aria-label="實機遙測戰報卡 · 待匯入"
    >
      <p className="font-mono text-[10px] leading-relaxed tracking-wide text-zinc-500 sm:text-[11px]">
        實機遙測戰報卡
        <br />
        · 待匯入 ·
      </p>
    </div>
  );
}

function BattleCardSlot({
  src,
  name,
  onOpen,
}: {
  src: string;
  name: string;
  onOpen: (resolvedSrc: string) => void;
}) {
  // WHY: Keep placeholder visible until onLoad — avoids a broken-image flash before onError.
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');

  if (phase === 'error') {
    return <BattleCardPlaceholder />;
  }

  return (
    <div className="relative w-full">
      {phase === 'loading' ? <BattleCardPlaceholder /> : null}
      <button
        type="button"
        onClick={() => onOpen(src)}
        className={`group relative block w-full overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/60 text-left transition hover:border-energy/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy ${
          phase === 'ready' ? '' : 'pointer-events-none absolute inset-0 opacity-0'
        }`}
        aria-label={`${name} 實機遙測戰報卡 — 點擊放大`}
        tabIndex={phase === 'ready' ? 0 : -1}
      >
        <img
          src={src}
          alt={`${name} 實機遙測戰報卡`}
          onLoad={() => setPhase('ready')}
          onError={() => setPhase('error')}
          className="aspect-[3/4] w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-8 font-mono text-[10px] tracking-wide text-zinc-300 opacity-90">
          點擊放大檢視
        </span>
      </button>
    </div>
  );
}

function BattleCardLightbox({
  src,
  name,
  onClose,
}: {
  src: string;
  name: string;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <p id={titleId} className="sr-only">
          {name} 實機遙測戰報卡
        </p>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 rounded-full border border-zinc-600 bg-zinc-900/90 px-3 py-1 font-mono text-[11px] text-zinc-200 transition hover:border-zinc-400"
        >
          關閉
        </button>
        <img
          src={src}
          alt={`${name} 實機遙測戰報卡放大檢視`}
          className="max-h-[85dvh] w-full rounded-xl border border-zinc-700 object-contain shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  );
}

function LockedAthleteCard({ athlete }: { athlete: Athlete }) {
  return (
    <article className="ui-card flex min-h-[160px] flex-col border-dashed border-white/15 p-3.5 sm:p-4">
      <p className="font-mono text-[10px] tracking-wide text-energy">{athlete.badge}</p>
      <span className="mt-3 inline-flex w-fit items-center rounded-full border border-zinc-600 bg-zinc-800/80 px-2.5 py-1 font-mono text-[10px] text-zinc-200">
        {athlete.role}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-zinc-100">{athlete.name}</h3>
      {athlete.positioning ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{athlete.positioning}</p>
      ) : null}
    </article>
  );
}

/**
 * Featured verified layout: metrics column + battle-card column.
 * WHY: Physical raw data vs App export card only — no invented score chips in copy.
 */
function FeaturedAthleteCard({ athlete }: { athlete: Athlete }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  return (
    <>
      <article className="ui-card relative col-span-full overflow-hidden p-3.5 sm:p-5 lg:col-span-2">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_50%)]"
          aria-hidden
        />
        <div className="relative grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start md:gap-6">
          <div className="min-w-0">
            {/* WHY: No circular avatar — battle card already shows the full portrait. */}
            <p className="ui-kicker-zh">{athlete.badge}</p>
            <h3 className="mt-1.5 text-base font-semibold text-zinc-100 sm:text-lg">
              {athlete.name}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">{athlete.role}</p>

            {athlete.metricGroups && athlete.metricGroups.length > 0 ? (
              <div className="mt-4 space-y-3">
                {athlete.metricGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 font-mono text-[10px] tracking-wide text-zinc-500 sm:text-[11px]">
                      {group.label}
                    </p>
                    <p className="text-[12px] leading-relaxed text-zinc-300 sm:text-[13px]">
                      {renderMetricLine(group.line)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {athlete.quote ? (
              <p className="mt-4 text-[12px] italic leading-relaxed text-zinc-300 sm:text-[13px]">
                「{athlete.quote}」
              </p>
            ) : null}
          </div>

          {athlete.battleCardUrl ? (
            <div className="mx-auto w-full max-w-[220px] md:mx-0 md:max-w-none">
              <BattleCardSlot
                src={athlete.battleCardUrl}
                name={athlete.name}
                onOpen={setLightboxSrc}
              />
            </div>
          ) : null}
        </div>
      </article>

      {lightboxSrc ? (
        <BattleCardLightbox
          src={lightboxSrc}
          name={athlete.name}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}

function VerifiedSimpleCard({ athlete }: { athlete: Athlete }) {
  return (
    <article className="ui-card relative flex min-h-[160px] flex-col overflow-hidden p-3.5 sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_50%)]"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <AthleteAvatar athlete={athlete} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-wide text-energy">{athlete.badge}</p>
          <h3 className="mt-1.5 text-base font-semibold text-zinc-100">{athlete.name}</h3>
          <p className="text-xs text-zinc-400">{athlete.role}</p>
        </div>
      </div>
      {athlete.metrics && athlete.metrics.length > 0 ? (
        <ul className="relative mt-3 space-y-1.5 text-[11px] leading-snug text-zinc-300">
          {athlete.metrics.map((line) => (
            <li key={line}>· {renderMetricLine(line)}</li>
          ))}
        </ul>
      ) : null}
      {athlete.quote ? (
        <p className="relative mt-auto pt-3 text-[11px] italic leading-relaxed text-zinc-300">
          「{athlete.quote}」
        </p>
      ) : null}
    </article>
  );
}

export function AthleteEndorsementCard({ athlete }: { athlete: Athlete }) {
  if (athlete.status === 'locked') {
    return <LockedAthleteCard athlete={athlete} />;
  }
  if (athlete.metricGroups?.length || athlete.battleCardUrl) {
    return <FeaturedAthleteCard athlete={athlete} />;
  }
  return <VerifiedSimpleCard athlete={athlete} />;
}
