import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { GateSheetKind } from '../../types/uiGate';
import LeaderboardGateSheet from './LeaderboardGateSheet';

export interface LadderUploadGateSheetPortalProps {
  gateSheetKind: GateSheetKind | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Renders ladder-upload gate sheet when auth/pro blocks sync — shared by bar + breakthrough modal. */
const LadderUploadGateSheetPortal: FC<LadderUploadGateSheetPortalProps> = ({
  gateSheetKind,
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('common');
  if (!gateSheetKind) return null;

  return (
    <LeaderboardGateSheet
      open={open}
      kind={gateSheetKind}
      description={t(`ladder.gateSheet.${gateSheetKind}.body`)}
      secondaryLabel={t('gateSheet.secondary')}
      onSecondary={onClose}
      onPrimary={onConfirm}
    />
  );
};

export default LadderUploadGateSheetPortal;
