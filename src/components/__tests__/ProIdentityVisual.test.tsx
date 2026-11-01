/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ProAvatarRing from '../ProAvatarRing';
import ProBadge from '../ProBadge';
import UserProIdentityRow from '../UserProIdentityRow';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('ProBadge metal variant', () => {
  it('renders arena proBadge copy with metal gradient classes', () => {
    const html = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <ProBadge size="sm" variant="metal" />
      </I18nextProvider>
    );
    expect(html).toContain('from-amber-300');
    expect(html).toContain('to-orange-500');
    expect(html).toContain('font-black');
  });
});

describe('ProAvatarRing', () => {
  it('keeps fixed outer footprint for Pro and non-Pro', () => {
    const pro = renderToStaticMarkup(
      <ProAvatarRing isPro size="sm" src={null} fallback="A" />
    );
    const free = renderToStaticMarkup(
      <ProAvatarRing isPro={false} size="sm" src={null} fallback="A" />
    );
    expect(pro).toContain('h-10 w-10');
    expect(free).toContain('h-10 w-10');
    expect(pro).toContain('from-amber-200');
    expect(pro).toContain('motion-reduce:shadow-none');
    expect(free).toContain('border-accent-info/40');
    expect(free).not.toContain('from-amber-200');
  });

  it('falls back to initial when the portrait URL errors', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <ProAvatarRing
          isPro={false}
          size="sm"
          src="https://example.com/broken.jpg"
          fallback="A"
        />
      );
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    act(() => {
      img?.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('A');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

describe('UserProIdentityRow', () => {
  it('shows metal badge only when Pro', () => {
    const pro = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <UserProIdentityRow isPro name="Pilot" avatarFallback="P" />
      </I18nextProvider>
    );
    const free = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <UserProIdentityRow isPro={false} name="Pilot" avatarFallback="P" />
      </I18nextProvider>
    );
    expect(pro).toContain('from-amber-300');
    expect(free).not.toContain('from-amber-300');
  });
});
