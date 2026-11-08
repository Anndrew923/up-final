import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetPushNavigationBridgeForTests,
  navigateFromPushRoute,
  registerPushNavigateHandler,
  unregisterPushNavigateHandler,
} from '../pushNavigationBridge';

describe('pushNavigationBridge', () => {
  beforeEach(() => {
    __resetPushNavigationBridgeForTests();
  });

  it('delivers immediately when a handler is registered', () => {
    const handler = vi.fn();
    registerPushNavigateHandler(handler);
    expect(navigateFromPushRoute('/crew?focusUid=u1')).toBe(true);
    expect(handler).toHaveBeenCalledWith('/crew?focusUid=u1');
  });

  it('queues a cold-start route until the handler registers', () => {
    expect(navigateFromPushRoute('/crew?focusUid=cold')).toBe(true);
    const handler = vi.fn();
    registerPushNavigateHandler(handler);
    expect(handler).toHaveBeenCalledWith('/crew?focusUid=cold');
  });

  it('keeps only the latest pending route', () => {
    navigateFromPushRoute('/crew?focusUid=a');
    navigateFromPushRoute('/crew?focusUid=b');
    const handler = vi.fn();
    registerPushNavigateHandler(handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('/crew?focusUid=b');
  });

  it('does not clear handler when unregistering a stale reference', () => {
    const live = vi.fn();
    const stale = vi.fn();
    registerPushNavigateHandler(live);
    unregisterPushNavigateHandler(stale);
    expect(navigateFromPushRoute('/crew')).toBe(true);
    expect(live).toHaveBeenCalledWith('/crew');
  });

  it('rejects empty routes', () => {
    expect(navigateFromPushRoute('')).toBe(false);
    expect(navigateFromPushRoute('   ')).toBe(false);
  });
});
