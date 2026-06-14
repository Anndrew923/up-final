import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import {
  DYNO_INTEL_TRIGGER_TICKER_INTERVAL_MS,
  useDynoIntelTriggerTicker,
} from '../../hooks/useDynoIntelTriggerTicker';
import { cn } from '../../lib/cn';
import {
  DYNO_INTEL_TRIGGER_CONTENT_TRANSITION,
  DYNO_INTEL_TRIGGER_MORPH_MS,
  DYNO_INTEL_TRIGGER_MORPH_TRANSITION,
  DYNO_INTEL_TRIGGER_SINK_TRANSITION,
  dynoIntelTriggerCrosshairVisible,
  dynoIntelTriggerMorphScaleX,
  dynoIntelTriggerSinkClasses,
  dynoIntelTriggerTickerVisible,
  dynoIntelTriggerWillChange,
} from '../../lib/dynoIntelTriggerMotion';
import { hapticService } from '../../services/hapticService';
import DynoIntelCrosshairIcon from './DynoIntelCrosshairIcon';

export interface DynoActiveTriggerProps {
  /**
   * @deprecated Route console label is shown in the bottom sheet only; trigger uses ticker copy.
   * Kept optional for backward compatibility at call sites.
   */
  consoleLabel?: string;
  onPress: () => void;
  hidden?: boolean;
  /** Sink + fade the chip while the intel bottom sheet is open. */
  sheetOpen?: boolean;
}

const DynoActiveTrigger: FC<DynoActiveTriggerProps> = ({
  onPress,
  hidden = false,
  sheetOpen = false,
}) => {
  const { t } = useTranslation('common');
  const { label: tickerLabel, phase, reducedMotion } = useDynoIntelTriggerTicker({
    enabled: !hidden && !sheetOpen,
  });
  const motionOn = !reducedMotion;
  const [pressExpanded, setPressExpanded] = useState(false);
  const [compositorHint, setCompositorHint] = useState(false);
  const pressExpandTimerRef = useRef<number | null>(null);

  const isExpanded = motionOn && (phase === 'scanning' || pressExpanded);
  const morphScaleX = dynoIntelTriggerMorphScaleX(isExpanded);
  const sink = dynoIntelTriggerSinkClasses(sheetOpen, reducedMotion);

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

  useEffect(() => {
    if (!sheetOpen) return;
    clearPressExpandTimer();
    setPressExpanded(false);
  }, [sheetOpen, clearPressExpandTimer]);

  useEffect(() => {
    if (!motionOn) {
      setCompositorHint(false);
      return;
    }
    setCompositorHint(true);
    const id = window.setTimeout(() => setCompositorHint(false), DYNO_INTEL_TRIGGER_MORPH_MS);
    return () => window.clearTimeout(id);
  }, [isExpanded, motionOn, sheetOpen]);

  const handleClick = useCallback(() => {
    if (sheetOpen) return;
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
  }, [clearPressExpandTimer, motionOn, onPress, sheetOpen]);

  if (hidden) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 flex justify-end px-4',
        Z_INDEX_CLASS.dynoIntelTrigger,
        'pb-[calc(94px+env(safe-area-inset-bottom,0px))]',
        DYNO_INTEL_TRIGGER_SINK_TRANSITION,
        sink.wrapper,
      )}
    >
      <div className="flex h-9 w-28 justify-end">
        <button
          type="button"
          aria-label={t('dynoIntel.triggerAria')}
          aria-hidden={sheetOpen}
          tabIndex={sink.interactive ? 0 : -1}
          disabled={!sink.interactive}
          onClick={handleClick}
          style={{ transform: `scaleX(${morphScaleX})` }}
          className={cn(
            'magitek-chassis-grid ui-btn-diagnostics pointer-events-auto relative isolate h-9 w-28 shrink-0 origin-right overflow-visible rounded-full',
            'border-0 bg-transparent p-0 shadow-none backdrop-blur-none',
            DYNO_INTEL_TRIGGER_MORPH_TRANSITION,
            dynoIntelTriggerWillChange(compositorHint || pressExpanded),
            'motion-reduce:transition-none',
          )}
        >
          <span
            className={cn(
              'relative flex h-full w-full items-center justify-center overflow-hidden rounded-full',
              'border border-cyan-400/40 bg-zinc-950/55 shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-sm',
              'motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-report-ease motion-safe:active:scale-[0.92]',
              'motion-reduce:transition-none',
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
                'absolute inset-0 z-[1] flex items-center justify-center text-[#DFFF00]',
                DYNO_INTEL_TRIGGER_CONTENT_TRANSITION,
                dynoIntelTriggerCrosshairVisible(isExpanded),
              )}
              aria-hidden={isExpanded}
            >
              <DynoIntelCrosshairIcon className="h-3.5 w-3.5 shrink-0" />
            </span>
            <span
              className={cn(
                'absolute inset-x-0 z-[1] flex items-center justify-center px-3',
                'font-mono text-[9px] font-semibold uppercase tracking-wider text-[#DFFF00] tabular-nums',
                DYNO_INTEL_TRIGGER_CONTENT_TRANSITION,
                dynoIntelTriggerTickerVisible(isExpanded),
              )}
              aria-hidden={!isExpanded}
            >
              {tickerLabel}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default DynoActiveTrigger;
