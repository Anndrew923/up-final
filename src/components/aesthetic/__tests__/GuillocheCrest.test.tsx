import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GuillocheCrest from '../GuillocheCrest';

describe('GuillocheCrest', () => {
  it('renders engraved vector UP monogram inside the hex seal rings', () => {
    const html = renderToStaticMarkup(<GuillocheCrest />);

    expect(html).toContain('data-testid="aesthetic-guilloche-crest"');
    expect(html).toContain('data-testid="aesthetic-guilloche-monogram"');
    // Dual rings + hex shield geometry.
    expect(html).toContain('r="44"');
    expect(html).toContain('r="40.5"');
    expect(html).toContain('M48 22 L66 32.5 L66 53.5 L48 64 L30 53.5 L30 32.5 Z');
    // Pure path monogram — no system font text.
    expect(html).toContain('M35.2 39.6');
    expect(html).toContain('M48.2 39.6');
    expect(html).toContain('fill-amber-300/40');
    expect(html).toContain('stroke-amber-300/50');
    expect(html).not.toContain('<text');
    expect(html).not.toContain('fontFamily');
  });
});
