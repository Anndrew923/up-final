/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { DIAGNOSTICS_REPORT_SAFE_BOTTOM_CLASS } from '../../../lib/diagnosticsReportMotion';
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

  it('renders mini radar hero, homologation id, bento grid, and chamfered confirm CTA', () => {
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
    expect(document.querySelector('[data-testid="homologation-id"]')?.textContent).toContain(
      '#GT-9960'
    );
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
    expect(scroll?.className).toContain(DIAGNOSTICS_REPORT_SAFE_BOTTOM_CLASS);
    expect(scroll?.className).toContain('overflow-y-auto');
    expect(DIAGNOSTICS_REPORT_SAFE_BOTTOM_CLASS).toBe(
      'pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]'
    );

    const confirm = document.querySelector(
      '[data-testid="diagnostics-report-confirm"]'
    ) as HTMLButtonElement | null;
    expect(confirm).not.toBeNull();
    expect(confirm?.className).toContain('[clip-path:polygon(');
    expect(confirm?.textContent).toContain('CONFIRM & RETURN');
    // CTA lives inside the single scroll stream — not clipped by a sibling sticky footer region.
    expect(scroll?.contains(confirm)).toBe(true);
    expect(
      document.querySelector('[data-testid="diagnostics-report-cta-wrap"]')?.contains(confirm)
    ).toBe(true);

    const panel = document.querySelector(
      '[data-testid="home-diagnostics-report-panel"]'
    ) as HTMLElement | null;
    expect(panel?.className).toContain('overflow-hidden');
    expect(panel?.className).toContain('max-h-[min(calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2.5rem),720px)]');

    act(() => {
      confirm?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
