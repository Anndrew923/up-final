import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../config/routes';
import { resolveDynoRouteContext } from '../dynoIntelRouteContext';

describe('resolveDynoRouteContext', () => {
  it('maps assessment lobby to CONSOLE: LOBBY', () => {
    const ctx = resolveDynoRouteContext(ROUTES.assessment);
    expect(ctx.consoleLabelKey).toBe('lobby');
    expect(ctx.suggestedMode).toBe('cross-axis');
  });

  it('maps strength page to single-axis with focus', () => {
    const ctx = resolveDynoRouteContext(ROUTES.strength);
    expect(ctx.consoleLabelKey).toBe('strength');
    expect(ctx.focusAxis).toBe('strength');
    expect(ctx.suggestedMode).toBe('single-axis');
  });

  it('maps home to cross-axis console', () => {
    const ctx = resolveDynoRouteContext(ROUTES.home);
    expect(ctx.consoleLabelKey).toBe('home');
  });
});
