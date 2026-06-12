import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import {
  DYNO_INTEL_TRIGGER_TICKER_INTERVAL_MS,
  useDynoIntelTriggerTicker,
} from '../../hooks/useDynoIntelTriggerTicker';
import { cn } from '../../lib/cn';
import { hapticService } from '../../services/hapticService';

export interface DynoActiveTriggerProps {
  /**
   * @deprecated Route console label is shown in the bottom sheet only; trigger uses ticker copy.
   * Kept optional for backward compatibility at call sites.
   */
  consoleLabel?: string;
  onPress: () => void;
  hidden?: boolean;
}

const DynoActiveTrigger: FC<DynoActiveTriggerProps> = ({ onPress, hidden = false }) => {
  const { t } = useTranslation('common');
  const { label: tickerLabel, phase, reducedMotion } = useDynoIntelTriggerTicker({
    enabled: !hidden,
  });
  const motionOn = !reducedMotion;
  const [pressExpanded, setPressExpanded] = useState(false);
  const pressExpandTimerRef = useRef<number | null>(null);

  const isExpanded = motionOn && (phase === 'scanning' || pressExpanded);

  const clearPressExpandTimer = useCallback(() => {
    if (pressExpandTimerRef.current != null) {
      window.clearTimeout(pressExpandTimerRef.current);
      pressExpandTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPressExpandTimer(), [clearPressExpandTimer]);

  useEffect(() => {
    if (!hidden) return;
    clearPressExpandTimer();
    setPressExpanded(false);
  }, [hidden, clearPressExpandTimer]);

  const handleClick = useCallback(() => {
    void hapticService.trigger('ack');
    if (motionOn) {
      clearPressExpandTimer();
      setPressExpanded(true);
      pressExpandTimerRef.current = window.setTimeout(() => {
        setPressExpanded(false);
        pressExpandTimerRef.current = null;
      }, DYNO_INTEL_TRIGGER_TICKER_INTERVAL_MS);
    }
    onPress();
  }, [clearPressExpandTimer, motionOn, onPress]);

  if (hidden) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 flex justify-end px-4',
        Z_INDEX_CLASS.dynoIntelTrigger,
        'pb-[calc(94px+env(safe-area-inset-bottom,0px))]',
      )}
    >
      <button
        type="button"
        aria-label={t('dynoIntel.triggerAria')}
        onClick={handleClick}
        className={cn(
          'magitek-chassis-grid ui-btn-diagnostics pointer-events-auto relative isolate flex h-9 items-center justify-center overflow-hidden',
          'border border-cyan-400/40 bg-zinc-950/55 shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-sm',
          '[will-change:width,border-radius] transition-all duration-300 ease-in-out active:scale-[0.92]',
          'motion-reduce:transition-none',
          isExpanded ? 'w-28 rounded-2xl px-3' : 'w-9 rounded-full px-0',
        )}
      >
        {motionOn ? (
          <>
            <span
              className="pointer-events-none absolute -inset-1 rounded-[inherit] border border-dashed border-cyan-400/50 animate-[arena-radar-sweep_10s_linear_infinite]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-[inherit] border border-cyan-400/70 animate-arena-telemetry-pulse"
              aria-hidden
            />
          </>
        ) : (
          <span
            className="pointer-events-none absolute inset-0 rounded-[inherit] border border-cyan-400/60"
            aria-hidden
          />
        )}
        <span
          className={cn(
            'relative z-[1] font-mono text-[9px] font-semibold uppercase tracking-wider text-[#DFFF00] tabular-nums',
            'transition-opacity duration-300 ease-in-out',
            isExpanded ? 'opacity-100' : 'pointer-events-none absolute opacity-0',
          )}
          aria-hidden={!isExpanded}
        >
          {tickerLabel}
        </span>
        <span
          className={cn(
            'relative z-[1] font-mono text-[10px] font-bold text-[#DFFF00] transition-opacity duration-300 ease-in-out',
            isExpanded ? 'pointer-events-none absolute opacity-0' : 'opacity-100',
          )}
          aria-hidden={isExpanded}
        >
          {t('dynoIntel.triggerBadge')}
        </span>
      </button>
    </div>
  );
};

export default DynoActiveTrigger;
