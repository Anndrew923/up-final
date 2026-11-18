/* @vitest-environment jsdom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enArena from '../../../i18n/locales/en/arena.json';
import zhArena from '../../../i18n/locales/zh-Hant/arena.json';
import SubscriptionLegalFooter from '../SubscriptionLegalFooter';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const tArena = vi.fn((key: string) => {
  if (key === 'autoRenewDisclosure') return 'AUTO_RENEW_COPY';
  return key;
});

const tCommon = vi.fn((key: string) => {
  if (key === 'settings.restorePurchases') return 'Restore Purchases';
  if (key === 'settings.restorePurchasesBusy') return 'Restoring…';
  if (key === 'settings.restorePurchasesSuccess') return 'Purchases successfully restored.';
  if (key === 'settings.restorePurchasesEmpty') return 'No Pro purchase found.';
  return key;
});

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string | string[]) => {
    const namespaces = Array.isArray(ns) ? ns : ns ? [ns] : ['common'];
    return {
      t: (key: string, options?: { ns?: string }) => {
        const resolvedNs = options?.ns ?? namespaces[0];
        if (resolvedNs === 'common') return tCommon(key);
        return tArena(key);
      },
      i18n: { language: 'en' },
    };
  },
  Trans: ({
    i18nKey,
    components,
  }: {
    i18nKey: string;
    components?: Record<string, ReactElement>;
  }) => (
    <span data-testid="legal-footer-trans" data-i18n-key={i18nKey}>
      {components?.terms ? (
        <span data-testid="terms-slot">{components.terms}</span>
      ) : null}
      {components?.privacy ? (
        <span data-testid="privacy-slot">{components.privacy}</span>
      ) : null}
    </span>
  ),
}));

vi.mock('../../legal/TermsLegalModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="terms-modal">TERMS</div> : null,
}));

describe('arena auto-renew i18n keys', () => {
  it('defines matching zh/en autoRenewDisclosure + legalFooter keys', () => {
    expect(String(zhArena.autoRenewDisclosure).length).toBeGreaterThan(40);
    expect(String(enArena.autoRenewDisclosure).length).toBeGreaterThan(40);
    expect(zhArena.legalFooter).toContain('<terms>');
    expect(zhArena.legalFooter).toContain('<privacy>');
    expect(enArena.legalFooter).toContain('<terms>');
    expect(enArena.legalFooter).toContain('<privacy>');
    expect(enArena.autoRenewDisclosure).toMatch(/automatically renew/i);
    expect(zhArena.autoRenewDisclosure).toContain('自動續訂');
  });
});

describe('SubscriptionLegalFooter', () => {
  let root: Root;

  beforeEach(() => {
    tArena.mockClear();
    tCommon.mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('renders auto-renew disclosure and Terms/Privacy slots', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter>
          <SubscriptionLegalFooter />
        </MemoryRouter>
      );
    });

    expect(document.body.textContent).toContain('AUTO_RENEW_COPY');
    expect(document.body.querySelector('[data-testid="legal-footer-trans"]')?.getAttribute('data-i18n-key')).toBe(
      'legalFooter'
    );
    expect(document.body.querySelector('[data-testid="terms-slot"]')).toBeTruthy();
    expect(document.body.querySelector('[data-testid="privacy-slot"]')).toBeTruthy();
    expect(tArena).toHaveBeenCalledWith('autoRenewDisclosure');
    expect(document.body.querySelector('[data-testid="subscription-restore-purchases"]')).toBeNull();
  });

  it('invokes onBeforePrivacyNavigate before privacy route change', () => {
    const onBeforePrivacyNavigate = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/join-arena']}>
          <SubscriptionLegalFooter onBeforePrivacyNavigate={onBeforePrivacyNavigate} />
        </MemoryRouter>
      );
    });

    const privacyButton = document.body.querySelector(
      '[data-testid="privacy-slot"] button'
    ) as HTMLButtonElement | null;
    expect(privacyButton).toBeTruthy();

    act(() => {
      privacyButton?.click();
    });

    expect(onBeforePrivacyNavigate).toHaveBeenCalledTimes(1);
  });

  it('renders restore purchases control and fires callback once when enabled', () => {
    const onRestorePurchases = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter>
          <SubscriptionLegalFooter onRestorePurchases={onRestorePurchases} />
        </MemoryRouter>
      );
    });

    const restoreButton = document.body.querySelector(
      '[data-testid="subscription-restore-purchases"]'
    ) as HTMLButtonElement | null;
    expect(restoreButton).toBeTruthy();
    expect(restoreButton?.textContent).toContain('Restore Purchases');
    expect(restoreButton?.disabled).toBe(false);

    act(() => {
      restoreButton?.click();
    });

    expect(onRestorePurchases).toHaveBeenCalledTimes(1);
  });

  it('locks restore control while busy and shows Restoring… copy', () => {
    const onRestorePurchases = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter>
          <SubscriptionLegalFooter
            onRestorePurchases={onRestorePurchases}
            restoreBusy
            restoreStatus="restore-ok"
          />
        </MemoryRouter>
      );
    });

    const restoreButton = document.body.querySelector(
      '[data-testid="subscription-restore-purchases"]'
    ) as HTMLButtonElement | null;
    expect(restoreButton?.disabled).toBe(true);
    expect(restoreButton?.textContent).toContain('Restoring…');
    expect(document.body.querySelector('[data-testid="subscription-restore-status"]')?.textContent).toContain(
      'Purchases successfully restored.'
    );

    act(() => {
      restoreButton?.click();
    });

    expect(onRestorePurchases).not.toHaveBeenCalled();
  });

  it('locks restore control when restoreDisabled without busy', () => {
    const onRestorePurchases = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root.render(
        <MemoryRouter>
          <SubscriptionLegalFooter
            onRestorePurchases={onRestorePurchases}
            restoreDisabled
          />
        </MemoryRouter>
      );
    });

    const restoreButton = document.body.querySelector(
      '[data-testid="subscription-restore-purchases"]'
    ) as HTMLButtonElement | null;
    expect(restoreButton?.disabled).toBe(true);

    act(() => {
      restoreButton?.click();
    });

    expect(onRestorePurchases).not.toHaveBeenCalled();
  });
});
