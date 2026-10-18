import { useCallback, useEffect, useRef, useState } from 'react';
import {
  resolveRadarPkCompareExitMs,
  resolveRadarPkScanMs,
  type RadarPkCompareMotion,
  type RadarPkPhase,
} from '../logic/core/radarPkClashMotion';
import type { RadarChartPoint } from '../types/radarDisplay';

function readPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Mirrors HexRadarChart presentation modes without importing the chart module. */
export type RadarPkPresentation = 'ritual' | 'quiet';

export type { RadarPkCompareMotion, RadarPkPhase };

export interface UseRadarPkToggleParams {
  open: boolean;
  /** Resets PK when the inspected member changes. */
  targetUid?: string | null;
  isSelf: boolean;
  /** Local six-axis baseline is usable for compare-with-me. */
  canCompare: boolean;
  /** Localized comparison vertices — only forwarded while clash layer is visible. */
  comparisonPoints?: RadarChartPoint[];
}

export interface UseRadarPkToggleResult {
  showPkToggle: boolean;
  /** Ceremony phase: idle → scanning → clashed (exit skips scanning). */
  pkPhase: RadarPkPhase;
  /** True while scanning or clashed (toggle “in PK mode”). */
  pkActive: boolean;
  /** Diagnostic extract veil currently showing. */
  isScanning: boolean;
  /** Gold clash chrome ready (clashed or soft-exit hold). */
  clashReady: boolean;
  /**
   * Visual quiet shell — scanning, clashed, or soft exit hold.
   * WHY: Scan HUD needs quiet grid; exit hold keeps gold fade before ritual.
   */
  pkLayerActive: boolean;
  /** Enter vs exit CSS for gold clash — null while scanning / idle. */
  compareMotion: RadarPkCompareMotion | null;
  presentation: RadarPkPresentation;
  activeComparisonPoints: RadarChartPoint[] | undefined;
  togglePk: () => void;
}

export function resolveShowRadarPkToggle(params: {
  open: boolean;
  isSelf: boolean;
  canCompare: boolean;
}): boolean {
  return params.open && !params.isSelf && params.canCompare;
}

/**
 * Opt-in PK mode for club / global ladder radar sheets.
 * WHY: Diagnostic scan veil then gold clash; exit fades without re-scanning.
 */
export function useRadarPkToggle({
  open,
  targetUid,
  isSelf,
  canCompare,
  comparisonPoints,
}: UseRadarPkToggleParams): UseRadarPkToggleResult {
  const [pkPhase, setPkPhase] = useState<RadarPkPhase>('idle');
  const [isExiting, setIsExiting] = useState(false);
  const scanTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const clearScanTimer = useCallback(() => {
    if (scanTimerRef.current != null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearScanTimer();
    clearExitTimer();
  }, [clearScanTimer, clearExitTimer]);

  const hardReset = useCallback(() => {
    clearAllTimers();
    setIsExiting(false);
    setPkPhase('idle');
  }, [clearAllTimers]);

  // Hard reset — no ceremony when sheet/target/eligibility collapses.
  useEffect(() => {
    hardReset();
  }, [open, targetUid, isSelf, canCompare, hardReset]);

  const showPkToggle = resolveShowRadarPkToggle({ open, isSelf, canCompare });
  const isScanning = pkPhase === 'scanning';
  const pkActive = isScanning || pkPhase === 'clashed';
  const clashReady = pkPhase === 'clashed' || isExiting;
  const pkLayerActive = pkActive || isExiting;
  const compareMotion: RadarPkCompareMotion | null = isExiting
    ? 'exit'
    : pkPhase === 'clashed'
      ? 'enter'
      : null;
  const presentation: RadarPkPresentation = pkLayerActive ? 'quiet' : 'ritual';
  // Gold plate + winners only after scan completes (or during exit fade).
  const activeComparisonPoints = clashReady ? comparisonPoints : undefined;

  const beginExit = useCallback(() => {
    clearAllTimers();
    setPkPhase('idle');
    const exitMs = resolveRadarPkCompareExitMs(readPrefersReducedMotion());
    if (exitMs <= 0) {
      setIsExiting(false);
      return;
    }
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      setIsExiting(false);
      exitTimerRef.current = null;
    }, exitMs);
  }, [clearAllTimers]);

  const togglePk = useCallback(() => {
    if (!showPkToggle) return;

    if (pkPhase === 'scanning') {
      // Capsule is disabled while scanning — defensive no-op.
      return;
    }

    if (pkPhase === 'clashed') {
      beginExit();
      return;
    }

    // idle → scanning → clashed (re-entry during soft exit cancels the fade).
    clearAllTimers();
    setIsExiting(false);
    setPkPhase('scanning');
    const scanMs = resolveRadarPkScanMs(readPrefersReducedMotion());
    if (scanMs <= 0) {
      setPkPhase('clashed');
      return;
    }
    scanTimerRef.current = window.setTimeout(() => {
      setPkPhase('clashed');
      scanTimerRef.current = null;
    }, scanMs);
  }, [showPkToggle, pkPhase, beginExit, clearAllTimers]);

  return {
    showPkToggle,
    pkPhase,
    pkActive,
    isScanning,
    clashReady,
    pkLayerActive,
    compareMotion,
    presentation,
    activeComparisonPoints,
    togglePk,
  };
}
