/**
 * Shell-mounted host for the aesthetic telemetry modal (store-driven).
 * WHY: Assessment pages open via openWithLeaf / home via openWithSmartDefault —
 * Host only mirrors store open/selection; no in-modal report-type switcher.
 */
import type { FC } from 'react';
import { useAestheticReportUiStore } from '../../stores/aestheticReportUiStore';
import AestheticSpecModal from './AestheticSpecModal';

const AestheticSpecModalHost: FC = () => {
  const isOpen = useAestheticReportUiStore((s) => s.isOpen);
  const selection = useAestheticReportUiStore((s) => s.selection);
  const close = useAestheticReportUiStore((s) => s.close);

  if (!isOpen) return null;

  return <AestheticSpecModal onClose={close} selection={selection} />;
};

export default AestheticSpecModalHost;
