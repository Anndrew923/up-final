import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../config/routes';
import {
  clearPendingRadarResonance,
  hasPendingRadarResonance,
} from '../radarResonanceSession';

const trigger = vi.fn().mockResolvedValue(undefined);

vi.mock('../hapticService', () => ({
  hapticService: { trigger },
}));

describe('navigateHomeWithResonance', () => {
  beforeEach(() => {
    trigger.mockClear();
    clearPendingRadarResonance();
  });

  it('marks pending, fires a milestone haptic, then navigates home', async () => {
    const { navigateHomeWithResonance } = await import('../radarResonanceNavigation');
    const navigate = vi.fn();

    navigateHomeWithResonance(navigate);

    expect(hasPendingRadarResonance()).toBe(true);
    expect(trigger).toHaveBeenCalledWith('milestone');
    expect(navigate).toHaveBeenCalledWith(ROUTES.home);
    expect(trigger.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0]
    );
  });
});
