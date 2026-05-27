import { useCallback } from 'react';
import { hapticService, type HapticPreset } from '../services/hapticService';

export function useDopamineFeedback() {
  const triggerHaptic = useCallback((preset: HapticPreset) => {
    void hapticService.trigger(preset);
  }, []);

  const triggerImpact = useCallback((strength: 'light' | 'medium' | 'heavy' = 'medium') => {
    const preset: HapticPreset =
      strength === 'light' ? 'ack' : strength === 'heavy' ? 'climax' : 'milestone';
    void hapticService.trigger(preset);
  }, []);

  const triggerLight = useCallback(() => {
    void hapticService.trigger('ack');
  }, []);

  const triggerMedium = useCallback(() => {
    void hapticService.trigger('milestone');
  }, []);

  const triggerHeavy = useCallback(() => {
    void hapticService.trigger('climax');
  }, []);

  const triggerRankUpCombo = useCallback(() => {
    void hapticService.triggerRankUpCombo();
  }, []);

  return {
    triggerHaptic,
    triggerImpact,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerRankUpCombo,
  };
}
