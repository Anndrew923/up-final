import type { ButtonHTMLAttributes, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

/**
 * Full-width honor-core CTA on assessment pages.
 * WHY: Copy tracks clear-on-edit — explore/calculate until a preview exists, then write-to-radar.
 */
export const ASSESSMENT_WRITE_TO_RADAR_BTN_CLASS =
  'h-12 w-full rounded-xl bg-amber-500 text-sm font-bold tracking-tight text-black shadow-lg shadow-amber-500/25 transition duration-150 hover:bg-amber-400 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:pointer-events-none disabled:opacity-40';

export type AssessmentWriteToRadarButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  /** Localized axis short name for {{axis}} interpolation. */
  axisLabel: string;
  /**
   * True when the page already shows a valid preview / honor-card score.
   * WHY: Avoids "write before I know my score" friction on first entry and after edits.
   */
  hasScore: boolean;
};

const AssessmentWriteToRadarButton: FC<AssessmentWriteToRadarButtonProps> = ({
  axisLabel,
  hasScore,
  className,
  type = 'button',
  ...rest
}) => {
  const { t } = useTranslation('common');
  const label = t(
    hasScore ? 'assessment.writeToRadarWithAxis' : 'assessment.calculateRadarWithAxis',
    { axis: axisLabel }
  );

  return (
    <button type={type} className={cn(ASSESSMENT_WRITE_TO_RADAR_BTN_CLASS, className)} {...rest}>
      {label}
    </button>
  );
};

export default AssessmentWriteToRadarButton;
