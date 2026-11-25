import { useCallback, useState } from 'react';
import { AthleteEndorsementCard } from './AthleteEndorsementCard';
import { ATHLETE_STILL_BOX, ATHLETE_STILL_IMG } from './athleteStillFrame';
import { ImageLightbox } from './ImageLightbox';
import {
  athleteMonogram,
  athletePickerImageSrc,
  homepageAthleteRoster,
  type CommunityAthleteEntry,
  type HomepageAthleteEntry,
} from '../data/athletes';

/**
 * Homepage「專項運動員實測」— single-row snap cards (WHOOP / Ladder style).
 * WHY: No filter rail / dual picker — glanceable proof only. Roster stays
 * append-only in `data/athletes.ts`; `open` seats stay in data but never render here.
 */

/** Hide native scrollbars while keeping touch/trackpad pan. */
const HIDE_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const CARD_WIDTH =
  'w-[min(78vw,17.5rem)] shrink-0 snap-start sm:w-[18.5rem]';

export function AthletesShowcase() {
  const entrants = homepageAthleteRoster();

  if (entrants.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-void/40 px-3 py-4 text-center text-sm text-fg-muted">
        實測標竿陸續進駐中，歡迎稍後回來查看。
      </p>
    );
  }

  return (
    <div
      className={`-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory sm:-mx-0 sm:px-0 ${HIDE_SCROLLBAR}`}
      role="list"
      aria-label="專項運動員實測"
    >
      {entrants.map((entry) => (
        <div key={entry.id} role="listitem" className={CARD_WIDTH}>
          <HomepageAthleteCard entry={entry} />
        </div>
      ))}
    </div>
  );
}

function HomepageAthleteCard({ entry }: { entry: HomepageAthleteEntry }) {
  if (entry.kind === 'verified') {
    return <AthleteEndorsementCard athlete={entry} />;
  }
  return <CommunitySnapCard entry={entry} />;
}

/** Community social proof — same snap density as verified cards. */
function CommunitySnapCard({ entry }: { entry: CommunityAthleteEntry }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);
  const thumb = entry.battleCardUrl ?? athletePickerImageSrc(entry);
  const highlight = entry.changeTags[0];

  return (
    <>
      <article className="ui-card relative flex h-full flex-col overflow-hidden p-2.5 sm:p-3.5">
        <div
          className="pointer-events-none absolute inset-0 bg-orange-400/10 opacity-35 [mask-image:radial-gradient(circle_at_top_left,black,transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
          {thumb ? (
            <button
              type="button"
              onClick={() => setLightboxSrc(thumb)}
              className="group relative block w-full shrink-0 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/60 text-left transition hover:border-energy/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy"
              aria-label={`${entry.displayName} 戰報 — 點擊放大`}
            >
              <img
                src={thumb}
                alt=""
                className={`${ATHLETE_STILL_IMG} transition duration-300 group-hover:scale-[1.02]`}
                decoding="async"
                loading="lazy"
              />
            </button>
          ) : (
            <div
              className={`flex items-center justify-center rounded-xl border border-orange-400/30 bg-orange-500/10 font-mono text-2xl font-semibold text-fg ${ATHLETE_STILL_BOX}`}
              aria-hidden
            >
              {athleteMonogram(entry.displayName)}
            </div>
          )}

          <div className="min-w-0">
            <p className="ui-kicker-zh">一般訓練者回饋</p>
            <h3 className="ui-h3 mt-1 text-base leading-snug sm:text-lg">
              {entry.displayName}
            </h3>
            <p className="ui-label mt-0.5 leading-snug">{entry.context}</p>
            {highlight ? (
              <span className="mt-1.5 inline-flex rounded-md border border-orange-400/35 bg-orange-500/10 px-2 py-0.5 font-mono text-xs tracking-wide text-fg sm:mt-2">
                {highlight}
              </span>
            ) : null}
            <p className="ui-body mt-1.5 line-clamp-2 text-xs italic sm:mt-2.5 sm:line-clamp-none sm:text-sm">
              「{entry.testimonial}」
            </p>
          </div>
        </div>
      </article>

      {lightboxSrc ? (
        <ImageLightbox
          src={lightboxSrc}
          title={`${entry.displayName} 實測回饋`}
          alt={`${entry.displayName} 圖片放大檢視`}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}
