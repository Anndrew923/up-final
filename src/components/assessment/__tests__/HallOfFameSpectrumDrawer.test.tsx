/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HallOfFameSpectrumDrawer from '../HallOfFameSpectrumDrawer';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'assessment.hallSpectrum.title') {
        return `${String(options?.axisTitle ?? '')} · Hall Spectrum`;
      }
      if (key === 'assessment.hallSpectrum.closeAria') return 'Close spectrum';
      if (key === 'assessment.hallSpectrum.ladderRegionAria') return 'Ladder';
      if (key === 'assessment.hallSpectrum.currentRungAria') {
        return `Current: ${String(options?.populationClass ?? '')}`;
      }
      if (key === 'assessment.hallSpectrum.legalExpand') return 'Expand legal';
      if (key === 'assessment.hallSpectrum.legalCollapse') return 'Collapse legal';
      if (key === 'assessment.hallSpectrum.teaserKicker') return 'DYNO INTEL';
      if (key === 'assessment.hallSpectrum.teaserLine') {
        return 'Drop feelings. Face yourself through scientific norms.';
      }
      if (key === 'assessment.hallSpectrum.teaserCta') {
        return 'Decode physiology';
      }
      if (key === 'assessment.hallSpectrum.teaserCtaRemaining') {
        return `${String(options?.remaining ?? '')} left`;
      }
      if (key === 'assessment.hallSpectrum.teaserCtaArrow') return '➔';
      if (key === 'assessment.hallSpectrum.teaserCtaAria') {
        return `Open Dyno (${String(options?.remaining ?? '')} left)`;
      }
      if (key === 'dynoIntel.hallOfFame.legalShield') {
        return 'A'.repeat(120);
      }
      if (key.startsWith('dynoIntel.humanPraise.byDecade.')) {
        const decade = key.split('.')[3];
        return `CLASS_${decade}`;
      }
      return key;
    },
    i18n: { language: 'zh-Hant' },
  }),
}));

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../hooks/useAndroidBackDismiss', () => ({
  useAndroidBackDismiss: () => undefined,
}));

vi.mock('../../../lib/motionPreference', () => ({
  usePrefersReducedMotion: () => true,
  prefersReducedMotion: () => true,
}));

describe('HallOfFameSpectrumDrawer', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    document.body.querySelectorAll('[role="dialog"]').forEach((node) => node.remove());
  });

  it('renders restrained ladder with names only on the current rung', () => {
    act(() => {
      root.render(
        <HallOfFameSpectrumDrawer
          open
          onClose={vi.fn()}
          axisId="strength"
          axisTitle="馬力"
          scoreDisplay="76.80"
          decadeKey="70"
          populationClass="進階訓練者"
          dynoRemaining={2}
          onOpenDyno={vi.fn()}
        />
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('76.80');
    expect(dialog?.textContent).toContain('進階訓練者');
    expect(dialog?.textContent).toContain('DYNO INTEL');
    expect(dialog?.textContent).toContain('Drop feelings');

    const current = document.querySelector('[aria-current="step"]');
    expect(current).not.toBeNull();
    expect(current?.textContent).toMatch(/Chris Evans|Michael Jordan/i);

    const otherRows = Array.from(document.querySelectorAll('li')).filter(
      (li) => li.getAttribute('aria-current') !== 'step'
    );
    for (const row of otherRows) {
      expect(row.textContent).not.toMatch(/Chris Evans|Michael Jordan/i);
    }

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('expands legal shield and fires onOpenDyno after close', () => {
    const onClose = vi.fn();
    const onOpenDyno = vi.fn();

    act(() => {
      root.render(
        <HallOfFameSpectrumDrawer
          open
          onClose={onClose}
          axisId="strength"
          axisTitle="馬力"
          scoreDisplay="76.80"
          decadeKey="70"
          populationClass="進階訓練者"
          dynoRemaining={2}
          onOpenDyno={onOpenDyno}
        />
      );
    });

    const expandLegal = Array.from(document.querySelectorAll('button')).find((el) =>
      el.textContent?.includes('Expand legal')
    );
    expect(expandLegal).toBeDefined();
    act(() => {
      expandLegal?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(
      Array.from(document.querySelectorAll('button')).some((el) =>
        el.textContent?.includes('Collapse legal')
      )
    ).toBe(true);

    const cta = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Open Dyno')
    );
    act(() => {
      cta?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenDyno).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and backdrop click', () => {
    const onClose = vi.fn();

    act(() => {
      root.render(
        <HallOfFameSpectrumDrawer
          open
          onClose={onClose}
          axisId="strength"
          axisTitle="馬力"
          scoreDisplay="76.80"
          decadeKey="70"
          populationClass="進階訓練者"
          dynoRemaining={1}
          onOpenDyno={vi.fn()}
        />
      );
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = Array.from(document.querySelectorAll('button')).find(
      (el) => el.getAttribute('aria-label') === 'Close spectrum'
    );
    act(() => {
      backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps the current rung nameless below the celebrity floor', () => {
    act(() => {
      root.render(
        <HallOfFameSpectrumDrawer
          open
          onClose={vi.fn()}
          axisId="strength"
          axisTitle="馬力"
          scoreDisplay="52.00"
          decadeKey="50"
          populationClass="新手村"
          dynoRemaining={0}
          onOpenDyno={vi.fn()}
        />
      );
    });

    const current = document.querySelector('[aria-current="step"]');
    expect(current?.textContent).toContain('CLASS_50');
    expect(current?.textContent).not.toMatch(/Chris Evans|Michael Jordan/i);
    expect(
      Array.from(document.querySelectorAll('button')).some((el) =>
        el.getAttribute('aria-label')?.includes('0 left')
      )
    ).toBe(true);
  });

  it('pins the Dyno CTA footer with the shared safe-area footer token', () => {
    act(() => {
      root.render(
        <HallOfFameSpectrumDrawer
          open
          onClose={vi.fn()}
          axisId="strength"
          axisTitle="馬力"
          scoreDisplay="76.80"
          decadeKey="70"
          populationClass="進階訓練者"
          dynoRemaining={2}
          onOpenDyno={vi.fn()}
        />
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    const footer = dialog?.querySelector('footer');
    expect(footer?.className).toContain('ui-modal-safe-footer');
  });

  it('splits Dyno CTA into primary action and remaining quota pill', () => {
    act(() => {
      root.render(
        <HallOfFameSpectrumDrawer
          open
          onClose={vi.fn()}
          axisId="strength"
          axisTitle="馬力"
          scoreDisplay="76.80"
          decadeKey="70"
          populationClass="進階訓練者"
          dynoRemaining={25}
          onOpenDyno={vi.fn()}
        />
      );
    });

    const cta = Array.from(document.querySelectorAll('button')).find((el) =>
      el.getAttribute('aria-label')?.includes('Open Dyno')
    );
    expect(cta).toBeDefined();
    expect(cta?.className).toContain('justify-between');
    expect(cta?.getAttribute('aria-label')).toContain('25 left');

    const actionCluster = cta?.querySelector(':scope > span:first-child');
    const quotaPill = cta?.querySelector(':scope > span:last-child');
    expect(actionCluster?.textContent).toContain('Decode physiology');
    expect(actionCluster?.textContent).toContain('➔');
    expect(actionCluster?.textContent).not.toContain('25');
    expect(quotaPill?.textContent).toBe('25 left');
    expect(quotaPill?.className).toContain('tabular-nums');
    expect(quotaPill?.className).toContain('shrink-0');
  });
});
