/**
 * DOM preview for single-leaf carbon plate — dual-hero split (raw | UP rating).
 * WHY: Plate copy comes from `buildAestheticSingleLeafExportInput` so DOM and PNG stay in lockstep.
 */
import { useMemo, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SingleLeafReportResult } from '../../logic/aesthetic/singleLeafReport';
import { buildAestheticSingleLeafExportInput } from '../../hooks/buildAestheticSingleLeafExportInput';
import { useCertPlateFitScale } from '../../hooks/useCertPlateFitScale';
import { resolveTelemetryCardSize } from '../../lib/telemetryCardBackground';
import { SINGLE_LEAF_VERDICT_SLOT_HEIGHT } from '../../lib/telemetryReportTypes';
import type { TelemetryCardAspectRatio } from '../../lib/telemetryCardTypes';
import AestheticCardArmor from './AestheticCardArmor';
import GuillocheCrest from './GuillocheCrest';
import {
  CERT_STAGE_FIT_CLASS,
  FOIL_HERO_STAMP_CLASS,
  FOIL_HERO_TITLE_CLASS,
  FOIL_HERO_WING_LEFT_CLASS,
  FOIL_HERO_WING_RIGHT_CLASS,
  FOIL_PLATE_CLASS,
  FOIL_RULE_CLASS,
} from './aestheticChrome';
import {
  CERT_FOOTER_REVEAL_CLASS,
  CERT_PLATE_REVEAL_CLASS,
  CERT_STAMP_REVEAL_CLASS,
} from '../../lib/certRevealMotion';

export interface AestheticSingleLeafCardProps {
  leafResult: Extract<SingleLeafReportResult, { status: 'ok' }>;
  aspectRatio?: TelemetryCardAspectRatio;
}

const DESIGN_TO_LOGICAL = 3;
const SINGLE_LEAF_VERDICT_SLOT_DESIGN_PX =
  SINGLE_LEAF_VERDICT_SLOT_HEIGHT / DESIGN_TO_LOGICAL;

const SINGLE_LEAF_TITLE_CLASS = [
  FOIL_HERO_TITLE_CLASS,
  'text-[clamp(0.9rem,3.6vw,1.2rem)] tracking-[0.12em] pl-[0.12em]',
].join(' ');

const AestheticSingleLeafCard: FC<AestheticSingleLeafCardProps> = ({
  leafResult,
  aspectRatio = '9:16',
}) => {
  const { t, i18n } = useTranslation('common');
  const viewportRef = useRef<HTMLElement>(null);
  const plate = resolveTelemetryCardSize(aspectRatio);
  const scale = useCertPlateFitScale(viewportRef, plate.width, plate.height);
  const designW = plate.width / DESIGN_TO_LOGICAL;
  const designH = plate.height / DESIGN_TO_LOGICAL;
  const isFeed = aspectRatio === '4:5';
  const aspectClass = isFeed ? 'aspect-[4/5]' : 'aspect-[9/16]';

  const plateCopy = useMemo(
    () =>
      buildAestheticSingleLeafExportInput(t, leafResult, {
        mode: 'carbon',
        aspectRatio,
      }),
    [aspectRatio, i18n.language, leafResult, t]
  );

  const capsule = plateCopy.isOverflow
    ? plateCopy.overflowBadge
    : plateCopy.tierCapsule;

  return (
    <article
      ref={viewportRef}
      data-testid="aesthetic-single-leaf-card"
      data-leaf={leafResult.leaf}
      data-aspect={aspectRatio}
      className={`relative ${aspectClass} origin-center ${CERT_STAGE_FIT_CLASS} overflow-hidden rounded-2xl border border-[#c9a227]/30 bg-bg-base text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(201,162,39,0.16)] ${CERT_PLATE_REVEAL_CLASS}`}
    >
      <div
        data-testid="aesthetic-single-leaf-plate"
        data-plate-width={plate.width}
        data-plate-height={plate.height}
        data-fit-scale={scale > 0 ? scale.toFixed(4) : '0'}
        className="absolute left-1/2 top-1/2"
        style={{
          width: plate.width,
          height: plate.height,
          transform: `translate(-50%, -50%) scale(${scale > 0 ? scale : 0})`,
          transformOrigin: 'center center',
          opacity: scale > 0 ? 1 : 0,
        }}
      >
        <div
          className="relative rounded-2xl bg-bg-base text-zinc-100"
          style={{
            width: designW,
            height: designH,
            transform: `scale(${DESIGN_TO_LOGICAL})`,
            transformOrigin: 'top left',
          }}
        >
          <AestheticCardArmor />

          <div
            className={`relative z-10 flex h-full flex-col px-5 ${
              isFeed ? 'pb-5 pt-4' : 'pb-7 pt-6'
            }`}
          >
            <header
              className={`grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b ${FOIL_RULE_CLASS} pb-2`}
            >
              <p className="min-w-0 truncate text-[10px] tracking-[0.14em] text-zinc-400">
                {plateCopy.brandHeader}
              </p>
              <p className="shrink-0 text-[10px] tabular-nums text-zinc-500">
                {plateCopy.year}
              </p>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 py-1 text-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[46%] h-[58%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.10)_0%,rgba(122,92,40,0.04)_45%,transparent_72%)]"
              />

              <GuillocheCrest />

              <div aria-hidden="true" className={`relative w-[78%] border-t ${FOIL_RULE_CLASS}`} />

              <h3 className={`relative ${FOIL_HERO_STAMP_CLASS} ${CERT_STAMP_REVEAL_CLASS}`}>
                <span className={FOIL_HERO_WING_LEFT_CLASS} aria-hidden="true" />
                <span className={SINGLE_LEAF_TITLE_CLASS}>{plateCopy.leafTitleZh}</span>
                <span className={FOIL_HERO_WING_RIGHT_CLASS} aria-hidden="true" />
              </h3>
              <p
                data-testid="aesthetic-single-leaf-title-en"
                className="relative font-mono text-[8px] tracking-[0.16em] text-zinc-500"
              >
                {plateCopy.leafTitleEn}
              </p>

              <div aria-hidden="true" className={`relative w-[78%] border-t ${FOIL_RULE_CLASS}`} />

              {/* Dual-hero split: raw metric | UP rating */}
              <div
                data-testid="aesthetic-single-leaf-dual-hero"
                className="relative grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-1.5 px-0.5"
              >
                <div className="flex min-w-0 flex-col items-center justify-center gap-1 py-1">
                  <p className="font-mono text-[7px] tracking-[0.16em] text-zinc-500">
                    {plateCopy.rawMetricLabel}
                  </p>
                  <p
                    data-testid="aesthetic-single-leaf-raw"
                    className="max-w-full px-0.5 text-center text-[clamp(0.7rem,3.8vw,1.25rem)] font-bold leading-tight tabular-nums tracking-wide text-zinc-50"
                  >
                    {plateCopy.rawReading}
                  </p>
                </div>

                <div
                  aria-hidden="true"
                  className="my-1 w-px self-stretch bg-gradient-to-b from-transparent via-[#c9a227]/55 to-transparent"
                />

                <div className="flex min-w-0 flex-col items-center justify-center gap-1 py-1">
                  <p className="font-mono text-[7px] tracking-[0.16em] text-zinc-500">
                    {plateCopy.upRatingLabel}
                  </p>
                  <p
                    data-testid="aesthetic-single-leaf-score"
                    className="max-w-full px-0.5 text-center font-['UPSerifTC','Songti_TC','Noto_Serif_TC','STSong',Palatino,Georgia,serif] text-[clamp(0.7rem,3.8vw,1.25rem)] font-bold leading-tight tabular-nums text-[#f3e6c8]"
                  >
                    {plateCopy.heroScoreText}
                  </p>
                  {capsule ? (
                    <span
                      className={FOIL_PLATE_CLASS}
                      data-testid={
                        plateCopy.isOverflow
                          ? 'aesthetic-single-leaf-overflow'
                          : 'aesthetic-single-leaf-tier'
                      }
                    >
                      {capsule}
                    </span>
                  ) : null}
                </div>
              </div>

              <div aria-hidden="true" className={`relative w-[78%] border-t ${FOIL_RULE_CLASS}`} />

              <div
                data-testid="aesthetic-single-leaf-verdict-slot"
                className="relative flex w-full shrink-0 items-center justify-center"
                style={{ height: SINGLE_LEAF_VERDICT_SLOT_DESIGN_PX }}
              >
                <p className="font-mono text-[8px] tracking-[0.16em] text-zinc-500">
                  {plateCopy.verdictPlaceholder}
                </p>
              </div>

              <div aria-hidden="true" className={`relative w-[78%] border-t ${FOIL_RULE_CLASS}`} />
            </div>

            <footer className={`mt-1 shrink-0 border-t ${FOIL_RULE_CLASS} pt-2`}>
              <p
                data-testid="aesthetic-single-leaf-stamp"
                className={`text-center font-mono text-[8px] tracking-[0.18em] text-zinc-500 ${CERT_FOOTER_REVEAL_CLASS}`}
              >
                {plateCopy.verifiedStamp}
              </p>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
};

export default AestheticSingleLeafCard;
