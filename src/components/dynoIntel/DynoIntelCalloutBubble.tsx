import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface DynoIntelCalloutBubbleProps {
  onDismiss: () => void;
  className?: string;
}

/**
 * One-shot coachmark anchored above the DYNO INTEL trigger.
 * WHY: Non-modal popover — dismiss marks discovery without opening the sheet.
 */
const DynoIntelCalloutBubble: FC<DynoIntelCalloutBubbleProps> = ({ onDismiss, className }) => {
  const { t } = useTranslation('common');
  const callout = t('dynoIntel.triggerDiscovery.callout');
  const dismissGlyph = t('dynoIntel.triggerDiscovery.calloutDismiss');
  // WHY: Visual dismiss is ✕; SR needs a real phrase — calloutAria already exists for this coachmark.
  const calloutAria = t('dynoIntel.triggerDiscovery.calloutAria');

  return (
    <div
      className={cn(
        'pointer-events-auto absolute bottom-full right-0 z-[2] mb-2 w-max max-w-[min(calc(100vw-2rem),16rem)] overflow-visible',
        className,
      )}
      role="presentation"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={calloutAria}
        className={cn(
          'relative w-full rounded-xl border border-cyan-400/45 bg-zinc-950/95 px-3 py-2.5 text-left',
          'shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur-sm',
          'motion-safe:animate-[arena-telemetry-pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none',
          'motion-safe:transition-opacity motion-safe:duration-200 motion-safe:active:opacity-80',
        )}
      >
        <p className="pr-5 text-xs leading-relaxed text-zinc-100">{callout}</p>
        <span
          className="pointer-events-none absolute right-2 top-2 text-[10px] leading-none text-cyan-300/80"
          aria-hidden
        >
          {dismissGlyph}
        </span>
        <span
          className="pointer-events-none absolute -bottom-1.5 right-5 h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-cyan-400/45"
          aria-hidden
        />
      </button>
    </div>
  );
};

export default DynoIntelCalloutBubble;
