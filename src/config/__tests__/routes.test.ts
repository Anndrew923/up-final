import { describe, expect, it } from 'vitest';
import {
  ROUTES,
  isCompactShellRoutePath,
  isHomeRoutePath,
  isLadderRoutePath,
  isToolsDeckRoutePath,
} from '../routes';

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

describe('isHomeRoutePath', () => {
  it('matches home tab', () => {
    expect(isHomeRoutePath(ROUTES.home)).toBe(true);
  });

  it('rejects other tabs', () => {
    expect(isHomeRoutePath(ROUTES.tools)).toBe(false);
    expect(isHomeRoutePath(ROUTES.ladder)).toBe(false);
  });
});

describe('isToolsDeckRoutePath', () => {
  it('matches tools tab and calculator nest', () => {
    expect(isToolsDeckRoutePath(ROUTES.tools)).toBe(true);
    expect(isToolsDeckRoutePath(ROUTES.oneRmCalculator)).toBe(true);
    expect(isToolsDeckRoutePath(ROUTES.plateCalculator)).toBe(true);
    expect(isToolsDeckRoutePath(ROUTES.somatotypeLab)).toBe(true);
  });

  it('rejects lookalike prefixes', () => {
    expect(isToolsDeckRoutePath('/training-toolbox')).toBe(false);
    expect(isToolsDeckRoutePath('/toolshed')).toBe(false);
    expect(isToolsDeckRoutePath(ROUTES.home)).toBe(false);
  });
});

describe('isCompactShellRoutePath', () => {
  it('includes home, ladder, join-arena, and tools deck', () => {
    expect(isCompactShellRoutePath(ROUTES.home)).toBe(true);
    expect(isCompactShellRoutePath(ROUTES.ladder)).toBe(true);
    expect(isCompactShellRoutePath(ROUTES.joinArena)).toBe(true);
    expect(isCompactShellRoutePath(ROUTES.tools)).toBe(true);
    expect(isCompactShellRoutePath(ROUTES.oneRmCalculator)).toBe(true);
  });

  it('rejects other primary tabs', () => {
    expect(isCompactShellRoutePath(ROUTES.history)).toBe(false);
    expect(isCompactShellRoutePath(ROUTES.assessment)).toBe(false);
  });
});
