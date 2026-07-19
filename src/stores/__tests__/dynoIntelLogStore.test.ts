import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as persistence from '../../services/dynoIntelLogPersistence';
import { useDynoIntelLogStore } from '../dynoIntelLogStore';
import { useEntitlementStore } from '../entitlementStore';
import type { DynoIntelLogEntry } from '../../logic/core/dynoIntelLogTypes';

function makeEntry(uid: string, timestamp: number): DynoIntelLogEntry {
  return {
    id: `log-${timestamp}`,
    uid,
    timestamp,
    focusAxis: 'strength',
    userQuestion: `question-${timestamp}`,
    commentary: `commentary-${timestamp}`,
    closingBeatKind: 'return-ritual',
  };
}

describe('dynoIntelLogStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useDynoIntelLogStore.setState({
      entries: [],
      boundUid: null,
      hydrated: false,
    });
    useEntitlementStore.setState({
      purchaseStatus: 'owned',
      subscriptionStatus: 'free',
      isPro: false,
      proExpiresAt: null,
      planId: null,
      lastCheckedAt: null,
    });
  });

  it('bindSession isolates logs per uid', () => {
    const loadSpy = vi.spyOn(persistence, 'loadDynoIntelLogs');
    loadSpy.mockImplementation((uid) => {
      if (uid === 'user-a') return [makeEntry('user-a', 100)];
      if (uid === 'user-b') return [makeEntry('user-b', 200)];
      return [];
    });

    useDynoIntelLogStore.getState().bindSession('user-a');
    expect(useDynoIntelLogStore.getState().entries).toHaveLength(1);
    expect(useDynoIntelLogStore.getState().entries[0]?.uid).toBe('user-a');

    useDynoIntelLogStore.getState().bindSession('user-b');
    expect(useDynoIntelLogStore.getState().entries[0]?.uid).toBe('user-b');
    expect(useDynoIntelLogStore.getState().entries[0]?.timestamp).toBe(200);
  });

  it('appendLog enforces Core cap of 5 and persists', () => {
    const saveSpy = vi.spyOn(persistence, 'saveDynoIntelLogs').mockImplementation(() => {});
    vi.spyOn(persistence, 'loadDynoIntelLogs').mockReturnValue([]);

    useDynoIntelLogStore.getState().bindSession('core-user');

    for (let index = 1; index <= 6; index += 1) {
      useDynoIntelLogStore.getState().appendLog({
        uid: 'core-user',
        timestamp: index,
        focusAxis: 'strength',
        userQuestion: `q-${index}`,
        commentary: `c-${index}`,
        closingBeatKind: 'return-ritual',
      });
    }

    const { entries } = useDynoIntelLogStore.getState();
    expect(entries).toHaveLength(5);
    expect(entries.map((row) => row.timestamp)).toEqual([6, 5, 4, 3, 2]);
    expect(saveSpy).toHaveBeenCalled();
    const lastSave = saveSpy.mock.calls.at(-1)?.[1] as DynoIntelLogEntry[];
    expect(lastSave).toHaveLength(5);
  });

  it('getMostRecent returns newest timestamp entry for restore rewind', () => {
    useDynoIntelLogStore.setState({
      boundUid: 'user-a',
      hydrated: true,
      entries: [makeEntry('user-a', 10), makeEntry('user-a', 50), makeEntry('user-a', 30)],
    });

    const latest = useDynoIntelLogStore.getState().getMostRecent();
    expect(latest?.timestamp).toBe(50);
    expect(latest?.commentary).toBe('commentary-50');
  });

  it('Pro appendLog keeps more than 5 entries', () => {
    useEntitlementStore.setState({
      purchaseStatus: 'owned',
      subscriptionStatus: 'pro',
      isPro: true,
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'pro',
      lastCheckedAt: null,
    });
    vi.spyOn(persistence, 'saveDynoIntelLogs').mockImplementation(() => {});
    useDynoIntelLogStore.getState().bindSession('pro-user');

    for (let index = 1; index <= 6; index += 1) {
      useDynoIntelLogStore.getState().appendLog({
        uid: 'pro-user',
        timestamp: index,
        focusAxis: 'strength',
        userQuestion: `q-${index}`,
        commentary: `c-${index}`,
        closingBeatKind: 'return-ritual',
      });
    }

    expect(useDynoIntelLogStore.getState().entries).toHaveLength(6);
  });

  it('bindSession(null) clears in-memory logs and marks hydrated', () => {
    useDynoIntelLogStore.setState({
      boundUid: 'user-a',
      hydrated: true,
      entries: [makeEntry('user-a', 1)],
    });

    useDynoIntelLogStore.getState().bindSession(null);

    const state = useDynoIntelLogStore.getState();
    expect(state.boundUid).toBeNull();
    expect(state.entries).toEqual([]);
    expect(state.hydrated).toBe(true);
  });

  it('appendLog hydrates session when bootstrap has not bound yet', () => {
    vi.spyOn(persistence, 'loadDynoIntelLogs').mockReturnValue([makeEntry('late-user', 5)]);
    vi.spyOn(persistence, 'saveDynoIntelLogs').mockImplementation(() => {});

    useDynoIntelLogStore.getState().appendLog({
      uid: 'late-user',
      timestamp: 10,
      focusAxis: 'strength',
      userQuestion: 'q',
      commentary: 'c',
      closingBeatKind: 'return-ritual',
    });

    const state = useDynoIntelLogStore.getState();
    expect(state.boundUid).toBe('late-user');
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]?.timestamp).toBe(10);
  });

  it('grace-period Pro keeps unlimited local logs via hasProAccess', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    useEntitlementStore.setState({
      purchaseStatus: 'owned',
      subscriptionStatus: 'grace',
      isPro: false,
      proExpiresAt: future,
      planId: 'pro',
      lastCheckedAt: null,
    });
    vi.spyOn(persistence, 'saveDynoIntelLogs').mockImplementation(() => {});
    useDynoIntelLogStore.getState().bindSession('grace-user');

    for (let index = 1; index <= 6; index += 1) {
      useDynoIntelLogStore.getState().appendLog({
        uid: 'grace-user',
        timestamp: index,
        focusAxis: 'strength',
        userQuestion: `q-${index}`,
        commentary: `c-${index}`,
        closingBeatKind: 'return-ritual',
      });
    }

    expect(useDynoIntelLogStore.getState().entries).toHaveLength(6);
  });

  it('rejects append when uid does not match bound session', () => {
    vi.spyOn(persistence, 'saveDynoIntelLogs').mockImplementation(() => {});
    useDynoIntelLogStore.getState().bindSession('user-a');

    useDynoIntelLogStore.getState().appendLog({
      uid: 'user-b',
      focusAxis: 'strength',
      userQuestion: 'q',
      commentary: 'c',
      closingBeatKind: 'return-ritual',
    });

    expect(useDynoIntelLogStore.getState().entries).toHaveLength(0);
  });
});
