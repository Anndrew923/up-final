import { describe, expect, it } from 'vitest';
import { SOUND_PIPELINE_TACTICALLY_SILENCED, canPlaySound } from '../soundGate';

describe('canPlaySound', () => {
  it('pipeline flag is tactically silenced', () => {
    expect(SOUND_PIPELINE_TACTICALLY_SILENCED).toBe(true);
  });

  it('rigidly blocks when reduced motion is on', () => {
    expect(canPlaySound(true, true)).toBe(false);
  });

  it('rigidly blocks when user disabled sound', () => {
    expect(canPlaySound(false, false)).toBe(false);
  });

  it('rigidly blocks even when both gates would pass', () => {
    expect(canPlaySound(false, true)).toBe(false);
  });
});
