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
    expect(ctx.focusSupplemental).toBeNull();
    expect(ctx.suggestedMode).toBe('single-axis');
  });

  it('maps arm-size page to supplemental armSize focus without six-axis focus', () => {
    const ctx = resolveDynoRouteContext(ROUTES.armSize);
    expect(ctx.consoleLabelKey).toBe('armSize');
    expect(ctx.focusAxis).toBeNull();
    expect(ctx.focusSupplemental).toBe('armSize');
  });

  it('maps cardio page to cooper supplemental by default', () => {
    const ctx = resolveDynoRouteContext(ROUTES.cardio);
    expect(ctx.focusAxis).toBe('cardio');
    expect(ctx.focusSupplemental).toBe('cooper');
  });

  it('maps cardio page to 5km supplemental when tab persisted', () => {
    const ctx = resolveDynoRouteContext(ROUTES.cardio, { cardioActiveTab: '5km' });
    expect(ctx.focusSupplemental).toBe('5km');
  });

  it('maps home to cross-axis console', () => {
    const ctx = resolveDynoRouteContext(ROUTES.home);
    expect(ctx.consoleLabelKey).toBe('home');
  });

  it('maps tools deck and calculator routes to tools console', () => {
    expect(resolveDynoRouteContext(ROUTES.tools).consoleLabelKey).toBe('tools');
    expect(resolveDynoRouteContext(ROUTES.oneRmCalculator).consoleLabelKey).toBe('tools');
  });
});
