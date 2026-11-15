/* @vitest-environment jsdom */
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import {
  LAUNCH_FADE_MS,
  LAUNCH_HOLD_MS,
  LAUNCH_NEEDLE_MS,
  TACH_BEZEL_GOLD_CHAMFER_STROKE,
  TACH_BRIDGE_METAL,
  TACH_COLOR_GOLD,
  TACH_CREST_GOLD,
  TACH_CREST_GOLD_HI,
  TACH_CREST_LIT,
  TACH_KNURL_COUNT,
  TACH_METAL_EDGE,
  TACH_METAL_STEEL,
  TACH_REDLINE_PULSE_CLASS,
  TACH_SEGMENT_COUNT,
  progressToNeedleRotateDeg,
  progressToPrimaryGearRotateDeg,
  progressToSecondaryGearRotateDeg,
  progressToTachAngleDeg,
} from '../../logic/core/launchTachometer';
import LaunchQuoteSplash from '../LaunchQuoteSplash';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../lib/motionPreference', () => ({
  prefersReducedMotion: () => false,
}));

const FIXTURE_QUOTE = {
  id: 'hq-test',
  zh: '測試語錄：把槓鈴掰彎。',
  en: 'Test cipher: bend the bar.',
};

describe('LaunchQuoteSplash', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await i18n.changeLanguage('zh-Hant');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function renderSplash(props: Partial<ComponentProps<typeof LaunchQuoteSplash>> = {}) {
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <LaunchQuoteSplash
            ready={props.ready ?? true}
            quoteOverride={FIXTURE_QUOTE}
            {...props}
          />
        </I18nextProvider>
      );
    });
  }

  it('renders CNC dial: clockwise blade, segments, knurl, dual gears, frameless HUD', () => {
    renderSplash({ progressOverride: 0.5, ready: false });

    const splash = container.querySelector('[data-testid="launch-quote-splash"]');
    expect(splash).toBeTruthy();
    expect(splash?.className).toContain('pt-safe');
    expect(splash?.className).toContain('pb-safe');

    const needle = container.querySelector('[data-testid="launch-needle"]');
    expect(needle?.getAttribute('data-progress')).toBe('0.500');
    expect(needle?.getAttribute('data-rotate')).toBe(
      progressToNeedleRotateDeg(0.5).toFixed(2)
    );
    // Clockwise contract: mid progress rotates further than zero.
    expect(progressToNeedleRotateDeg(0.5)).toBeGreaterThan(progressToNeedleRotateDeg(0));
    expect(progressToTachAngleDeg(0.5)).toBe(270);

    const primary = container.querySelector('[data-testid="launch-hud-primary"]');
    expect(primary?.textContent).toBe('050%');
    expect(container.querySelector('[data-testid="launch-hud-secondary"]')?.textContent).toBe(
      'SYS.IGNITION'
    );

    // No legacy boxed readout rect inside the digital window.
    const hud = container.querySelector('[data-testid="launch-digital-window"]');
    expect(hud?.querySelector('rect')).toBeNull();

    const segments = container.querySelectorAll('[data-testid="launch-segment-arc"] path');
    expect(segments.length).toBe(TACH_SEGMENT_COUNT);
    const litCount = Array.from(segments).filter((el) => el.getAttribute('data-lit') === '1')
      .length;
    expect(litCount).toBeGreaterThan(15);
    expect(litCount).toBeLessThan(TACH_SEGMENT_COUNT);

    const primaryGear = container.querySelector('[data-testid="launch-gear-primary"]');
    const secondaryGear = container.querySelector('[data-testid="launch-gear-secondary"]');
    expect(primaryGear?.getAttribute('data-rotate')).toBe(
      progressToPrimaryGearRotateDeg(0.5).toFixed(2)
    );
    expect(secondaryGear?.getAttribute('data-rotate')).toBe(
      progressToSecondaryGearRotateDeg(0.5).toFixed(2)
    );
    expect(Number(secondaryGear?.getAttribute('data-rotate'))).toBeLessThan(0);
    expect(primaryGear?.getAttribute('data-teeth')).toBe('20');
    expect(secondaryGear?.getAttribute('data-teeth')).toBe('12');
    expect(primaryGear?.querySelector('path')?.getAttribute('fill-rule')).toBe('evenodd');
    expect(secondaryGear?.querySelector('path')?.getAttribute('fill-rule')).toBe('evenodd');
    expect(primaryGear?.querySelector('path')?.getAttribute('stroke')).toBe(TACH_METAL_EDGE);

    expect(container.querySelector('[data-testid="launch-movement-plate"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="launch-movement-grooves"]')).toBeTruthy();
    const bridge0 = container.querySelector('[data-testid="launch-bridge-0"]');
    expect(bridge0).toBeTruthy();
    expect(bridge0?.getAttribute('data-metal')).toBe(TACH_BRIDGE_METAL);
    expect(bridge0?.getAttribute('stroke')).toBe(TACH_METAL_STEEL);
    expect(bridge0?.getAttribute('fill')).toBe('url(#launch-bridge-fill)');
    expect(
      container.querySelector('[data-testid="launch-bridge-hi-0"]')?.getAttribute('stroke')
    ).toBe(TACH_METAL_EDGE);
    expect(container.querySelector('[data-testid="launch-jewel-jw-1"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="launch-screw-sc-1"]')).toBeTruthy();

    const crestCup = container.querySelector('[data-testid="launch-crest-cup"]');
    expect(crestCup?.querySelector('circle')?.getAttribute('stroke')).toBe(TACH_CREST_GOLD_HI);
    expect(
      container.querySelector('[data-testid="launch-crest-cup-recess"]')?.getAttribute('stroke')
    ).toBe(TACH_CREST_GOLD);

    expect(container.querySelectorAll('[data-testid="launch-knurl"] line').length).toBe(
      TACH_KNURL_COUNT
    );
    expect(container.querySelector('[data-testid="launch-sapphire-slash"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="launch-ring-shadow"]')).toBeTruthy();
    const quote = container.querySelector('[data-testid="launch-hardcore-quote"]');
    expect(quote?.textContent).toContain('測試語錄');
    expect(quote?.className).toContain('text-balance');
    expect(quote?.className).toContain('max-w-[22rem]');
    expect(quote?.getAttribute('data-chrome-gold')).toBe(TACH_COLOR_GOLD);
    expect(container.querySelector('[data-testid="launch-telemetry-header"]')?.textContent).toContain(
      'ULTIMATE PHYSIQUE // TELEMETRY'
    );
    expect(
      container
        .querySelector('[data-testid="launch-telemetry-header"]')
        ?.getAttribute('data-chrome-gold')
    ).toBe(TACH_COLOR_GOLD);
    expect(
      container.querySelector('[data-testid="launch-crest-slot"]')?.getAttribute('data-crest-lit')
    ).toBe(TACH_CREST_LIT);
    expect(container.querySelector('[data-testid="launch-redline-arc"]')?.getAttribute('data-pulse')).toBe(
      '0'
    );
    expect(container.querySelector('[data-testid="launch-bezel-outer"]')).toBeTruthy();
    const goldChamfer = container.querySelector('[data-testid="launch-bezel-gold-chamfer"]');
    expect(goldChamfer?.getAttribute('stroke')).toBe(TACH_COLOR_GOLD);
    expect(goldChamfer?.getAttribute('stroke-width')).toBe(String(TACH_BEZEL_GOLD_CHAMFER_STROKE));
    expect(container.querySelector('[data-testid="launch-quote-zone"]')).toBeTruthy();
  });

  it('lights REDLINE // READY at full progress', () => {
    renderSplash({ progressOverride: 1, ready: false });
    const hudPrimary = container.querySelector('[data-testid="launch-hud-primary"]');
    expect(hudPrimary?.textContent).toBe('REDLINE // READY');
    expect(hudPrimary?.getAttribute('data-pulse')).toBe('1');
    expect(String(hudPrimary?.getAttribute('class') ?? '')).toContain(TACH_REDLINE_PULSE_CLASS);
    expect(container.querySelector('[data-testid="launch-hud-secondary"]')).toBeNull();
    const redlineArc = container.querySelector('[data-testid="launch-redline-arc"]');
    expect(redlineArc?.getAttribute('data-pulse')).toBe('1');
    expect(String(redlineArc?.getAttribute('class') ?? '')).toContain(TACH_REDLINE_PULSE_CLASS);

    const segments = container.querySelectorAll('[data-testid="launch-segment-arc"] path');
    expect(
      Array.from(segments).every((el) => el.getAttribute('data-lit') === '1')
    ).toBe(true);
  });

  it('auto-fades after 1.5s when ready', () => {
    const onDismissed = vi.fn();
    renderSplash({ progressOverride: 1, ready: true, onDismissed });

    act(() => {
      vi.advanceTimersByTime(LAUNCH_HOLD_MS - 1);
    });
    expect(container.querySelector('[data-testid="launch-quote-splash"]')).toBeTruthy();
    expect(onDismissed).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    const splash = container.querySelector('[data-testid="launch-quote-splash"]');
    expect(splash?.className).toContain('opacity-0');

    act(() => {
      vi.advanceTimersByTime(LAUNCH_FADE_MS);
    });
    expect(container.querySelector('[data-testid="launch-quote-splash"]')).toBeNull();
    expect(onDismissed).toHaveBeenCalledTimes(1);
  });

  it('waits for ready even after the 1.5s reading window', () => {
    const onDismissed = vi.fn();
    renderSplash({ progressOverride: 1, ready: false, onDismissed });

    act(() => {
      vi.advanceTimersByTime(LAUNCH_HOLD_MS + 500);
    });
    expect(onDismissed).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="launch-quote-splash"]')).toBeTruthy();

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <LaunchQuoteSplash
            ready
            progressOverride={1}
            quoteOverride={FIXTURE_QUOTE}
            onDismissed={onDismissed}
          />
        </I18nextProvider>
      );
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(
      container.querySelector('[data-testid="launch-quote-splash"]')?.className
    ).toContain('opacity-0');

    act(() => {
      vi.advanceTimersByTime(LAUNCH_FADE_MS);
    });
    expect(onDismissed).toHaveBeenCalledTimes(1);
  });

  it('tap-to-skip dismisses immediately', () => {
    const onDismissed = vi.fn();
    renderSplash({ progressOverride: 0.2, ready: false, onDismissed });

    const splash = container.querySelector(
      '[data-testid="launch-quote-splash"]'
    ) as HTMLDivElement;
    act(() => {
      splash.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(splash.className).toContain('opacity-0');

    act(() => {
      vi.advanceTimersByTime(LAUNCH_FADE_MS);
    });
    expect(container.querySelector('[data-testid="launch-quote-splash"]')).toBeNull();
    expect(onDismissed).toHaveBeenCalledTimes(1);
  });

  it('ramps needle toward redline over ~800ms when not overridden', () => {
    renderSplash({ ready: false });

    act(() => {
      vi.advanceTimersByTime(LAUNCH_NEEDLE_MS / 2);
    });
    const mid = container.querySelector('[data-testid="launch-needle"]');
    const midProgress = Number(mid?.getAttribute('data-progress') ?? '0');
    expect(midProgress).toBeGreaterThan(0.3);
    expect(midProgress).toBeLessThan(0.8);

    act(() => {
      vi.advanceTimersByTime(LAUNCH_NEEDLE_MS);
    });
    const end = container.querySelector('[data-testid="launch-needle"]');
    expect(Number(end?.getAttribute('data-progress') ?? '0')).toBeGreaterThanOrEqual(0.99);
    expect(container.querySelector('[data-testid="launch-hud-primary"]')?.textContent).toBe(
      'REDLINE // READY'
    );
  });

  it('switches quote language with i18n', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    renderSplash({ progressOverride: 0, ready: false });
    expect(container.querySelector('[data-testid="launch-hardcore-quote"]')?.textContent).toContain(
      'bend the bar'
    );
  });
});
