import { useCallback, useState } from 'react';
import type { VerifiedAthleteEntry } from '../data/athletes';
import { ImageLightbox } from './ImageLightbox';

/**
 * Compact verified Bento — thumb + identity row, then full metrics/quote.
 * WHY: Full-width portrait pushed metrics below the fold; inline thumb keeps
 * picker + card on one phone screen without dropping measured fields.
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
      className="flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-dashed border-zinc-600/80 bg-zinc-950/70 px-1.5 text-center"
      role="img"
      aria-label="實機遙測戰報卡 · 待匯入"
    >
      <p className="font-mono text-[8px] leading-relaxed tracking-wide text-zinc-500">
        戰報卡
        <br />
        · 待匯入 ·
      </p>
    </div>
  );
}

/** Compact thumb only — lightbox stays full-bleed via portal. */
function BattleCardThumb({
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
    return (
      <div className="w-24 shrink-0 sm:w-28">
        <BattleCardPlaceholder />
      </div>
    );
  }

  return (
    <div className="relative w-24 shrink-0 sm:w-28">
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
          decoding="async"
          loading="lazy"
        />
        {scoreHint ? (
          <span className="pointer-events-none absolute left-1 top-1 rounded-md border border-orange-400/50 bg-black/70 px-1 py-0.5 font-mono text-[9px] font-semibold tabular-nums text-orange-300 shadow-lg backdrop-blur-sm">
            {scoreHint}
          </span>
        ) : null}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1 pb-1 pt-5 font-mono text-[8px] leading-tight tracking-wide text-zinc-300">
          點擊放大
        </span>
      </button>
    </div>
  );
}

export function AthleteEndorsementCard({
  athlete,
}: {
  athlete: VerifiedAthleteEntry;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  const battleCardUrl = athlete.battleCardUrl;

  return (
    <>
      <article className="ui-card relative overflow-hidden p-3 sm:p-3.5">
        <div
          className="pointer-events-none absolute inset-0 bg-orange-400/10 opacity-45 [mask-image:radial-gradient(circle_at_top_left,black,transparent_50%)]"
          aria-hidden
        />
        <div className="relative min-w-0">
          <div className="flex items-center gap-3 sm:gap-4">
            {battleCardUrl ? (
              <BattleCardThumb
                src={battleCardUrl}
                name={athlete.name}
                onOpen={setLightboxSrc}
                scoreHint={athlete.battleScoreHint}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-wide text-orange-400 sm:text-[11px]">
                {athlete.badge}
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-100 sm:text-lg">
                {athlete.name}
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-zinc-400 sm:text-sm">
                {athlete.role}
              </p>
            </div>
          </div>

          {athlete.metricGroups.length > 0 ? (
            <div className="mt-3 space-y-2 sm:mt-3.5 sm:space-y-2.5">
              {athlete.metricGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-0.5 font-mono text-[10px] tracking-wide text-orange-400/80 sm:text-[11px]">
                    {group.label}
                  </p>
                  <p className="text-[11px] leading-snug text-zinc-300 sm:text-[12px] sm:leading-relaxed">
                    {renderMetricLine(group.line)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {athlete.quote ? (
            <p className="mt-2.5 text-[11px] italic leading-snug text-zinc-300 sm:mt-3 sm:text-[12px] sm:leading-relaxed">
              「{athlete.quote}」
            </p>
          ) : null}
        </div>
      </article>

      {lightboxSrc ? (
        <ImageLightbox
          src={lightboxSrc}
          title={`${athlete.name} 實機遙測戰報卡`}
          alt={`${athlete.name} 實機遙測戰報卡放大檢視`}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}
