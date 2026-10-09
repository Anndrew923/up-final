import type { ButtonHTMLAttributes, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

/**
 * Full-width honor-core CTA on assessment pages.
 * WHY: Axis context lives in the page header / score card — CTA stays a pure verb so EN/narrow
 * screens never restate the axis. Copy tracks clear-on-edit: calculate until preview, then write.
 */
export const ASSESSMENT_WRITE_TO_RADAR_BTN_CLASS =
  'h-12 w-full rounded-xl bg-amber-500 text-center text-sm font-bold tracking-tight text-black shadow-lg shadow-amber-500/25 transition duration-150 hover:bg-amber-400 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:pointer-events-none disabled:opacity-40';

export type AssessmentWriteToRadarButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  /**
   * True when the page already shows a valid preview / honor-card score.
   * WHY: Avoids "write before I know my score" friction on first entry and after edits.
   */
  hasScore: boolean;
};

const AssessmentWriteToRadarButton: FC<AssessmentWriteToRadarButtonProps> = ({
  hasScore,
  className,
  type = 'button',
  ...rest
}) => {
  const { t } = useTranslation('common');
  const label = t(hasScore ? 'assessment.writeToRadarAction' : 'assessment.calculateRadarAction');

  return (
    <button type={type} className={cn(ASSESSMENT_WRITE_TO_RADAR_BTN_CLASS, className)} {...rest}>
      {label}
    </button>
  );
};

export default AssessmentWriteToRadarButton;
