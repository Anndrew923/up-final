import { describe, expect, it } from 'vitest';
import { ROUTES, isLadderRoutePath } from '../routes';

describe('isLadderRoutePath', () => {
  it('matches ladder root', () => {
    expect(isLadderRoutePath(ROUTES.ladder)).toBe(true);
  });

  it('matches nested ladder paths', () => {
    expect(isLadderRoutePath(`${ROUTES.ladder}/filters`)).toBe(true);
  });

  it('rejects other tab routes', () => {
    expect(isLadderRoutePath(ROUTES.home)).toBe(false);
    expect(isLadderRoutePath('/ladderish')).toBe(false);
  });
});
