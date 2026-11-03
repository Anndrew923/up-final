import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTICS_REPORT_SAFE_BOTTOM_CLASS,
  diagnosticsPanelVisible,
  diagnosticsStaggerVisible,
  diagnosticsWillChange,
} from '../diagnosticsReportMotion';

describe('diagnosticsReportMotion', () => {
  it('locks Home Indicator clearance token for report CTA scroll pad', () => {
    expect(DIAGNOSTICS_REPORT_SAFE_BOTTOM_CLASS).toBe(
      'pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]'
    );
  });

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
