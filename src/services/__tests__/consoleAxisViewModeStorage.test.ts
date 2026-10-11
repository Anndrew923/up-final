/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY,
  loadConsoleAxisViewMode,
  saveConsoleAxisViewMode,
} from '../localStorageService';

const memory = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
});

describe('consoleAxisViewMode storage', () => {
  beforeEach(() => {
    memory.clear();
  });

  afterEach(() => {
    memory.clear();
  });

  it('defaults to fitness when unset or invalid', () => {
    expect(loadConsoleAxisViewMode()).toBe('fitness');
    memory.set(CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY, 'bogus');
    expect(loadConsoleAxisViewMode()).toBe('fitness');
  });

  it('persists telemetry and reloads it', () => {
    saveConsoleAxisViewMode('telemetry');
    expect(memory.get(CONSOLE_AXIS_VIEW_MODE_STORAGE_KEY)).toBe('telemetry');
    expect(loadConsoleAxisViewMode()).toBe('telemetry');
  });
});
