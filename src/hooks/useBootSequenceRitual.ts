import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ONBOARDING_ASSESS_TARGET_ID,
  ONBOARDING_RADAR_TARGET_ID,
} from '../constants/onboardingTargets';
import { isPhysicalProfileComplete } from '../logic/core/physicalProfile';
import {
  BOOT_SEQUENCE_STEPS,
  getBootStorePhase,
  getNarrativePhase,
  isProfileInputStep,
  type BootSequenceStep,
} from '../types/bootSequence';
import {
  LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT,
  loadPhysicalProfile,
} from '../services/localStorageService';
import { useUiInteractionStore } from '../stores/uiInteractionStore';
import { useDopamineFeedback } from './useDopamineFeedback';
import { useTypewriterText } from './useTypewriterText';

const PHASE_BODY_KEYS: Record<1 | 2 | 3, string> = {
  1: 'onboarding.phase1.body',
  2: 'onboarding.phase2.body',
  3: 'onboarding.phase3.body',
};

const PROFILE_INPUT_BODY_KEY = 'onboarding.profileInput.body';

const SPOTLIGHT_TARGET_BY_STEP: Partial<Record<BootSequenceStep, string>> = {
  phase2: ONBOARDING_RADAR_TARGET_ID,
  phase3: ONBOARDING_ASSESS_TARGET_ID,
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
  isActive: () => boolean
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

function stepBodyKey(step: BootSequenceStep): string {
  if (isProfileInputStep(step)) return PROFILE_INPUT_BODY_KEY;
  const phase = getNarrativePhase(step);
  return phase ? PHASE_BODY_KEYS[phase] : PROFILE_INPUT_BODY_KEY;
}

export interface UseBootSequenceRitualInput {
  active: boolean;
  onComplete: () => void;
}

export interface UseBootSequenceRitualResult {
  step: BootSequenceStep;
  variant: 'narrative' | 'profile_input';
  narrativePhase: 1 | 2 | 3 | null;
  spotlightRect: SpotlightRect | null;
  visibleText: string;
  typewriterDone: boolean;
  profileReady: boolean;
  /** True only after user saves baseline body specs during this boot run. */
  profileCommittedInBoot: boolean;
  canContinue: boolean;
  showIgnite: boolean;
  advancePhase: () => void;
  ignite: () => void;
  onProfileSaved: () => void;
}

export function useBootSequenceRitual({
  active,
  onComplete,
}: UseBootSequenceRitualInput): UseBootSequenceRitualResult {
  const { t } = useTranslation('common');
  const { triggerImpact } = useDopamineFeedback();
  const { visibleText, play, reset, cancel } = useTypewriterText();
  const [step, setStep] = useState<BootSequenceStep>('phase1');
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [profileReady, setProfileReady] = useState(() =>
    isPhysicalProfileComplete(loadPhysicalProfile())
  );
  const [profileCommittedInBoot, setProfileCommittedInBoot] = useState(false);
  const runIdRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const setBootStep = useUiInteractionStore((s) => s.setBootSequenceStep);

  const syncProfileReady = useCallback(() => {
    setProfileReady(isPhysicalProfileComplete(loadPhysicalProfile()));
  }, []);

  useEffect(() => {
    syncProfileReady();
    window.addEventListener(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT, syncProfileReady);
    return () => window.removeEventListener(LOCAL_PHYSICAL_PROFILE_CHANGED_EVENT, syncProfileReady);
  }, [syncProfileReady]);

  const publishStoreStep = useCallback(
    (nextStep: BootSequenceStep) => {
      if (isProfileInputStep(nextStep)) {
        setBootStep({ phase: 1, variant: 'profile_input' });
        return;
      }
      setBootStep({ phase: getBootStorePhase(nextStep), variant: 'narrative' });
    },
    [setBootStep]
  );

  const playStepText = useCallback(
    async (nextStep: BootSequenceStep, runId: number) => {
      const isActive = () => runId === runIdRef.current && activeRef.current;
      if (!isActive()) return;

      setTypewriterDone(false);
      reset();
      const body = t(stepBodyKey(nextStep));
      await play(body);
      if (!isActive()) return;
      setTypewriterDone(true);
    },
    [play, reset, t]
  );

  const syncSpotlight = useCallback(async (nextStep: BootSequenceStep, runId: number) => {
    const isActive = () => runId === runIdRef.current && activeRef.current;
    const targetId = SPOTLIGHT_TARGET_BY_STEP[nextStep];
    if (!targetId) {
      setSpotlightRect(null);
      return;
    }
    const rect = await waitForTargetRect(targetId, isActive);
    if (!isActive()) return;
    setSpotlightRect(rect);
  }, []);

  const startStep = useCallback(
    async (nextStep: BootSequenceStep) => {
      const runId = ++runIdRef.current;
      const isActive = () => runId === runIdRef.current && activeRef.current;
      const stepIndex = BOOT_SEQUENCE_STEPS.indexOf(nextStep);

      if (stepIndex > 0) {
        triggerImpact('medium');
      }

      setStep(nextStep);
      if (isProfileInputStep(nextStep)) {
        setProfileCommittedInBoot(false);
      }
      publishStoreStep(nextStep);
      await syncSpotlight(nextStep, runId);
      if (!isActive()) return;
      await playStepText(nextStep, runId);
    },
    [playStepText, publishStoreStep, syncSpotlight, triggerImpact]
  );

  const startStepRef = useRef(startStep);
  startStepRef.current = startStep;

  useEffect(() => {
    if (!active) {
      runIdRef.current += 1;
      cancel();
      setStep('phase1');
      setSpotlightRect(null);
      setTypewriterDone(false);
      setProfileCommittedInBoot(false);
      setBootStep({ phase: 0, variant: 'none' });
      return;
    }

    setBootStep({ phase: 1, variant: 'narrative' });
    void startStepRef.current('phase1');

    return () => {
      runIdRef.current += 1;
      cancel();
      setBootStep({ phase: 0, variant: 'none' });
    };
  }, [active, cancel, setBootStep]);

  useEffect(() => {
    if (!active) return;

    const remeasure = () => {
      const targetId = SPOTLIGHT_TARGET_BY_STEP[step];
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
  }, [active, step]);

  const variant = isProfileInputStep(step) ? 'profile_input' : 'narrative';
  const narrativePhase = getNarrativePhase(step);
  const isLastStep = step === 'phase3';

  const canContinue = isProfileInputStep(step)
    ? typewriterDone && profileReady && profileCommittedInBoot
    : typewriterDone && !isLastStep;

  const advancePhase = useCallback(() => {
    const index = BOOT_SEQUENCE_STEPS.indexOf(step);
    const next = BOOT_SEQUENCE_STEPS[index + 1];
    if (!next) return;
    if (isProfileInputStep(step)) {
      if (!typewriterDone || !profileReady || !profileCommittedInBoot) return;
    } else if (!typewriterDone) {
      return;
    }
    void startStepRef.current(next);
  }, [profileCommittedInBoot, profileReady, step, typewriterDone]);

  const onProfileSaved = useCallback(() => {
    setProfileCommittedInBoot(true);
    syncProfileReady();
    triggerImpact('light');
  }, [syncProfileReady, triggerImpact]);

  const ignite = useCallback(() => {
    if (step !== 'phase3' || !typewriterDone) return;
    triggerImpact('heavy');
    onComplete();
  }, [onComplete, step, triggerImpact, typewriterDone]);

  return {
    step,
    variant,
    narrativePhase,
    spotlightRect,
    visibleText,
    typewriterDone,
    profileReady,
    profileCommittedInBoot,
    canContinue,
    showIgnite: step === 'phase3' && typewriterDone,
    advancePhase,
    ignite,
    onProfileSaved,
  };
}
