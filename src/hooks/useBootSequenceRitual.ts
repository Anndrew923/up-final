import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ONBOARDING_ASSESS_TARGET_ID,
  ONBOARDING_RADAR_TARGET_ID,
} from '../constants/onboardingTargets';
import { useUiInteractionStore } from '../stores/uiInteractionStore';
import { useDopamineFeedback } from './useDopamineFeedback';
import { useTypewriterText } from './useTypewriterText';

export type BootSequencePhase = 1 | 2 | 3;

const PHASE_BODY_KEYS: Record<BootSequencePhase, string> = {
  1: 'onboarding.phase1.body',
  2: 'onboarding.phase2.body',
  3: 'onboarding.phase3.body',
};

const PHASE_TARGET_IDS: Partial<Record<BootSequencePhase, string>> = {
  2: ONBOARDING_RADAR_TARGET_ID,
  3: ONBOARDING_ASSESS_TARGET_ID,
};

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PAD = 10;
const MEASURE_MAX_FRAMES = 48;

function measureTargetRect(targetId: string): SpotlightRect | null {
  const el = document.getElementById(targetId);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    top: rect.top - SPOTLIGHT_PAD,
    left: rect.left - SPOTLIGHT_PAD,
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };
}

function waitForTargetRect(
  targetId: string,
  isActive: () => boolean,
): Promise<SpotlightRect | null> {
  return new Promise((resolve) => {
    let frames = 0;
    const tick = () => {
      if (!isActive()) {
        resolve(null);
        return;
      }
      const rect = measureTargetRect(targetId);
      if (rect) {
        resolve(rect);
        return;
      }
      frames += 1;
      if (frames >= MEASURE_MAX_FRAMES) {
        resolve(null);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export interface UseBootSequenceRitualInput {
  active: boolean;
  onComplete: () => void;
}

export interface UseBootSequenceRitualResult {
  phase: BootSequencePhase;
  spotlightRect: SpotlightRect | null;
  visibleText: string;
  typewriterDone: boolean;
  showIgnite: boolean;
  advancePhase: () => void;
  ignite: () => void;
}

export function useBootSequenceRitual({
  active,
  onComplete,
}: UseBootSequenceRitualInput): UseBootSequenceRitualResult {
  const { t } = useTranslation('common');
  const { triggerImpact } = useDopamineFeedback();
  const { visibleText, play, reset, cancel } = useTypewriterText();
  const [phase, setPhase] = useState<BootSequencePhase>(1);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const runIdRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const setBootPhase = useUiInteractionStore((s) => s.setBootSequencePhase);

  const playPhaseText = useCallback(
    async (nextPhase: BootSequencePhase, runId: number) => {
      const isActive = () => runId === runIdRef.current && activeRef.current;
      if (!isActive()) return;

      setTypewriterDone(false);
      reset();
      const body = t(PHASE_BODY_KEYS[nextPhase]);
      await play(body);
      if (!isActive()) return;
      setTypewriterDone(true);
    },
    [play, reset, t],
  );

  const syncSpotlight = useCallback(async (nextPhase: BootSequencePhase, runId: number) => {
    const isActive = () => runId === runIdRef.current && activeRef.current;
    const targetId = PHASE_TARGET_IDS[nextPhase];
    if (!targetId) {
      setSpotlightRect(null);
      return;
    }
    const rect = await waitForTargetRect(targetId, isActive);
    if (!isActive()) return;
    setSpotlightRect(rect);
  }, []);

  const startPhase = useCallback(
    async (nextPhase: BootSequencePhase) => {
      const runId = ++runIdRef.current;
      const isActive = () => runId === runIdRef.current && activeRef.current;

      if (nextPhase > 1) {
        triggerImpact('medium');
      }

      setPhase(nextPhase);
      setBootPhase(nextPhase);
      await syncSpotlight(nextPhase, runId);
      if (!isActive()) return;
      await playPhaseText(nextPhase, runId);
    },
    [playPhaseText, setBootPhase, syncSpotlight, triggerImpact],
  );

  const startPhaseRef = useRef(startPhase);
  startPhaseRef.current = startPhase;

  useEffect(() => {
    if (!active) {
      runIdRef.current += 1;
      cancel();
      setPhase(1);
      setSpotlightRect(null);
      setTypewriterDone(false);
      setBootPhase(0);
      return;
    }

    setBootPhase(1);
    void startPhaseRef.current(1);

    return () => {
      runIdRef.current += 1;
      cancel();
      setBootPhase(0);
    };
  }, [active, cancel, setBootPhase]);

  useEffect(() => {
    if (!active) return;

    const remeasure = () => {
      const targetId = PHASE_TARGET_IDS[phase];
      if (!targetId) return;
      const rect = measureTargetRect(targetId);
      if (rect) setSpotlightRect(rect);
    };

    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    return () => {
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [active, phase]);

  const advancePhase = useCallback(() => {
    if (!typewriterDone || phase >= 3) return;
    void startPhaseRef.current((phase + 1) as BootSequencePhase);
  }, [phase, typewriterDone]);

  const ignite = useCallback(() => {
    if (phase !== 3 || !typewriterDone) return;
    triggerImpact('heavy');
    onComplete();
  }, [onComplete, phase, triggerImpact, typewriterDone]);

  return {
    phase,
    spotlightRect,
    visibleText,
    typewriterDone,
    showIgnite: phase === 3 && typewriterDone,
    advancePhase,
    ignite,
  };
}
