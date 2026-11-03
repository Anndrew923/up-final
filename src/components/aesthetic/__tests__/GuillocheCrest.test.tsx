import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GuillocheCrest from '../GuillocheCrest';

describe('GuillocheCrest', () => {
  it('renders hairline continuous UP monogram inside the hex seal rings', () => {
    const html = renderToStaticMarkup(<GuillocheCrest />);

    expect(html).toContain('data-testid="aesthetic-guilloche-crest"');
    expect(html).toContain('data-testid="aesthetic-guilloche-monogram"');
    // Dual rings + hex shield geometry.
    expect(html).toContain('r="44"');
    expect(html).toContain('r="40.5"');
    expect(html).toContain('M48 22 L66 32.5 L66 53.5 L48 64 L30 53.5 L30 32.5 Z');
    // Cold-steel hairline chrome — no system fonts / stencil slit markers.
    expect(html).toContain('text-amber-300/60');
    expect(html).toContain('fill-amber-300/15');
    expect(html).toContain('stroke-width="1.2"');
    expect(html).toContain('M36.0 42.0');
    expect(html).toContain('M49.0 42.0');
    expect(html).not.toContain('M39.2 51.0');
    expect(html).not.toContain('fill-amber-300/40');
    expect(html).not.toContain('fill-rule="evenodd"');
    expect(html).not.toContain('<text');
    expect(html).not.toContain('fontFamily');
    expect(html).not.toContain('font-family');
    expect(html).not.toMatch(/NaN/);
  });
});
