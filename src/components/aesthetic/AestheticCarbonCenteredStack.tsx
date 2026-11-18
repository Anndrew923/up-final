/**
 * Carbon Compact Centered Stack — shared DOM body for single-leaf + axis-summary.
 * WHY: One gap/order SSOT so preview cards cannot drift when rhythm intent changes.
 * Isolation: Selfie HUD never mounts this shell.
 */
import type { FC } from 'react';
import type { TelemetryVerdictCopy } from '../../lib/telemetryReportTypes';
import AestheticDualHeroMidTier from './AestheticDualHeroMidTier';
import AestheticDualHeroRawReading from './AestheticDualHeroRawReading';
import GuillocheCrest from './GuillocheCrest';
import {
  FOIL_HERO_STAMP_CLASS,
  FOIL_HERO_WING_LEFT_CLASS,
  FOIL_HERO_WING_RIGHT_CLASS,
  FOIL_RULE_CLASS,
} from './aestheticChrome';
import { CERT_STAMP_REVEAL_CLASS } from '../../lib/certRevealMotion';

export type AestheticCarbonCenteredStackProps = {
  /** Prefix for data-testid hooks (`aesthetic-single-leaf` / `aesthetic-axis-summary`). */
  testIdPrefix: string;
  primaryTitle: string;
  secondaryTitle: string;
  titleClassName: string;
  verdictSlotHeightPx: number;
  rawMetricLabel: string;
  upRatingLabel: string;
  rawReading: string;
  heroScoreText: string;
  tierCapsule: string;
  isOverflow: boolean;
  verdict?: TelemetryVerdictCopy;
};

const SCORE_CLASS =
  "max-w-full px-0.5 text-center font-['UPSerifTC','Songti_TC','Noto_Serif_TC','STSong',Palatino,Georgia,serif] text-[clamp(0.7rem,3.8vw,1.25rem)] font-bold leading-tight tabular-nums text-[#f3e6c8]";

/**
 * WHY truncate (not wrap): dual-col kickers — especially muscle `SMM · BW RATIO` — must
 * stay one line under narrow card width. `truncate` already implies nowrap + ellipsis.
 * WHY tracking 0.12em: tighter than title mono so EN dual labels fit without early clip.
 */
const DUAL_HERO_KICKER_CLASS =
  'max-w-full truncate font-mono text-[7px] tracking-[0.12em] text-zinc-500';

const AestheticCarbonCenteredStack: FC<AestheticCarbonCenteredStackProps> = ({
  testIdPrefix,
  primaryTitle,
  secondaryTitle,
  titleClassName,
  verdictSlotHeightPx,
  rawMetricLabel,
  upRatingLabel,
  rawReading,
  heroScoreText,
  tierCapsule,
  isOverflow,
  verdict,
}) => (
  <div className="relative flex min-h-0 flex-1 flex-col justify-center py-1">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.10)_0%,rgba(122,92,40,0.04)_45%,transparent_72%)]"
    />

    <div className="relative flex w-full shrink-0 flex-col items-center text-center">
      <GuillocheCrest />

      <div aria-hidden="true" className={`relative mt-2 w-[78%] border-t ${FOIL_RULE_CLASS}`} />

      <h3 className={`relative mt-2 ${FOIL_HERO_STAMP_CLASS} ${CERT_STAMP_REVEAL_CLASS}`}>
        <span className={FOIL_HERO_WING_LEFT_CLASS} aria-hidden="true" />
        <span data-testid={`${testIdPrefix}-title-primary`} className={titleClassName}>
          {primaryTitle}
        </span>
        <span className={FOIL_HERO_WING_RIGHT_CLASS} aria-hidden="true" />
      </h3>
      {secondaryTitle.trim() ? (
        <p
          data-testid={`${testIdPrefix}-title-secondary`}
          className="relative font-mono text-[8px] tracking-[0.16em] text-zinc-500"
        >
          {secondaryTitle}
        </p>
      ) : null}

      <div
        aria-hidden="true"
        className={`relative mt-3.5 w-[78%] border-t ${FOIL_RULE_CLASS}`}
      />

      <div
        data-testid={`${testIdPrefix}-dual-hero`}
        className="relative mt-3.5 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-1.5 px-0.5"
      >
        <div className="flex min-w-0 flex-col items-center justify-center gap-1 py-1">
          <p
            data-testid={`${testIdPrefix}-raw-kicker`}
            className={DUAL_HERO_KICKER_CLASS}
          >
            {rawMetricLabel}
          </p>
          <AestheticDualHeroRawReading
            rawReading={rawReading}
            testId={`${testIdPrefix}-raw`}
          />
        </div>

        <div
          aria-hidden="true"
          className="my-1 w-px self-stretch bg-gradient-to-b from-transparent via-[#c9a227]/55 to-transparent"
        />

        <div className="flex min-w-0 flex-col items-center justify-center gap-1 py-1">
          <p
            data-testid={`${testIdPrefix}-score-kicker`}
            className={DUAL_HERO_KICKER_CLASS}
          >
            {upRatingLabel}
          </p>
          <p data-testid={`${testIdPrefix}-score`} className={SCORE_CLASS}>
            {heroScoreText}
          </p>
        </div>
      </div>

      <div className="relative mt-2.5 w-full">
        <AestheticDualHeroMidTier
          tierCapsule={tierCapsule}
          isOverflow={isOverflow}
          testIdPrefix={testIdPrefix}
        />
      </div>

      <div
        aria-hidden="true"
        className={`relative mt-2.5 w-[78%] border-t ${FOIL_RULE_CLASS}`}
      />

      <div
        data-testid={`${testIdPrefix}-verdict-slot`}
        className="relative mt-2.5 flex w-full shrink-0 flex-col items-center justify-center gap-1 px-3 text-center"
        style={{ height: verdictSlotHeightPx }}
      >
        {verdict ? (
          <>
            {/* Optical preview scale (~1.5× design px) — not 1:1 with canvas 32/26. */}
            <p
              data-testid={`${testIdPrefix}-verdict-epithet`}
              className="w-full text-[16px] font-bold tracking-[0.12em] text-[#FDE68A] sm:text-[17px]"
            >
              {verdict.epithet}
            </p>
            <p
              data-testid={`${testIdPrefix}-verdict-critique`}
              className="w-full max-w-[92%] text-center text-[13.5px] font-medium leading-snug text-white/90 [text-wrap:balance] sm:text-[14px]"
            >
              {verdict.critique}
            </p>
          </>
        ) : null}
      </div>

      <div aria-hidden="true" className={`relative mt-2 w-[78%] border-t ${FOIL_RULE_CLASS}`} />
    </div>
  </div>
);

export default AestheticCarbonCenteredStack;
