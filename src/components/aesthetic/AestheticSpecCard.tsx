import { useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import type { AestheticSpecCardModel } from '../../hooks/useAestheticSpecCard';
import { useCertPlateFitScale } from '../../hooks/useCertPlateFitScale';
import {
  resolveAestheticBandCopy,
  resolveAestheticVisualLine,
} from '../../logic/aesthetic/aestheticSpecCopy';
import { resolveTelemetryCardSize } from '../../lib/telemetryCardBackground';
import type { TelemetryCardAspectRatio } from '../../lib/telemetryCardTypes';
import AestheticCardArmor from './AestheticCardArmor';
import AestheticKpiStrip from './AestheticKpiStrip';
import AestheticMeter, { clampMeterFill, type AestheticMeterProps } from './AestheticMeter';
import GuillocheCrest from './GuillocheCrest';
import {
  CERT_STAGE_FIT_CLASS,
  FOIL_HERO_STAMP_CLASS,
  FOIL_HERO_TITLE_CLASS,
  FOIL_HERO_WING_LEFT_CLASS,
  FOIL_HERO_WING_RIGHT_CLASS,
  FOIL_KICKER_CLASS,
  FOIL_RULE_CLASS,
} from './aestheticChrome';
import {
  CERT_FOOTER_REVEAL_CLASS,
  CERT_NEEDLE_STAGGER_MS,
  CERT_PLATE_REVEAL_CLASS,
  CERT_STAMP_REVEAL_CLASS,
} from '../../lib/certRevealMotion';

export interface AestheticSpecCardProps {
  model: AestheticSpecCardModel;
  aspectRatio?: TelemetryCardAspectRatio;
}

/** Badge + gold numerals fire at >= 100; needle still caps at the rightmost tick. */
const OVERFLOW_SCORE = 100;

/**
 * Design surface is 1/3 of the logical canvas plate so rem typography stays dense,
 * then scaled ×3 to fill 1080×H — matches export coordinates without rewriting every token.
 */
const DESIGN_TO_LOGICAL = 3;

/**
 * WHY: 7rem (not 6.5) — EN `ABSOLUTE RIGIDITY` at 9px / tracking-0.16em needs ~7rem
 * single-line; narrower columns wrap and break SpecRow vertical rhythm.
 */
const SPEC_ROW_GRID_CLASS = 'grid grid-cols-[7rem_1fr] items-baseline gap-x-2';

const SpecRow: FC<{
  kicker: string;
  title: string;
  subtitle: string;
}> = ({ kicker, title, subtitle }) => {
  return (
    <div className={SPEC_ROW_GRID_CLASS}>
      <span
        className={`w-full shrink-0 text-left text-[9px] leading-tight tracking-[0.16em] ${FOIL_KICKER_CLASS}`}
      >
        {kicker}
      </span>
      <div className="min-w-0 text-left">
        <p className="truncate text-[12px] font-medium leading-tight text-zinc-100">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-tight text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
};

function overflowMeterProps(
  score: number | null,
  overflowBadge: string,
  unmeasuredLabel: string
): Omit<AestheticMeterProps, 'label' | 'staggerMs'> {
  const overflow = score != null && score >= OVERFLOW_SCORE;
  return {
    value: score != null ? formatOverallResonanceScore(score) : unmeasuredLabel,
    fillPct: clampMeterFill(score),
    showNeedle: score != null,
    badge: overflow ? overflowBadge : null,
    emphasize: overflow,
  };
}

/**
 * Anatomical share surface — fixed logical plate + ResizeObserver scale (P0 screenshot).
 * WHY: Flex-squashing clipped battleCode / meters; scale-to-fit keeps WYSIWYG with canvas.
 */
const AestheticSpecCard: FC<AestheticSpecCardProps> = ({ model, aspectRatio = '9:16' }) => {
  const { t } = useTranslation('common');
  const viewportRef = useRef<HTMLElement>(null);
  const plate = resolveTelemetryCardSize(aspectRatio);
  const scale = useCertPlateFitScale(viewportRef, plate.width, plate.height);
  const designW = plate.width / DESIGN_TO_LOGICAL;
  const designH = plate.height / DESIGN_TO_LOGICAL;
  const isFeed = aspectRatio === '4:5';
  const aspectClass = isFeed ? 'aspect-[4/5]' : 'aspect-[9/16]';

  const { spec, overallScore, battleCode, gender, bodyFatPct } = model;
  const readoutYear = String(new Date().getFullYear());
  const unmeasuredLabel = t('aesthetic.labels.unmeasured');
  const overflowBadge = t('aesthetic.labels.overflowBadge');

  const overallTitle = t(`aesthetic.overall.${spec.overallTitleId}`);
  const visualTitle = spec.visual.id
    ? t(`aesthetic.visual.${spec.visual.id}.title`)
    : unmeasuredLabel;
  const visualSubtitle = spec.visual.id
    ? t(`aesthetic.visual.${spec.visual.id}.subtitle`)
    : unmeasuredLabel;
  const forceCopy = resolveAestheticBandCopy(t, 'force', gender, spec.force.id);
  const kineticCopy = resolveAestheticBandCopy(t, 'kinetic', gender, spec.kinetic.id);
  const visualLine = resolveAestheticVisualLine(t, {
    visualSubtitle,
    unmeasured: spec.visual.unmeasured,
    bodyFatMissing: spec.visual.bodyFatMissing,
    bodyFatPct,
  });

  const meterModels = [
    {
      label: t('aesthetic.labels.visualMetric'),
      ...overflowMeterProps(spec.visual.score, overflowBadge, unmeasuredLabel),
      staggerMs: CERT_NEEDLE_STAGGER_MS[0],
    },
    {
      label: t('aesthetic.labels.forceMetric'),
      ...overflowMeterProps(spec.force.score, overflowBadge, unmeasuredLabel),
      staggerMs: CERT_NEEDLE_STAGGER_MS[1],
    },
    {
      label: t('aesthetic.labels.kineticMetric'),
      ...overflowMeterProps(spec.kinetic.score, overflowBadge, unmeasuredLabel),
      staggerMs: CERT_NEEDLE_STAGGER_MS[2],
    },
  ] as const;

  return (
    <article
      ref={viewportRef}
      data-testid="aesthetic-spec-card"
      data-aspect={aspectRatio}
      className={`relative ${aspectClass} origin-center ${CERT_STAGE_FIT_CLASS} overflow-hidden rounded-2xl border border-[#c9a227]/30 bg-bg-base text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(201,162,39,0.16)] ${CERT_PLATE_REVEAL_CLASS}`}
    >
      {/*
        WHY: Plate is always the canvas logical size; scale fits the viewport so
        battleCode / meters cannot be flex-clipped. Armor lives inside the plate
        so rivet craft scales with the certificate, not the phone chrome.
      */}
      <div
        data-testid="aesthetic-spec-plate"
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
        {/*
          WHY: No overflow-hidden here — viewport already clips to the rounded stage.
          Clipping the design surface would reintroduce battleCode/meter crop under scale.
        */}
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
              isFeed ? 'pb-6 pt-5' : 'pb-9 pt-7'
            }`}
          >
            <header
              className={`grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b ${FOIL_RULE_CLASS} pb-2`}
            >
              <p className="flex min-w-0 items-baseline gap-1.5 text-[10px] tracking-[0.14em] text-zinc-400">
                <span className="min-w-0 truncate">{t('aesthetic.labels.brandHeader')}</span>
                <span className="shrink-0 font-semibold tabular-nums text-zinc-100">
                  {formatOverallResonanceScore(overallScore)}
                </span>
              </p>
              <p className="shrink-0 text-[10px] tabular-nums text-zinc-500">{readoutYear}</p>
            </header>

            <div
              className={`flex min-h-0 flex-1 flex-col justify-center ${
                isFeed ? 'gap-2 py-1' : 'gap-1.5 py-1 sm:gap-2 sm:py-1.5'
              }`}
            >
              <GuillocheCrest />

              <h3 className={`${FOIL_HERO_STAMP_CLASS} ${CERT_STAMP_REVEAL_CLASS}`}>
                <span className={FOIL_HERO_WING_LEFT_CLASS} aria-hidden="true" />
                <span className={FOIL_HERO_TITLE_CLASS}>{overallTitle}</span>
                <span className={FOIL_HERO_WING_RIGHT_CLASS} aria-hidden="true" />
              </h3>

              <div className={isFeed ? 'space-y-1.5' : 'space-y-2'}>
                <SpecRow
                  kicker={t('aesthetic.labels.visual')}
                  title={visualTitle}
                  subtitle={visualLine}
                />
                <SpecRow
                  kicker={t('aesthetic.labels.force')}
                  title={forceCopy.title}
                  subtitle={forceCopy.subtitle}
                />
                <SpecRow
                  kicker={t('aesthetic.labels.kinetic')}
                  title={kineticCopy.title}
                  subtitle={kineticCopy.subtitle}
                />
              </div>
            </div>

            <section className={`shrink-0 border-t ${FOIL_RULE_CLASS} ${isFeed ? 'pt-2' : 'pt-2.5'}`}>
              {isFeed ? (
                <AestheticKpiStrip columns={meterModels} />
              ) : (
                <div className="grid grid-cols-[minmax(4.25rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3">
                  {meterModels.map((meter) => (
                    <AestheticMeter key={meter.label} {...meter} />
                  ))}
                </div>
              )}
            </section>

            <footer
              className={`mt-2 shrink-0 space-y-1 border-t ${FOIL_RULE_CLASS} pt-2`}
            >
              <p className="text-center font-mono text-[9px] tracking-[0.16em] text-[#c9a227]/70">
                <span className="sr-only">{t('aesthetic.labels.battleCode')}</span>
                {battleCode}
              </p>
              <p
                className={`text-center font-mono text-[8px] tracking-[0.18em] text-zinc-500 ${CERT_FOOTER_REVEAL_CLASS}`}
              >
                {t('aesthetic.labels.verifiedStamp', { year: readoutYear })}
              </p>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
};

export default AestheticSpecCard;
