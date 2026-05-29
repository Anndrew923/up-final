import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  resolveHomeSubsectionString,
  type HomeFormSubsection,
} from '../i18n/resolveHomeBundleCopy';

/**
 * Stable accessor for `home.profile` / `home.ladderIdentity` copy (HMR-safe).
 */
export function useHomeFormCopy(subsection: HomeFormSubsection) {
  const { t } = useTranslation('common');

  return useCallback(
    (field: string, interpolation?: Record<string, unknown>) =>
      resolveHomeSubsectionString(t, subsection, field, interpolation),
    [t, subsection]
  );
}
