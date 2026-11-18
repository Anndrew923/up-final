/**
 * Carbon DOM left-hero mixed type — mirrors Canvas paintCarbonMetricMixed.
 */
import type { FC } from 'react';
import { splitMetricParts } from '../../lib/telemetrySingleLeafMetricMix';

export interface AestheticDualHeroRawReadingProps {
  rawReading: string;
  testId?: string;
}

const AestheticDualHeroRawReading: FC<AestheticDualHeroRawReadingProps> = ({
  rawReading,
  testId,
}) => {
  const { primary, secondary } = splitMetricParts(rawReading);
  if (!secondary) {
    return (
      <p
        data-testid={testId}
        className="max-w-full px-0.5 text-center text-[clamp(0.7rem,3.8vw,1.25rem)] font-bold leading-tight tabular-nums tracking-wide text-white"
      >
        {primary || rawReading}
      </p>
    );
  }
  return (
    <p
      data-testid={testId}
      className="flex max-w-full items-baseline justify-center gap-1.5 px-0.5 text-center leading-none"
    >
      <span className="text-[clamp(0.75rem,4vw,1.35rem)] font-bold tabular-nums tracking-wide text-white">
        {primary}
      </span>
      <span className="text-[clamp(0.5rem,2.6vw,0.8rem)] font-semibold tabular-nums tracking-wide text-white/85">
        {secondary}
      </span>
    </p>
  );
};

export default AestheticDualHeroRawReading;
