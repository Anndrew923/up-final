/**
 * Contextual "generate single-leaf report" CTA under assessment score blocks.
 * Champagne foil outline — visually secondary to solid orange Write-to-Radar, but high-exposure.
 */
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SingleLeafId } from '../../logic/aesthetic/singleLeafReport';
import { cn } from '../../lib/cn';
import { useAestheticReportUiStore } from '../../stores/aestheticReportUiStore';
import {
  AESTHETIC_SINGLE_LEAF_CTA_CLASS,
  AestheticSingleLeafCtaIcon,
} from './aestheticSingleLeafCtaChrome';

export interface AestheticSingleLeafTriggerButtonProps {
  leaf: SingleLeafId;
  disabled?: boolean;
  /**
   * Flush in-memory calculate results into local drafts before the modal opens.
   * WHY: Modal resolves offline from `up.*Inputs` — without this, preview-only scores
   * would open an unavailable card.
   */
  onBeforeOpen?: () => void | boolean;
  className?: string;
}

const AestheticSingleLeafTriggerButton: FC<AestheticSingleLeafTriggerButtonProps> = ({
  leaf,
  disabled,
  onBeforeOpen,
  className,
}) => {
  const { t } = useTranslation('common');
  const openWithLeaf = useAestheticReportUiStore((s) => s.openWithLeaf);

  return (
    <button
      type="button"
      data-testid={`aesthetic-single-leaf-trigger-${leaf}`}
      className={cn(AESTHETIC_SINGLE_LEAF_CTA_CLASS, className)}
      disabled={disabled}
      onClick={() => {
        const ok = onBeforeOpen?.();
        if (ok === false) return;
        openWithLeaf(leaf);
      }}
    >
      <AestheticSingleLeafCtaIcon />
      <span className="min-w-0 truncate">{t('aesthetic.singleLeaf.generateReport')}</span>
    </button>
  );
};

export default AestheticSingleLeafTriggerButton;
