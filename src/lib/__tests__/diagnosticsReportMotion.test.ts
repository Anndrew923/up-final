import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTICS_REPORT_CTA_SAFE_BOTTOM_CLASS,
  DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS,
  diagnosticsPanelVisible,
  diagnosticsStaggerVisible,
  diagnosticsWillChange,
} from '../diagnosticsReportMotion';

describe('diagnosticsReportMotion', () => {
  it('locks scroll cushion and floating CTA safe-area tokens', () => {
    expect(DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS).toBe('pb-20');
    expect(DIAGNOSTICS_REPORT_CTA_SAFE_BOTTOM_CLASS).toBe(
      'pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]'
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
