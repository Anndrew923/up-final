import { describe, expect, it } from 'vitest';
import {
  CONSOLE_S_MODE_BORDER_SURGE_MS,
  CONSOLE_S_MODE_CHARGE_SOFT_MS,
  CONSOLE_S_MODE_LEXICON_FADE_MS,
  CONSOLE_S_MODE_RADAR_PULSE_MS,
  CONSOLE_S_MODE_REV_UP_MS,
  CONSOLE_S_MODE_RITUAL_MS,
  CONSOLE_S_MODE_SHEEN_MS,
} from '../consoleSModeRitual';

describe('consoleSModeRitual timings', () => {
  it('keeps ritual window at least as long as the slowest visual beat', () => {
    const longestBeat = Math.max(
      CONSOLE_S_MODE_RADAR_PULSE_MS,
      CONSOLE_S_MODE_SHEEN_MS,
      CONSOLE_S_MODE_REV_UP_MS,
      CONSOLE_S_MODE_BORDER_SURGE_MS,
      CONSOLE_S_MODE_LEXICON_FADE_MS
    );
    expect(CONSOLE_S_MODE_RITUAL_MS).toBeGreaterThanOrEqual(longestBeat);
  });

  it('charges soft before Heavy bite on the assessment-parity window', () => {
    expect(CONSOLE_S_MODE_CHARGE_SOFT_MS).toBe(200);
    expect(CONSOLE_S_MODE_SHEEN_MS).toBe(250);
  });
});
