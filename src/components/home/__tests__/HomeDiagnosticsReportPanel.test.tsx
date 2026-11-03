/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import {
  DIAGNOSTICS_REPORT_CTA_SAFE_BOTTOM_CLASS,
  DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS,
} from '../../../lib/diagnosticsReportMotion';
import type { HomeResonanceSnapshot } from '../../../types/homeResonance';
import { SIX_AXIS_METRICS } from '../../../types/scoring';
import HomeDiagnosticsReportPanel from '../HomeDiagnosticsReportPanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../hooks/useDiagnosticsReportEntrance', () => ({
  useDiagnosticsReportEntrance: () => ({ entered: true, motionActive: false }),
}));

vi.mock('../../radar/HexRadarChart', () => ({
  default: ({ 'aria-label': ariaLabel }: { 'aria-label'?: string }) => (
    <div data-testid="hex-radar-chart" aria-label={ariaLabel} />
  ),
}));

const snapshot: HomeResonanceSnapshot = {
  overallScore: 99.6,
  radarPoints: SIX_AXIS_METRICS.map((key) => ({ key, label: key, value: 95 })),
  gradeBandId: 'TIER_90',
  gradeLine: 'grade line',
  archetypeTitle: 'Flat-6 Prototype',
  archetypeSummary: 'Track homologation summary.',
};

describe('HomeDiagnosticsReportPanel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('locks bento readout, floats mechanical CTA outside the scroll stream', () => {
    const onClose = vi.fn();

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <HomeDiagnosticsReportPanel snapshot={snapshot} scaleMax={120} onClose={onClose} />
        </I18nextProvider>
      );
    });

    expect(document.querySelector('[data-testid="home-diagnostics-report-panel"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="hex-radar-chart"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="diagnostics-report-hero"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="diagnostics-report-index"]')?.textContent).toContain(
      '99.60'
    );
    expect(document.querySelector('[data-testid="homologation-id"]')?.textContent).toBe(
      '規格診斷報告 // #GT-9960'
    );
    expect(document.body.textContent).not.toContain('INDEX // PTS');
    expect(document.body.textContent).not.toContain('全域性能規格報告');
    expect(document.querySelector('[data-testid="identity-live-spec-bento"]')).not.toBeNull();

    for (const metric of SIX_AXIS_METRICS) {
      expect(
        document.querySelector(`[data-testid="identity-live-spec-cell-${metric}"]`)
      ).not.toBeNull();
    }

    const scroll = document.querySelector(
      '[data-testid="diagnostics-report-scroll"]'
    ) as HTMLElement | null;
    expect(scroll).not.toBeNull();
    expect(scroll?.className).toContain(DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS);
    expect(DIAGNOSTICS_REPORT_SCROLL_PAD_CLASS).toBe('pb-20');
    expect(scroll?.className).toContain('overflow-y-auto');

    const ctaWrap = document.querySelector(
      '[data-testid="diagnostics-report-cta-wrap"]'
    ) as HTMLElement | null;
    expect(ctaWrap).not.toBeNull();
    expect(ctaWrap?.className).toContain('shrink-0');
    expect(ctaWrap?.className).toContain('bg-gradient-to-t');
    expect(ctaWrap?.className).toContain(DIAGNOSTICS_REPORT_CTA_SAFE_BOTTOM_CLASS);

    const confirm = document.querySelector(
      '[data-testid="diagnostics-report-confirm"]'
    ) as HTMLButtonElement | null;
    expect(confirm).not.toBeNull();
    expect(confirm?.className).toContain('[clip-path:polygon(');
    expect(confirm?.className).toContain('inset_0_1px_1px_rgba(255,255,255,0.15)');
    expect(confirm?.className).toContain('text-[12px]');
    expect(confirm?.className).toContain('tracking-wider');
    expect(confirm?.className).not.toContain('truncate');
    expect(confirm?.innerHTML).toContain('whitespace-nowrap');
    expect(confirm?.textContent).toContain('確認校準並返回');
    expect(confirm?.textContent).toContain('READY');
    expect(confirm?.textContent).not.toContain('◆');
    // Floating cockpit CTA is outside the scroll stream.
    expect(scroll?.contains(confirm)).toBe(false);
    expect(ctaWrap?.contains(confirm)).toBe(true);

    act(() => {
      confirm?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
