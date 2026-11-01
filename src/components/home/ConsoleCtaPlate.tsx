import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { ConsoleCtaChevron, ConsoleCtaSweep } from './ConsoleCtaChevron';
import {
  CERT_CHEVRON_CLASS,
  CERT_LABEL_CLASS,
  CERT_TRIGGER_CLASS,
  DIAGNOSTICS_CHEVRON_CLASS,
  DIAGNOSTICS_LABEL_CLASS,
  DIAGNOSTICS_TRIGGER_CLASS,
} from './consoleCtaChrome';

const CONSOLE_CTA_PAINT = {
  fitness: {
    trigger: CERT_TRIGGER_CLASS,
    label: CERT_LABEL_CLASS,
    chevron: CERT_CHEVRON_CLASS,
  },
  telemetry: {
    trigger: DIAGNOSTICS_TRIGGER_CLASS,
    label: DIAGNOSTICS_LABEL_CLASS,
    chevron: DIAGNOSTICS_CHEVRON_CLASS,
  },
} as const;

export type ConsoleCtaVariant = keyof typeof CONSOLE_CTA_PAINT;

export interface ConsoleCtaPlateProps {
  variant: ConsoleCtaVariant;
  testId: string;
  disabled?: boolean;
  className?: string;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}

/**
 * Exclusive console CTA shell — sweep / foil clip / chevron stay on one raster.
 * WHY: Fitness and telemetry only swap paint tokens so tab switches cannot jump.
 */
export const ConsoleCtaPlate: FC<ConsoleCtaPlateProps> = ({
  variant,
  testId,
  disabled = false,
  className,
  ariaLabel,
  onClick,
  children,
}) => {
  const paint = CONSOLE_CTA_PAINT[variant];

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(paint.trigger, className)}
    >
      <ConsoleCtaSweep />
      <span className={paint.label}>{children}</span>
      <ConsoleCtaChevron className={paint.chevron} />
    </button>
  );
};
