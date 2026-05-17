import type { FC } from 'react';
import DiagnosticOverlay, { type DiagnosticAccent } from './DiagnosticOverlay';
import type { UseAssessmentCeremonyResult } from '../../hooks/useAssessmentCeremony';

export interface AssessmentCeremonyOverlayProps {
  ceremony: Pick<
    UseAssessmentCeremonyResult,
    'isActive' | 'statusLine' | 'scanningLabel' | 'overlayAriaLabel'
  >;
  accent: DiagnosticAccent;
}

/** Binds ceremony hook state to the diagnostic overlay — keeps assessment pages DRY. */
const AssessmentCeremonyOverlay: FC<AssessmentCeremonyOverlayProps> = ({ ceremony, accent }) => (
  <DiagnosticOverlay
    open={ceremony.isActive}
    statusLine={ceremony.statusLine}
    scanningLabel={ceremony.scanningLabel}
    accent={accent}
    ariaLabel={ceremony.overlayAriaLabel}
  />
);

export default AssessmentCeremonyOverlay;
