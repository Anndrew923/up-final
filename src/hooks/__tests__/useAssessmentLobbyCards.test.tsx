/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { beforeAll, describe, expect, it } from 'vitest';
import { LOBBY_BENTO_LAYOUT } from '../../config/assessmentLobby';
import i18n from '../../i18n';
import type { ScoreMap } from '../../types/scoring';
import {
  useAssessmentLobbyCards,
  type AssessmentLobbyCardModel,
} from '../useAssessmentLobbyCards';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderHookHarness(scores: ScoreMap): {
  getCurrent: () => AssessmentLobbyCardModel[];
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: AssessmentLobbyCardModel[] = [];

  function Harness() {
    latest = useAssessmentLobbyCards(scores);
    return null;
  }

  act(() => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>
    );
  });

  return {
    getCurrent: () => latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useAssessmentLobbyCards', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('returns Bento-ordered models with title, glance, size, colSpan, and layer', () => {
    const harness = renderHookHarness({
      strength: 81.57,
      gripStrength: 91,
    });
    const cards = harness.getCurrent();

    expect(cards).toHaveLength(LOBBY_BENTO_LAYOUT.length);
    expect(cards.map((c) => c.key)).toEqual(LOBBY_BENTO_LAYOUT.map((s) => s.key));

    const strength = cards.find((c) => c.key === 'strength');
    const grip = cards.find((c) => c.key === 'grip');
    const cardio = cards.find((c) => c.key === 'cardio');

    expect(strength?.glanceLabel).toBe('81.57');
    expect(strength?.glanceFilled).toBe(true);
    expect(grip?.glanceLabel).toBe('91.00');
    expect(grip?.glanceFilled).toBe(true);
    expect(cardio?.glanceLabel).toBe('未測');
    expect(cardio?.glanceFilled).toBe(false);
    expect(strength?.glanceLabel).not.toMatch(/[A-Za-z]/);
    expect(grip?.glanceLabel).not.toMatch(/[A-Za-z]/);

    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      const slot = LOBBY_BENTO_LAYOUT[i];
      expect(card.to).toMatch(/^\//);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.glanceLabel.length).toBeGreaterThan(0);
      expect(card.size).toBe(slot.size);
      expect(card.colSpan).toBe(slot.colSpan);
      expect(card.layer).toBe(slot.layer);
    }

    harness.unmount();
  });
});
