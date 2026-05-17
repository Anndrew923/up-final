import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDopamineFeedback } from './useDopamineFeedback';

export const CEREMONY_MS_MIN = 1200;
export const CEREMONY_MS_MAX = 1500;
export const MESSAGE_TICK_MS = 380;
const HAPTIC_LIGHT_MS = 0;
const HAPTIC_MEDIUM_MS = 450;
const HAPTIC_HEAVY_MS = 1100;
const REDUCED_MOTION_MS = 400;

export type CeremonyPool =
  | 'strength'
  | 'grip'
  | 'cardio'
  | 'muscle'
  | 'ffmi'
  | 'explosive'
  | 'armSize';

export type CeremonyHapticProfile = 'scan-only' | 'full';

export interface UseAssessmentCeremonyOptions {
  pool: CeremonyPool;
  /** scan-only: light at 0ms only — reveal flow owns medium/heavy. */
  hapticProfile?: CeremonyHapticProfile;
}

export interface UseAssessmentCeremonyResult {
  isActive: boolean;
  statusLine: string;
  scanningLabel: string;
  overlayAriaLabel: string;
  wrapCalculate: (run: () => void) => Promise<void>;
  cancel: () => void;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pickNextMessage(pool: string[], exclude: string | null): string {
  if (pool.length === 0) return '';
  if (pool.length === 1) return pool[0]!;
  const candidates = exclude ? pool.filter((message) => message !== exclude) : pool;
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)]!;
}

function readMessagePool(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const record = raw as Record<string, unknown>;
  return Object.keys(record)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => record[key])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

/**
 * Orchestrates pre-calculate diagnostic ceremony: timed copy rotation + haptics, then runs compute.
 * Design intent: keep assessment page hooks pure — ceremony is UX-only and lives at page layer.
 */
export function useAssessmentCeremony({
  pool,
  hapticProfile = 'scan-only',
}: UseAssessmentCeremonyOptions): UseAssessmentCeremonyResult {
  const { t } = useTranslation('common');
  const { triggerImpact } = useDopamineFeedback();
  const [isActive, setIsActive] = useState(false);
  const [statusLine, setStatusLine] = useState('');

  const activeRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const intervalIdsRef = useRef<number[]>([]);
  const settleRef = useRef<(() => void) | null>(null);

  const scanningLabel = t('assessment.ceremony.scanning');
  const overlayAriaLabel = t('assessment.ceremony.overlayAria');

  const getMessagePool = useCallback((): string[] => {
    const raw = t(`assessment.ceremony.messages.${pool}`, { returnObjects: true });
    return readMessagePool(raw);
  }, [pool, t]);

  const clearTimers = useCallback(() => {
    for (const id of timeoutIdsRef.current) {
      window.clearTimeout(id);
    }
    for (const id of intervalIdsRef.current) {
      window.clearInterval(id);
    }
    timeoutIdsRef.current = [];
    intervalIdsRef.current = [];
  }, []);

  const resetCeremonyUi = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    setStatusLine('');
  }, []);

  const settleCeremony = useCallback(() => {
    resetCeremonyUi();
    const settle = settleRef.current;
    settleRef.current = null;
    settle?.();
  }, [resetCeremonyUi]);

  const cancel = useCallback(() => {
    clearTimers();
    settleCeremony();
  }, [clearTimers, settleCeremony]);

  useEffect(() => () => cancel(), [cancel]);

  const scheduleTimeout = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
  }, []);

  const wrapCalculate = useCallback(
    (run: () => void): Promise<void> => {
      if (activeRef.current) return Promise.resolve();

      const reducedMotion = prefersReducedMotion();
      const durationMs = reducedMotion
        ? REDUCED_MOTION_MS
        : randomInt(CEREMONY_MS_MIN, CEREMONY_MS_MAX);
      const messages = getMessagePool();
      const initialMessage = pickNextMessage(messages, null) || scanningLabel;

      activeRef.current = true;
      setIsActive(true);
      setStatusLine(initialMessage);

      return new Promise<void>((resolve, reject) => {
        settleRef.current = resolve;

        scheduleTimeout(HAPTIC_LIGHT_MS, () => {
          if (!activeRef.current) return;
          triggerImpact('light');
        });

        if (!reducedMotion && hapticProfile === 'full') {
          scheduleTimeout(HAPTIC_MEDIUM_MS, () => {
            if (!activeRef.current) return;
            triggerImpact('medium');
          });
          scheduleTimeout(HAPTIC_HEAVY_MS, () => {
            if (!activeRef.current) return;
            triggerImpact('heavy');
          });
        }

        let lastMessage = initialMessage;
        if (!reducedMotion && messages.length > 1) {
          const intervalId = window.setInterval(() => {
            if (!activeRef.current) return;
            const next = pickNextMessage(messages, lastMessage);
            lastMessage = next;
            setStatusLine(next);
          }, MESSAGE_TICK_MS);
          intervalIdsRef.current.push(intervalId);
        }

        scheduleTimeout(durationMs, () => {
          clearTimers();
          if (!activeRef.current) return;
          try {
            run();
          } catch (error) {
            resetCeremonyUi();
            settleRef.current = null;
            reject(error);
            return;
          }
          settleCeremony();
        });
      });
    },
    [
      clearTimers,
      getMessagePool,
      hapticProfile,
      resetCeremonyUi,
      scanningLabel,
      scheduleTimeout,
      settleCeremony,
      triggerImpact,
    ]
  );

  return {
    isActive,
    statusLine,
    scanningLabel,
    overlayAriaLabel,
    wrapCalculate,
    cancel,
  };
}
