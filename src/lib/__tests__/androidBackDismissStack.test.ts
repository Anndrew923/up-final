import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearAndroidBackDismissStack,
  pushAndroidBackDismiss,
  tryDismissTopAndroidBackOverlay,
} from '../androidBackDismissStack';

describe('androidBackDismissStack', () => {
  afterEach(() => {
    clearAndroidBackDismissStack();
  });

  it('returns false when empty', () => {
    expect(tryDismissTopAndroidBackOverlay()).toBe(false);
  });

  it('invokes the topmost handler that claims the event', () => {
    const lower = vi.fn(() => true);
    const upper = vi.fn(() => true);
    pushAndroidBackDismiss(lower);
    pushAndroidBackDismiss(upper);

    expect(tryDismissTopAndroidBackOverlay()).toBe(true);
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
  });

  it('falls through when top returns false', () => {
    const lower = vi.fn(() => true);
    const upper = vi.fn(() => false);
    pushAndroidBackDismiss(lower);
    pushAndroidBackDismiss(upper);

    expect(tryDismissTopAndroidBackOverlay()).toBe(true);
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe removes the handler', () => {
    const handler = vi.fn(() => true);
    const unsubscribe = pushAndroidBackDismiss(handler);
    unsubscribe();

    expect(tryDismissTopAndroidBackOverlay()).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });
});
