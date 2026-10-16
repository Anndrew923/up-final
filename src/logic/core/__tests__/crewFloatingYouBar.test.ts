import { describe, expect, it } from 'vitest';
import {
  scoreMapHasPositiveAxis,
  shouldShowCrewFloatingYouBar,
} from '../crewFloatingYouBar';

describe('shouldShowCrewFloatingYouBar', () => {
  it('hides when user is not on the roster', () => {
    expect(
      shouldShowCrewFloatingYouBar({
        myRank: null,
        myRowInViewport: false,
        listOverflowsViewport: true,
        forceAtTop: true,
      })
    ).toBe(false);
  });

  it('shows when own row is off-screen', () => {
    expect(
      shouldShowCrewFloatingYouBar({
        myRank: 4,
        myRowInViewport: false,
        listOverflowsViewport: false,
        forceAtTop: false,
      })
    ).toBe(true);
  });

  it('hides when own row is visible and not force-at-top', () => {
    expect(
      shouldShowCrewFloatingYouBar({
        myRank: 2,
        myRowInViewport: true,
        listOverflowsViewport: true,
        forceAtTop: false,
      })
    ).toBe(false);
  });

  it('shows at top when buried rank and list overflows', () => {
    expect(
      shouldShowCrewFloatingYouBar({
        myRank: 12,
        myRowInViewport: true,
        listOverflowsViewport: true,
        forceAtTop: true,
      })
    ).toBe(true);
  });

  it('hides while member detail sheet is open', () => {
    expect(
      shouldShowCrewFloatingYouBar({
        myRank: 4,
        myRowInViewport: false,
        listOverflowsViewport: true,
        forceAtTop: true,
        detailOpen: true,
      })
    ).toBe(false);
  });
});

describe('scoreMapHasPositiveAxis', () => {
  it('rejects empty or all-zero maps', () => {
    expect(scoreMapHasPositiveAxis(null)).toBe(false);
    expect(scoreMapHasPositiveAxis({})).toBe(false);
    expect(scoreMapHasPositiveAxis({ strength: 0, cardio: 0 })).toBe(false);
  });

  it('accepts any positive finite axis', () => {
    expect(scoreMapHasPositiveAxis({ strength: 12 })).toBe(true);
  });
});
