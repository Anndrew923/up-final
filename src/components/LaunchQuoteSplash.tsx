import {
  type FC,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../constants/uiZIndex';
import { pickNextHardcoreQuote, type HardcoreQuote } from '../data/hardcoreQuotes';
import { prefersReducedMotion } from '../lib/motionPreference';
import {
  LAUNCH_FADE_MS,
  LAUNCH_HOLD_MS,
  LAUNCH_NEEDLE_MS,
  TACH_CHROME_GOLD_CLASS,
  TACH_CHROME_GOLD_MUTED_CLASS,
  TACH_COLOR_GOLD,
  isLaunchRedline,
  isZhLaunchLocale,
} from '../logic/core/launchTachometer';
import LaunchTachDial from './LaunchTachDial';

/** Champagne serif — mirrors aesthetic foil stack; kept local so splash stays decoupled from cert chrome. */
const LAUNCH_QUOTE_SERIF_CLASS =
  "font-['UPSerifTC','Songti_TC','Noto_Serif_TC','STSong',Palatino,Georgia,serif]";

export interface LaunchQuoteSplashProps {
  /**
   * Underlying app settled (auth bootstrap no longer holding a blank gate).
   * WHY: Auto-dismiss waits for both the 1.5s reading window AND this flag.
   */
  ready?: boolean;
  onDismissed?: () => void;
  /** Test/deterministic progress 0–1; when set, skips the internal needle ramp. */
  progressOverride?: number;
  /** Inject quote for tests (skips localStorage pick). */
  quoteOverride?: HardcoreQuote;
}

/**
 * Launch splash shell — boot timing + quote + tap-to-skip.
 * WHY: Dial craft lives in LaunchTachDial so ceremony timers cannot entangle with SVG churn.
 */
const LaunchQuoteSplash: FC<LaunchQuoteSplashProps> = ({
  ready = true,
  onDismissed,
  progressOverride,
  quoteOverride,
}) => {
  const { i18n } = useTranslation();
  // WHY: Lazy state init (not render-time ref write) — avoids StrictMode double-pick side effects mid-render.
  const [quote] = useState<HardcoreQuote>(
    () => quoteOverride ?? pickNextHardcoreQuote()
  );

  const [progress, setProgress] = useState(() =>
    progressOverride != null ? progressOverride : prefersReducedMotion() ? 1 : 0
  );
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const dismissStarted = useRef(false);
  const fadeTimerRef = useRef<number | null>(null);
  const mountedAt = useRef(
    typeof performance !== 'undefined' ? performance.now() : Date.now()
  );
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;

  const localeZh = isZhLaunchLocale(i18n.resolvedLanguage ?? i18n.language);
  const quoteText = localeZh ? quote.zh : quote.en;
  const displayProgress = progressOverride ?? progress;
  const atRedline = isLaunchRedline(displayProgress);

  const finishDismiss = useCallback(() => {
    setGone(true);
    onDismissedRef.current?.();
  }, []);

  const beginDismiss = useCallback(() => {
    if (dismissStarted.current) return;
    dismissStarted.current = true;
    setFading(true);
    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      finishDismiss();
    }, LAUNCH_FADE_MS);
  }, [finishDismiss]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current != null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (progressOverride != null) return;
    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(1, elapsed / LAUNCH_NEEDLE_MS);
      setProgress(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressOverride]);

  useEffect(() => {
    if (dismissStarted.current || gone) return;
    if (!ready) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsed = now - mountedAt.current;
    const remain = Math.max(0, LAUNCH_HOLD_MS - elapsed);

    const id = window.setTimeout(() => {
      beginDismiss();
    }, remain);
    return () => window.clearTimeout(id);
  }, [ready, beginDismiss, gone]);

  const onTap = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      beginDismiss();
    },
    [beginDismiss]
  );

  if (gone) return null;

  return (
    <div
      role="presentation"
      data-testid="launch-quote-splash"
      className={`fixed inset-0 ${Z_INDEX_CLASS.bootSequenceOverlay} flex cursor-pointer flex-col bg-[#050608] pt-safe pb-safe transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      onClick={onTap}
      aria-busy={!atRedline}
      aria-live="polite"
    >
      {/* Quiet brand telemetry — fills upper vertical whitespace without competing with the dial. */}
      <div className="flex shrink-0 justify-center px-4 pt-3 pb-1">
        <p
          data-testid="launch-telemetry-header"
          data-chrome-gold={TACH_COLOR_GOLD}
          className={`font-mono text-[9px] uppercase tracking-[0.35em] ${TACH_CHROME_GOLD_MUTED_CLASS}`}
        >
          ULTIMATE PHYSIQUE // TELEMETRY
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        <LaunchTachDial progress={displayProgress} />

        <div
          className="mt-5 flex w-full max-w-[22rem] flex-col items-center px-3"
          data-testid="launch-quote-zone"
        >
          <div
            className="mb-3 h-px w-24 bg-gradient-to-r from-transparent via-[#00E5FF]/35 to-transparent"
            aria-hidden
          />
          <blockquote
            data-testid="launch-hardcore-quote"
            data-chrome-gold={TACH_COLOR_GOLD}
            className={`w-full max-w-[22rem] px-2 text-balance text-center text-[0.95rem] leading-relaxed ${TACH_CHROME_GOLD_CLASS} ${LAUNCH_QUOTE_SERIF_CLASS}`}
          >
            {quoteText}
          </blockquote>
          <div
            className="mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#F3D078]/35 to-transparent"
            aria-hidden
          />
        </div>
      </div>

      <div className="flex shrink-0 items-end justify-between px-4 pb-3 pt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500/70">
        <span data-testid="launch-stamp-rpm">1/MIN × 1000</span>
        <span data-testid="launch-stamp-skip">TAP TO SKIP</span>
      </div>
    </div>
  );
};

export default LaunchQuoteSplash;
