import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../lib/motionPreference';
import type { SomatotypeLabSnapshot } from '../logic/core/somatotypeLab';
import { hapticService } from '../services/hapticService';

export type SomatotypeAnalysisState = 'idle' | 'analyzing' | 'completed';

export const SOMATOTYPE_ANALYSIS_MS = 2000;
export const SOMATOTYPE_ANALYSIS_REDUCED_MS = 400;
export const SOMATOTYPE_SCAN_HAPTIC_INTERVAL_MS = 500;
export const SOMATOTYPE_SCAN_HAPTIC_COUNT = 4;
const STATUS_TICK_MS = 650;

export interface UseSomatotypeLabRitualResult {
  analysisState: SomatotypeAnalysisState;
  /** Frozen snapshot shown in the report modal (set at analysis start). */
  reportSnapshot: SomatotypeLabSnapshot | null;
  /** Monotonic id bumped each analysis start — forces chart remount on every report open. */
  reportSessionId: number;
  statusLine: string;
  scanningLabel: string;
  overlayAriaLabel: string;
  isAnalyzing: boolean;
  modalOpen: boolean;
  runAnalysis: () => void;
  closeReport: () => void;
}

function readRitualLines(t: (key: string) => string): string[] {
  return [
    t('tools.somatotypeLab.ritual.lines.bone'),
    t('tools.somatotypeLab.ritual.lines.somatotype'),
    t('tools.somatotypeLab.ritual.lines.ceiling'),
  ].filter((line) => line.trim().length > 0);
}

/**
 * Ritual timeline for the somatotype lab: analyze veil (2s) → report modal.
 * WHY: Live form math stays in useSomatotypeLab; ceremony UX + haptics are isolated here.
 */
export function useSomatotypeLabRitual(
  canAnalyze: boolean,
  liveSnapshot: SomatotypeLabSnapshot | null
): UseSomatotypeLabRitualResult {
  const { t } = useTranslation('common');
  const [analysisState, setAnalysisState] = useState<SomatotypeAnalysisState>('idle');
  const [reportSnapshot, setReportSnapshot] = useState<SomatotypeLabSnapshot | null>(null);
  const [reportSessionId, setReportSessionId] = useState(0);
  const [statusLine, setStatusLine] = useState('');
  const busyRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const intervalIdsRef = useRef<number[]>([]);

  const scanningLabel = t('tools.somatotypeLab.ritual.scanning');
  const overlayAriaLabel = t('tools.somatotypeLab.ritual.overlayAria');

  const clearTimers = useCallback(() => {
    for (const id of timeoutIdsRef.current) window.clearTimeout(id);
    for (const id of intervalIdsRef.current) window.clearInterval(id);
    timeoutIdsRef.current = [];
    intervalIdsRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const closeReport = useCallback(() => {
    clearTimers();
    busyRef.current = false;
    setAnalysisState('idle');
    setReportSnapshot(null);
    setStatusLine('');
  }, [clearTimers]);

  const runAnalysis = useCallback(() => {
    if (!canAnalyze || !liveSnapshot || busyRef.current) return;

    busyRef.current = true;
    clearTimers();
    setReportSnapshot(liveSnapshot);
    setReportSessionId((n) => n + 1);
    setAnalysisState('analyzing');

    // Stage 1 — CTA tap: light impact (`ack` = project light preset).
    void hapticService.trigger('ack');

    const lines = readRitualLines(t);
    let lineIndex = 0;
    setStatusLine(lines[0] ?? scanningLabel);

    const reduceMotion = prefersReducedMotion();
    const duration = reduceMotion ? SOMATOTYPE_ANALYSIS_REDUCED_MS : SOMATOTYPE_ANALYSIS_MS;

    if (lines.length > 1 && !reduceMotion) {
      const tickId = window.setInterval(() => {
        lineIndex = (lineIndex + 1) % lines.length;
        setStatusLine(lines[lineIndex] ?? scanningLabel);
      }, STATUS_TICK_MS);
      intervalIdsRef.current.push(tickId);
    }

    // Stage 2 — scan pulses: selection ×4 across the 2s veil (t=0 sync, then 500/1000/1500).
    // WHY: Avoid setTimeout(0) so the first instrument tick is deterministic with the CTA ack.
    // hapticService itself no-ops on reduced-motion / missing vibrate — safe on web.
    if (!reduceMotion) {
      void hapticService.trigger('selection');
      for (let i = 1; i < SOMATOTYPE_SCAN_HAPTIC_COUNT; i += 1) {
        const pulseId = window.setTimeout(() => {
          void hapticService.trigger('selection');
        }, i * SOMATOTYPE_SCAN_HAPTIC_INTERVAL_MS);
        timeoutIdsRef.current.push(pulseId);
      }
    }

    const doneId = window.setTimeout(() => {
      clearTimers();
      // Stage 3 — report modal open: success notification burst.
      void hapticService.trigger('success');
      setStatusLine('');
      setAnalysisState('completed');
      busyRef.current = false;
    }, duration);
    timeoutIdsRef.current.push(doneId);
  }, [canAnalyze, clearTimers, liveSnapshot, scanningLabel, t]);

  return {
    analysisState,
    reportSnapshot,
    reportSessionId,
    statusLine,
    scanningLabel,
    overlayAriaLabel,
    isAnalyzing: analysisState === 'analyzing',
    modalOpen: analysisState === 'completed' && reportSnapshot != null,
    runAnalysis,
    closeReport,
  };
}
