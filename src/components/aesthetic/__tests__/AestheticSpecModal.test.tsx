/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import type { AestheticSpecCardModel } from '../../../hooks/useAestheticSpecCard';
import AestheticSpecModal from '../AestheticSpecModal';
import { CERT_STAGE_WRAP_CLASS } from '../aestheticChrome';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const fixture: AestheticSpecCardModel = {
  overallScore: 69.06,
  battleCode: 'UP-Bruce #1234',
  gender: 'male',
  bodyFatPct: 8,
  gripScore: 90,
  spec: {
    overallTitleId: 'health',
    visual: { id: 'assassin', score: 88.3, unmeasured: false, bodyFatMissing: false },
    force: { id: '80', score: 85, unmeasured: false },
    kinetic: { id: '70', score: 72, unmeasured: false },
    hasTitanGrip: false,
    peakKg: null,
  },
};

vi.mock('../../../lib/motionPreference', () => ({
  prefersReducedMotion: () => false,
}));

vi.mock('../../../hooks/useAestheticSpecCard', () => ({
  useAestheticSpecCard: () => fixture,
}));

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

describe('AestheticSpecModal certificate shell', () => {
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

  it('keeps close outside the plaque and never scrolls the 9:16 stage', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    const card = document.querySelector('[data-testid="aesthetic-spec-card"]');
    expect(card).not.toBeNull();
    expect(card?.querySelector('button')).toBeNull();

    const close = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === '關閉名片'
    );
    expect(close).toBeDefined();
    expect(card?.contains(close ?? null)).toBe(false);

    const wrap = card?.parentElement;
    expect(wrap?.className).toBe(CERT_STAGE_WRAP_CLASS);
    expect(wrap?.className).not.toContain('overflow-y');
    expect(document.body.innerHTML).toContain('h-dvh');
    expect(document.body.innerHTML).not.toContain('ui-modal-safe-footer');

    act(() => {
      close?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('skips the cascade on first backdrop tap and closes on the second', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    const shell = document.querySelector('[data-cert-phase]');
    const dialog = document.querySelector('[role="dialog"]');
    expect(shell?.getAttribute('data-cert-phase')).toBe('revealing');
    expect(dialog?.getAttribute('aria-busy')).toBe('true');

    const backdrop = document.querySelector<HTMLButtonElement>(
      '[aria-label="關閉生理規格證書"]'
    );
    expect(backdrop).not.toBeNull();

    act(() => {
      backdrop?.click();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(shell?.getAttribute('data-cert-phase')).toBe('done');
    expect(dialog?.getAttribute('aria-busy')).toBe('false');

    act(() => {
      backdrop?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes immediately from the plaque-close button during revealing', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    expect(document.querySelector('[data-cert-phase]')?.getAttribute('data-cert-phase')).toBe(
      'revealing'
    );

    const close = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === '關閉名片'
    );
    act(() => {
      close?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

