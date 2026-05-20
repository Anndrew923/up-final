import { describe, expect, it } from 'vitest';
import { ASSESSMENT_LOBBY_CARD_KEYS, ASSESSMENT_LOBBY_ROUTES } from '../assessmentLobby';

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
});
