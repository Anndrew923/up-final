import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GuillocheCrest from '../GuillocheCrest';

describe('GuillocheCrest', () => {
  it('renders a centered monolithic spine UP monogram inside a calibrated hex shield', () => {
    const html = renderToStaticMarkup(<GuillocheCrest />);

    expect(html).toContain('data-testid="aesthetic-guilloche-crest"');
    expect(html).toContain('data-testid="aesthetic-guilloche-monogram"');
    // Dual rings stay centered on (48, 48).
    expect(html).toContain('r="44"');
    expect(html).toContain('r="40.5"');
    // Recentered hex + registration diamonds (no legacy top-heavy shield).
    expect(html).toContain('M48 27 L66 37.5 L66 58.5 L48 69 L30 58.5 L30 37.5 Z');
    expect(html).toContain('M48 25.2');
    expect(html).toContain('M48 67.2');
    expect(html).not.toContain('M48 22 L66 32.5');
    // Shared spine + mirrored ±10 unit wings — bbox [38,58] mid = 48.
    expect(html).toContain('M48 38 L48 58');
    expect(html).toContain('M38 40 L38 54 L42 58 L48 58');
    expect(html).toContain('M48 38 L54 38 L58 42 L58 46 L54 50 L48 50');
    expect(html).toContain('stroke-width="1.3"');
    expect(html).toContain('text-amber-300/80');
    expect(html).toContain('fill-amber-300/15');
    // Legacy eccentric dual-letter starts must stay gone.
    expect(html).not.toContain('M36.0 42.0');
    expect(html).not.toContain('M49.0 42.0');
    expect(html).not.toContain('<text');
    expect(html).not.toContain('fontFamily');
    expect(html).not.toContain('font-family');
    expect(html).not.toMatch(/NaN/);
  });
});
