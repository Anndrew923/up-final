import { useCallback, useState, type FC } from 'react';
import { HEALTH_TERMS_VERSION } from '../../logic/core/termsAcceptance';
import {
  hasAcceptedHealthTerms,
  persistHealthTermsAcceptance,
} from '../../services/termsAcceptanceService';
import TermsLegalModal from './TermsLegalModal';

/**
 * Global first-line legal gate after AppShell may mount.
 * WHY: Covers returning users / version bumps who never saw AuthChoice consent copy.
 */
export const TermsGatekeeper: FC = () => {
  const [needsAccept, setNeedsAccept] = useState(
    () => !hasAcceptedHealthTerms(HEALTH_TERMS_VERSION)
  );
  const [accepting, setAccepting] = useState(false);

  const handleAccept = useCallback(() => {
    if (accepting) return;
    setAccepting(true);
    try {
      // Local stamp is sync — dismiss immediately; cloud audit is fire-and-forget inside persist.
      persistHealthTermsAcceptance(HEALTH_TERMS_VERSION);
      setNeedsAccept(false);
    } finally {
      setAccepting(false);
    }
  }, [accepting]);

  return (
    <TermsLegalModal
      open={needsAccept}
      mode="gate"
      accepting={accepting}
      onAccept={handleAccept}
    />
  );
};

export default TermsGatekeeper;
