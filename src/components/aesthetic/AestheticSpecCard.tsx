import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { formatOverallResonanceScore } from '../../logic/core/scoring';
import type { AestheticSpecCardModel } from '../../hooks/useAestheticSpecCard';
import type { DecadeBandId } from '../../logic/aesthetic/aestheticTypes';
import AestheticCardArmor from './AestheticCardArmor';
import AestheticMeter, { clampMeterFill, type AestheticMeterProps } from './AestheticMeter';
import {
  CERT_STAGE_MAX_H_CLASS,
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
}

function formatBfPct(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

/** Badge + gold numerals fire at >= 100; needle still caps at the rightmost tick. */
const OVERFLOW_SCORE = 100;

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
        {/* WHY: Fixed 9:16 plate — clamp keeps three SpecRows inside the flex budget. */}
        <p className="truncate text-[12px] font-medium leading-tight text-zinc-100">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-tight text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
};

/** Tick teeth along the outer seal ring — anti-counterfeit texture without radar spokes. */
const GUILLOCHE_TEETH = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
  const outer = 43.5;
  const inner = i % 5 === 0 ? 39.5 : 41.2;
  return {
    key: i,
    x1: 48 + Math.cos(a) * inner,
    y1: 48 + Math.sin(a) * inner,
    x2: 48 + Math.cos(a) * outer,
    y2: 48 + Math.sin(a) * outer,
    major: i % 5 === 0,
  };
});

/**
 * WHY: UP hex-shield seal (not radial "radar") — geometric anti-forgery crest that reads as
 * brand monogram while filling the header→stamp vacuum without competing with foil type.
 */
const GuillocheCrest: FC = () => (
  <div
    className="pointer-events-none relative mx-auto flex size-28 select-none items-center justify-center"
    data-testid="aesthetic-guilloche-crest"
    aria-hidden
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.12)_0%,_transparent_70%)]" />
    <svg
      className="size-24 text-amber-300/35"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dual outer rings + micro tick teeth */}
      <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="48" cy="48" r="40.5" stroke="currentColor" strokeWidth="0.45" />
      {GUILLOCHE_TEETH.map((tooth) => (
        <line
          key={tooth.key}
          x1={tooth.x1}
          y1={tooth.y1}
          x2={tooth.x2}
          y2={tooth.y2}
          stroke="currentColor"
          strokeWidth={tooth.major ? 0.7 : 0.35}
          opacity={tooth.major ? 0.85 : 0.5}
        />
      ))}
      {/* Hex body-form shield */}
      <path
        d="M48 22 L66 32.5 L66 53.5 L48 64 L30 53.5 L30 32.5 Z"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
      <path
        d="M48 28 L61 35.5 L61 50.5 L48 58 L35 50.5 L35 35.5 Z"
        stroke="currentColor"
        strokeWidth="0.45"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Cold monospace UP monogram */}
      <text
        x="48"
        y="51.5"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="14"
        fontWeight="700"
        letterSpacing="1.5"
      >
        UP
      </text>
    </svg>
  </div>
);

function bandCopy(
  t: TFunction,
  kind: 'force' | 'kinetic',
  gender: 'male' | 'female' | null,
  id: DecadeBandId | null
): { title: string; subtitle: string } {
  const unmeasured = t('aesthetic.labels.unmeasured');
  if (!gender || id == null) return { title: unmeasured, subtitle: unmeasured };
  const sexKey = gender === 'female' ? 'f' : 'm';
  return {
    title: t(`aesthetic.${kind}.${sexKey}.${id}.title`),
    subtitle: t(`aesthetic.${kind}.${sexKey}.${id}.subtitle`),
  };
}

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
 * 9:16 anatomical share surface — CSS + inline SVG only (P0 screenshot, no remote assets).
 */
const AestheticSpecCard: FC<AestheticSpecCardProps> = ({ model }) => {
  const { t } = useTranslation('common');
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
  const forceCopy = bandCopy(t, 'force', gender, spec.force.id);
  const kineticCopy = bandCopy(t, 'kinetic', gender, spec.kinetic.id);

  const visualBfNote = spec.visual.unmeasured
    ? null
    : spec.visual.bodyFatMissing || bodyFatPct == null
      ? t('aesthetic.labels.bodyFatMissing')
      : t('aesthetic.labels.bodyFatValue', { bf: formatBfPct(bodyFatPct) });
  const visualLine = visualBfNote
    ? t('aesthetic.labels.visualLineWithNote', { subtitle: visualSubtitle, note: visualBfNote })
    : visualSubtitle;

  return (
    <article
      data-testid="aesthetic-spec-card"
      className={`relative aspect-[9/16] w-full origin-center ${CERT_STAGE_MAX_H_CLASS} overflow-hidden rounded-2xl border border-[#c9a227]/30 bg-bg-base text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(201,162,39,0.16)] ${CERT_PLATE_REVEAL_CLASS}`}
    >
      <AestheticCardArmor />

      <div className="relative z-10 flex h-full flex-col px-5 pb-5 pt-7">
        <header className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b ${FOIL_RULE_CLASS} pb-2`}>
          <p className="flex min-w-0 items-baseline gap-1.5 text-[10px] tracking-[0.14em] text-zinc-400">
            <span className="min-w-0 truncate">{t('aesthetic.labels.brandHeader')}</span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-100">
              {formatOverallResonanceScore(overallScore)}
            </span>
          </p>
          <p className="shrink-0 text-[10px] tabular-nums text-zinc-500">{readoutYear}</p>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-3 py-3 sm:gap-4 sm:py-4">
          <GuillocheCrest />

          <h3 className={`${FOIL_HERO_STAMP_CLASS} ${CERT_STAMP_REVEAL_CLASS}`}>
            <span className={FOIL_HERO_WING_LEFT_CLASS} aria-hidden="true" />
            <span className={FOIL_HERO_TITLE_CLASS}>{overallTitle}</span>
            <span className={FOIL_HERO_WING_RIGHT_CLASS} aria-hidden="true" />
          </h3>

          <div className="space-y-2.5">
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

        <section className={`border-t ${FOIL_RULE_CLASS} pt-3`}>
          <div className="grid grid-cols-[minmax(4.25rem,auto)_auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-5">
            <AestheticMeter
              label={t('aesthetic.labels.visualMetric')}
              {...overflowMeterProps(spec.visual.score, overflowBadge, unmeasuredLabel)}
              staggerMs={CERT_NEEDLE_STAGGER_MS[0]}
            />
            <AestheticMeter
              label={t('aesthetic.labels.forceMetric')}
              {...overflowMeterProps(spec.force.score, overflowBadge, unmeasuredLabel)}
              staggerMs={CERT_NEEDLE_STAGGER_MS[1]}
            />
            <AestheticMeter
              label={t('aesthetic.labels.kineticMetric')}
              {...overflowMeterProps(spec.kinetic.score, overflowBadge, unmeasuredLabel)}
              staggerMs={CERT_NEEDLE_STAGGER_MS[2]}
            />
          </div>
        </section>

        <footer className={`mt-4 space-y-1.5 border-t ${FOIL_RULE_CLASS} pt-4`}>
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
    </article>
  );
};

export default AestheticSpecCard;
