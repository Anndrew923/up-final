import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { VerifiedAthleteEntry } from '../data/athletes';
import {
  athleteStillBoxClass,
  athleteStillImgClass,
  athleteStillOptionsFromCrop,
  type AthleteStillOptions,
} from './athleteStillFrame';
import { ImageLightbox } from './ImageLightbox';
import { TelemetryDossierModal } from './TelemetryDossierModal';

/**
 * WHOOP/Ladder-style verified card — compact still + identity + dossier CTA.
 * WHY: Mobile still height is capped so title → CTA fits one phone screen under
 * sticky download chrome; watermark cue removed so the pill CTA is the sole invite.
 */

function BattleCardArt({
  src,
  name,
  onOpen,
  scoreHint,
  stillOptions,
}: {
  src: string;
  name: string;
  onOpen: () => void;
  scoreHint?: string;
  stillOptions?: AthleteStillOptions;
}) {
  const stillClass = athleteStillImgClass(stillOptions);
  const boxClass = athleteStillBoxClass(stillOptions);
  // WHY: Keep placeholder overlay until onLoad — avoids a broken-image flash before onError.
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);

  // WHY: Cached images may skip a late onLoad; reset + sync on mount/src change.
  useEffect(() => {
    setPhase('loading');
    const node = imgRef.current;
    if (!node) return;
    if (node.complete && node.naturalWidth > 0) {
      setPhase('ready');
      return;
    }
    if (node.complete && node.naturalWidth === 0) {
      setPhase('error');
    }
  }, [src]);

  if (phase === 'error') {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-zinc-600/80 bg-zinc-950/70 ${boxClass}`}
        role="img"
        aria-label="實機遙測戰報卡 · 待匯入"
      >
        <p className="ui-label">戰報卡 · 待匯入</p>
      </div>
    );
  }

  /*
    WHY always in-flow + eager: prior opacity-0 absolute + loading=lazy left
    some browsers never fetching the PNG, so onLoad/onError never fired and
    the dashed shell stuck forever on Netlify production. Overlay covers the
    in-flow img without hiding it from the network stack.
  */
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full shrink-0 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/60 text-left transition hover:border-energy/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy"
      aria-label={`${name} 實機遙測戰報 — 查看完整實測數據`}
    >
      {phase === 'loading' ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] rounded-xl border border-dashed border-zinc-600/80 bg-zinc-950/70"
          aria-hidden
        />
      ) : null}
      <img
        ref={imgRef}
        src={src}
        alt={`${name} 實機遙測戰報卡`}
        onLoad={() => setPhase('ready')}
        onError={() => setPhase('error')}
        className={`${stillClass} transition duration-300 group-hover:scale-[1.02]`}
        decoding="async"
        loading="eager"
      />
      {scoreHint && phase === 'ready' ? (
        <span className="pointer-events-none absolute left-2 top-2 rounded-md border border-orange-400/50 bg-black/70 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-fg shadow-lg backdrop-blur-sm">
          {scoreHint}
        </span>
      ) : null}
    </button>
  );
}

export function AthleteEndorsementCard({
  athlete,
}: {
  athlete: VerifiedAthleteEntry;
}) {
  const [dossierOpen, setDossierOpen] = useState(false);
  const [imageOnlySrc, setImageOnlySrc] = useState<string | null>(null);
  const openDossier = useCallback(() => setDossierOpen(true), []);
  const closeDossier = useCallback(() => setDossierOpen(false), []);
  const closeImage = useCallback(() => setImageOnlySrc(null), []);
  const battleCardUrl = athlete.battleCardUrl;
  const hasMetrics = athlete.metricGroups.length > 0;
  const stillOptions = athleteStillOptionsFromCrop(athlete);

  const onBattleOpen = useCallback(() => {
    if (hasMetrics) {
      openDossier();
      return;
    }
    if (battleCardUrl) setImageOnlySrc(battleCardUrl);
  }, [battleCardUrl, hasMetrics, openDossier]);

  return (
    <>
      <article className="ui-card relative flex h-full flex-col overflow-hidden p-2.5 sm:p-3.5">
        <div
          className="pointer-events-none absolute inset-0 bg-orange-400/10 opacity-40 [mask-image:radial-gradient(circle_at_top_left,black,transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
          {battleCardUrl ? (
            <BattleCardArt
              src={battleCardUrl}
              name={athlete.name}
              onOpen={onBattleOpen}
              scoreHint={athlete.battleScoreHint}
              stillOptions={stillOptions}
            />
          ) : null}

          <div className="min-w-0">
            {/*
              WHY two tones: name = section-H2 white/bold; role = secondary.
              CTA label stays muted fg while energy ArrowUpRight is the sole click cue.
            */}
            <h3 className="text-base font-bold leading-snug text-white sm:text-lg">
              {athlete.name}
            </h3>
            {/*
              WHY line-clamp-2: national-team roles can wrap long; clamp keeps
              peek-rail / grid card heights aligned with sibling endorsement cards.
              Full role remains in dossier header + native title tooltip.
            */}
            <p
              className="mt-0.5 line-clamp-2 text-sm leading-snug text-fg-secondary"
              title={athlete.role}
            >
              {athlete.role}
            </p>
            {hasMetrics ? (
              <button
                type="button"
                onClick={openDossier}
                className="group mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-fg transition hover:border-white/35 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 sm:mt-3 sm:min-h-9"
              >
                查看完整實測數據
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 stroke-[2.5] text-energy transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {dossierOpen && hasMetrics ? (
        <TelemetryDossierModal athlete={athlete} onClose={closeDossier} />
      ) : null}
      {imageOnlySrc ? (
        <ImageLightbox
          src={imageOnlySrc}
          title={`${athlete.name} 實機遙測戰報卡`}
          alt={`${athlete.name} 實機遙測戰報卡放大檢視`}
          onClose={closeImage}
        />
      ) : null}
    </>
  );
}
