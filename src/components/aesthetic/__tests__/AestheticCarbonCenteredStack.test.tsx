/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import AestheticCarbonCenteredStack from '../AestheticCarbonCenteredStack';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderStack(rawMetricLabel: string): {
  container: HTMLDivElement;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <AestheticCarbonCenteredStack
        testIdPrefix="aesthetic-axis-summary"
        primaryTitle="MUSCLE MASS TEST"
        secondaryTitle=""
        titleClassName="text-sm"
        verdictSlotHeightPx={72}
        rawMetricLabel={rawMetricLabel}
        upRatingLabel="UP RATING"
        rawReading="71.7 lb · 42.1%"
        heroScoreText="88.00"
        tierCapsule="Advanced Lifter"
        isOverflow={false}
      />
    );
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('AestheticCarbonCenteredStack', () => {
  it('keeps dual-hero kickers single-line without overflow on narrow columns', () => {
    const { container, unmount } = renderStack('SMM · BW RATIO');
    const rawKicker = container.querySelector(
      '[data-testid="aesthetic-axis-summary-raw-kicker"]'
    );
    const scoreKicker = container.querySelector(
      '[data-testid="aesthetic-axis-summary-score-kicker"]'
    );
    expect(rawKicker?.textContent).toBe('SMM · BW RATIO');
    expect(scoreKicker?.textContent).toBe('UP RATING');
    for (const kicker of [rawKicker, scoreKicker]) {
      // `truncate` = overflow hidden + ellipsis + nowrap (single-line SSOT).
      expect(kicker?.className).toContain('truncate');
      expect(kicker?.className).toContain('max-w-full');
    }
    unmount();
  });
});
