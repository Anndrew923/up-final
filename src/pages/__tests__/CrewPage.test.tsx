/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuildDoc, GuildMemberSnapshot } from '../../types/guild';
import CrewPage from '../CrewPage';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const members: GuildMemberSnapshot[] = [
  {
    uid: 'u1',
    displayName: 'Alpha',
    ladderScore: 90,
    radarScores: {
      strength: 80,
      explosivePower: 70,
      cardio: 60,
      muscleMass: 50,
      bodyFat: 40,
      gripStrength: 30,
    },
    updatedAt: 't0',
  },
  {
    uid: 'u2',
    displayName: 'Beta',
    ladderScore: 70,
    radarScores: {
      strength: 20,
      explosivePower: 20,
      cardio: 20,
      muscleMass: 20,
      bodyFat: 20,
      gripStrength: 20,
    },
    updatedAt: 't0',
  },
];

const guild: GuildDoc = {
  id: 'g1',
  name: 'Iron',
  tag: 'ARN',
  coachUid: 'u1',
  inviteCode: 'ABCDEF',
  memberCount: 2,
  maxMembers: 30,
  memberUids: ['u1', 'u2'],
  members,
  createdAt: 't0',
  updatedAt: 't0',
};

const crewState = vi.hoisted(() => ({
  mode: 'joined' as 'joined' | 'empty',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../hooks/useCrewGuild', () => ({
  useCrewGuild: () => {
    if (crewState.mode === 'empty') {
      return {
        status: 'empty',
        guild: null,
        role: null,
        isCoach: false,
        isPro: false,
        rankedMembers: [],
        authUid: 'guest',
        busy: false,
        refreshing: false,
        actionError: null,
        clearActionError: vi.fn(),
        refresh: vi.fn(),
        create: vi.fn(),
        join: vi.fn(),
        leave: vi.fn(),
        kick: vi.fn(),
        rename: vi.fn(),
        disband: vi.fn(),
      };
    }
    return {
      status: 'ready',
      guild,
      role: 'member',
      isCoach: false,
      isPro: true,
      rankedMembers: members,
      authUid: 'u1',
      busy: false,
      refreshing: false,
      actionError: null,
      clearActionError: vi.fn(),
      refresh: vi.fn(),
      create: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      kick: vi.fn(),
      rename: vi.fn(),
      disband: vi.fn(),
    };
  },
}));

vi.mock('../../components/crew/CrewDispatchMuteSwitch', () => ({
  default: () => <div data-testid="mute-switch" />,
}));

vi.mock('../../components/crew/CrewIdentityBanner', () => ({
  default: () => <div data-testid="identity-banner" />,
}));

vi.mock('../../components/crew/CrewEmptyState', () => ({
  default: () => <div data-testid="crew-empty" />,
}));

vi.mock('../../components/crew/CoachManageDrawer', () => ({
  default: () => null,
}));

vi.mock('../../hooks/useMergedScoresFromLocalStores', () => ({
  useMergedScoresFromLocalStores: () => ({
    strength: 50,
    explosivePower: 50,
    cardio: 50,
    muscleMass: 50,
    bodyFat: 50,
    gripStrength: 50,
  }),
}));

vi.mock('../../hooks/useLocalProfileBrief', () => ({
  useLocalProfileBrief: () => ({ displayName: 'Me', avatarUrl: null }),
}));

vi.mock('../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../hooks/useAndroidBackDismiss', () => ({
  useAndroidBackDismiss: () => undefined,
}));

vi.mock('../../components/ProAvatarRing', () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock('../../components/radar/HexRadarChart', () => ({
  default: () => <div data-testid="hex-radar" />,
}));

vi.mock('../../logic/core/crewFloatingYouBar', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../logic/core/crewFloatingYouBar')>();
  return {
    ...actual,
    shouldShowCrewFloatingYouBar: () => false,
  };
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderCrew(initialPath: string) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/crew"
            element={
              <>
                <CrewPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  });
  return { host, root };
}

describe('CrewPage focusUid deep link', () => {
  let root: Root | null = null;
  let host: HTMLDivElement | null = null;

  beforeEach(() => {
    crewState.mode = 'joined';
    vi.stubGlobal('IntersectionObserver', class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    });
  });

  afterEach(() => {
    if (root && host) {
      act(() => {
        root!.unmount();
      });
      host.remove();
    }
    root = null;
    host = null;
    document.body.querySelectorAll('[role="dialog"]').forEach((n) => n.remove());
    vi.unstubAllGlobals();
  });

  it('auto-opens member radar sheet for valid focusUid and clears query', () => {
    const rendered = renderCrew('/crew?focusUid=u2');
    root = rendered.root;
    host = rendered.host;

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('Beta');
    expect(document.querySelector('[data-testid="location-search"]')?.textContent).toBe('');
  });

  it('keeps ladder visible, does not open sheet, and clears unknown focusUid query', () => {
    const rendered = renderCrew('/crew?focusUid=unknown');
    root = rendered.root;
    host = rendered.host;

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain('Alpha');
    expect(host.textContent).toContain('Beta');
    expect(document.querySelector('[data-testid="location-search"]')?.textContent).toBe('');
  });

  it('harmlessly ignores focusUid when not in a club and clears sticky query', () => {
    crewState.mode = 'empty';
    const rendered = renderCrew('/crew?focusUid=u2');
    root = rendered.root;
    host = rendered.host;

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelector('[data-testid="crew-empty"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="location-search"]')?.textContent).toBe('');
  });
});
