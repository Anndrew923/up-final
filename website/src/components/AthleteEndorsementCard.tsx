import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Athlete } from '../data/athletes';
import { MARKETING_POSTER_SRC } from '../config/marketingMedia';

/**
 * Verified athlete Bento stage — photo/HUD tile + battle card + full metric wall.
 * WHY: Marketing requires every measured field retained; orange chrome matches #athletes.
 */

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
  scoreHint,
}: {
  src: string;
  name: string;
  onOpen: (resolvedSrc: string) => void;
  scoreHint?: string;
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
        className={`group relative block w-full overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/60 text-left transition hover:border-orange-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
          phase === 'ready'
            ? ''
            : 'pointer-events-none absolute inset-0 opacity-0'
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
        {scoreHint ? (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md border border-orange-400/50 bg-black/70 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-orange-300 shadow-lg backdrop-blur-sm">
            {scoreHint}
          </span>
        ) : null}
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

export function AthleteEndorsementCard({ athlete }: { athlete: Athlete }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  return (
    <>
      {/*
        Bento grid: photo tile + battle card on the visual rail;
        metrics + quote remain 100% complete on the data rail.
      */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Visual bento — training still + battle-card score chip (from athlete SSOT) */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-4">
          <article className="relative overflow-hidden rounded-2xl border border-orange-400/25 bg-zinc-950">
            <img
              src={MARKETING_POSTER_SRC}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-[1px]"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/25 via-black/40 to-black/90" />
            <div className="hud-scanlines opacity-[0.15]" aria-hidden />
            <div className="relative flex min-h-[140px] flex-col justify-end p-3.5 sm:min-h-[160px] sm:p-4">
              <p className="font-mono text-[10px] tracking-wide text-orange-300">
                FIELD // TENSION
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{athlete.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{athlete.role}</p>
            </div>
          </article>

          {athlete.battleCardUrl ? (
            <div className="mx-auto w-full max-w-[260px] sm:max-w-none">
              <BattleCardSlot
                src={athlete.battleCardUrl}
                name={athlete.name}
                onOpen={setLightboxSrc}
                scoreHint={athlete.battleScoreHint}
              />
            </div>
          ) : null}
        </div>

        {/* Data wall — every metric group + quote retained */}
        <article className="ui-card relative overflow-hidden p-3.5 sm:p-5 lg:col-span-7">
          <div
            className="pointer-events-none absolute inset-0 bg-orange-400/10 opacity-45 [mask-image:radial-gradient(circle_at_top_left,black,transparent_50%)]"
            aria-hidden
          />
          <div className="relative min-w-0">
            <p className="font-mono text-[11px] tracking-wide text-orange-400 sm:text-xs">
              {athlete.badge}
            </p>
            <h3 className="mt-1.5 text-base font-semibold text-zinc-100 sm:text-lg">
              {athlete.name}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400 sm:text-sm">{athlete.role}</p>

            {athlete.metricGroups && athlete.metricGroups.length > 0 ? (
              <div className="mt-4 space-y-3">
                {athlete.metricGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 font-mono text-[10px] tracking-wide text-orange-400/80 sm:text-[11px]">
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
        </article>
      </div>

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
