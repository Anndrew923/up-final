import { afterEach, describe, expect, it } from 'vitest';
import {
  AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY,
  readAestheticTelemetryAspectSession,
  writeAestheticTelemetryAspectSession,
} from '../aestheticTelemetryAspectSession';

describe('aestheticTelemetryAspectSession', () => {
  afterEach(() => {
    sessionStorage.removeItem(AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY);
  });

  it('defaults to 9:16 when empty', () => {
    expect(readAestheticTelemetryAspectSession()).toBe('9:16');
  });

  it('round-trips 4:5 so Share-sheet remounts keep the feed aspect', () => {
    writeAestheticTelemetryAspectSession('4:5');
    expect(sessionStorage.getItem(AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY)).toBe('4:5');
    expect(readAestheticTelemetryAspectSession()).toBe('4:5');
  });

  it('rejects unknown values', () => {
    sessionStorage.setItem(AESTHETIC_TELEMETRY_ASPECT_SESSION_KEY, '16:9');
    expect(readAestheticTelemetryAspectSession()).toBe('9:16');
  });
});
