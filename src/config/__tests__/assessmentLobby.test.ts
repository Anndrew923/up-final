import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_LOBBY_CARD_KEYS,
  ASSESSMENT_LOBBY_ROUTES,
  ASSESSMENT_LOBBY_STATUS_BAR_CLASS,
} from '../assessmentLobby';

describe('assessmentLobby config', () => {
  it('maps every lobby card key to a non-empty route', () => {
    for (const key of ASSESSMENT_LOBBY_CARD_KEYS) {
      expect(ASSESSMENT_LOBBY_ROUTES[key]).toMatch(/^\//);
    }
  });

  it('keeps keys and routes in sync', () => {
    expect(Object.keys(ASSESSMENT_LOBBY_ROUTES).sort()).toEqual(
      [...ASSESSMENT_LOBBY_CARD_KEYS].sort()
    );
  });

  it('defines status bar styles for every lobby card key', () => {
    for (const key of ASSESSMENT_LOBBY_CARD_KEYS) {
      expect(ASSESSMENT_LOBBY_STATUS_BAR_CLASS[key]?.length).toBeGreaterThan(0);
    }
  });
});
