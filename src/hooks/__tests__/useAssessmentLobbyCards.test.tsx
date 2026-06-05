/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { beforeAll, describe, expect, it } from 'vitest';
import { ASSESSMENT_LOBBY_CARD_KEYS } from '../../config/assessmentLobby';
import i18n from '../../i18n';
import {
  useAssessmentLobbyCards,
  type AssessmentLobbyCardModel,
} from '../useAssessmentLobbyCards';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderHookHarness(): {
  getCurrent: () => AssessmentLobbyCardModel[];
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  let latest: AssessmentLobbyCardModel[] = [];

  function Harness() {
    latest = useAssessmentLobbyCards();
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

  it('returns one model per lobby key with title', () => {
    const harness = renderHookHarness();
    const cards = harness.getCurrent();

    expect(cards).toHaveLength(ASSESSMENT_LOBBY_CARD_KEYS.length);
    for (const card of cards) {
      expect(card.to).toMatch(/^\//);
      expect(card.title.length).toBeGreaterThan(0);
    }

    harness.unmount();
  });
});
