import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveHomeSectionString } from '../../i18n/resolveHomeBundleCopy';
import { ConsoleCtaPlate } from './ConsoleCtaPlate';

export interface HomeDiagnosticsPanelProps {
  disabled?: boolean;
  className?: string;
  onStartDiagnostics: () => void;
}

/**
 * Telemetry-mode diagnostics CTA — amber bevel plate matching the fitness foil trigger.
 * WHY: Same h-12 / rounded-xl / pr-4 chevron rail so tab switches do not jump.
 */
const HomeDiagnosticsPanel: FC<HomeDiagnosticsPanelProps> = ({
  disabled = false,
  className,
  onStartDiagnostics,
}) => {
  const { t } = useTranslation('common');
  const ctaLabel = resolveHomeSectionString(t, 'diagnostics', 'cta');

  return (
    <ConsoleCtaPlate
      variant="telemetry"
      testId="diagnostics"
      disabled={disabled}
      className={className}
      ariaLabel={ctaLabel}
      onClick={onStartDiagnostics}
    >
      {ctaLabel}
    </ConsoleCtaPlate>
  );
};

export default HomeDiagnosticsPanel;
