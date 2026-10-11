import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONSOLE_AXIS_VIEW_MODE,
  formatConsoleAxisHudValue,
  isConsoleAxisViewMode,
  parseConsoleAxisViewMode,
} from '../consoleAxisViewMode';

describe('consoleAxisViewMode', () => {
  it('defaults unknown / empty values to fitness', () => {
    expect(parseConsoleAxisViewMode(null)).toBe(DEFAULT_CONSOLE_AXIS_VIEW_MODE);
    expect(parseConsoleAxisViewMode(undefined)).toBe('fitness');
    expect(parseConsoleAxisViewMode('')).toBe('fitness');
    expect(parseConsoleAxisViewMode('bogus')).toBe('fitness');
  });

  it('accepts telemetry', () => {
    expect(parseConsoleAxisViewMode('telemetry')).toBe('telemetry');
    expect(isConsoleAxisViewMode('telemetry')).toBe(true);
    expect(isConsoleAxisViewMode('fitness')).toBe(true);
    expect(isConsoleAxisViewMode('other')).toBe(false);
  });

  it('formats HUD values as forced 2dp', () => {
    expect(formatConsoleAxisHudValue(71.4)).toBe('71.40');
    expect(formatConsoleAxisHudValue(71)).toBe('71.00');
    expect(formatConsoleAxisHudValue(81.57)).toBe('81.57');
    expect(formatConsoleAxisHudValue(Number.NaN)).toBe('0.00');
  });
});
