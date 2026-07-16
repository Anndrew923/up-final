import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../config/routes';
import { joinArenaPath } from '../joinArenaNavigation';
import { uiGateNextRoute } from '../uiGateNavigation';

describe('uiGateNavigation', () => {
  it('embeds allowlisted returnTo on Pro Join Arena routes', () => {
    expect(
      uiGateNextRoute({ kind: 'pro', joinArenaFrom: 'dyno-intel' }, ROUTES.grip)
    ).toBe(joinArenaPath('dyno-intel', ROUTES.grip));
    expect(uiGateNextRoute({ kind: 'pro', joinArenaFrom: 'backup' }, ROUTES.tools)).toBe(
      joinArenaPath('backup', ROUTES.tools)
    );
  });

  it('keeps auth choice for auth gates', () => {
    expect(uiGateNextRoute({ kind: 'auth' }, ROUTES.home)).toBe(ROUTES.authChoice);
  });

  it('routes core gates to Join Arena like Pro', () => {
    expect(
      uiGateNextRoute({ kind: 'core', joinArenaFrom: 'dyno-intel' }, ROUTES.home)
    ).toBe(joinArenaPath('dyno-intel', ROUTES.home));
  });
});
