import { describe, expect, it } from 'vitest';
import { ROUTES, isCompactShellRoutePath, isLadderRoutePath } from '../routes';

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

describe('isCompactShellRoutePath', () => {
  it('includes ladder and join-arena', () => {
    expect(isCompactShellRoutePath(ROUTES.ladder)).toBe(true);
    expect(isCompactShellRoutePath(ROUTES.joinArena)).toBe(true);
  });

  it('rejects standard tab routes', () => {
    expect(isCompactShellRoutePath(ROUTES.home)).toBe(false);
    expect(isCompactShellRoutePath(ROUTES.tools)).toBe(false);
  });
});
