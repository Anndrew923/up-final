/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ProAvatarRing from '../ProAvatarRing';
import ProBadge from '../ProBadge';
import UserProIdentityRow from '../UserProIdentityRow';

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
