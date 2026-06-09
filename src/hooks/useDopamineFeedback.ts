import { useCallback } from 'react';
import { hapticService, type HapticPreset } from '../services/hapticService';
import { soundService } from '../services/soundService';

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

  const triggerPdkShift = useCallback(() => {
    soundService.play('pdk_shift');
    void hapticService.trigger('ack');
  }, []);

  const triggerChargeRitual = useCallback((durationMs: number) => {
    soundService.stop('boot_hum');
    soundService.playLoop('charge_up');
    hapticService.triggerContinuousSoft(durationMs);
  }, []);

  const stopChargeRitual = useCallback(() => {
    soundService.stopChargeRitual();
    hapticService.stopContinuousSoft();
  }, []);

  const triggerBreakthroughCelebration = useCallback(() => {
    soundService.play('breakthrough');
    void hapticService.triggerSuccessBurst();
  }, []);

  const triggerBootHum = useCallback(() => {
    soundService.playLoop('boot_hum');
  }, []);

  const stopBootHum = useCallback(() => {
    soundService.stop('boot_hum');
  }, []);

  return {
    triggerHaptic,
    triggerImpact,
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerRankUpCombo,
    triggerPdkShift,
    triggerChargeRitual,
    stopChargeRitual,
    triggerBreakthroughCelebration,
    triggerBootHum,
    stopBootHum,
  };
}
