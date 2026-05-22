import { describe, expect, it } from 'vitest';
import {
  diagnosticsPanelVisible,
  diagnosticsStaggerVisible,
  diagnosticsWillChange,
} from '../diagnosticsReportMotion';

describe('diagnosticsReportMotion', () => {
  it('returns hidden panel classes before entrance', () => {
    expect(diagnosticsPanelVisible(false)).toContain('opacity-0');
    expect(diagnosticsPanelVisible(true)).toContain('opacity-100');
  });

  it('applies axis-specific stagger offsets', () => {
    expect(diagnosticsStaggerVisible(false, 'x')).toContain('-translate-x-3');
    expect(diagnosticsStaggerVisible(false, 'y')).toContain('translate-y-2.5');
  });

  it('drops will-change when motion is idle', () => {
    expect(diagnosticsWillChange(true)).toContain('will-change');
    expect(diagnosticsWillChange(false)).toBe('');
  });
});
