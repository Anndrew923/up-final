/* @vitest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExplosiveBranchCard from '../ExplosiveBranchCard';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const openWithLeaf = vi.fn();
const flushExplosiveDraftMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../hooks/useScoreMeaning', () => ({
  useScoreMeaning: () => ({
    decadeKey: '80',
    populationClass: '高階玩家',
    bandId: 'TIER_80',
    bandLabel: 'T80',
  }),
}));

vi.mock('../../../hooks/flushSingleLeafAssessmentDraft', () => ({
  flushExplosiveDraft: (...args: unknown[]) => flushExplosiveDraftMock(...args),
}));

vi.mock('../../../stores/aestheticReportUiStore', () => ({
  useAestheticReportUiStore: (
    sel: (s: { openWithLeaf: (leaf: string) => void }) => unknown
  ) => sel({ openWithLeaf }),
}));

const testProfile = {
  gender: 'male' as const,
  age: 25,
  heightCm: 175,
  weightKg: 75,
  updatedAt: '',
};

describe('ExplosiveBranchCard', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    openWithLeaf.mockClear();
    flushExplosiveDraftMock.mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('calls onCalculate from 計算此項 and shows undiluted score + leaf CTA', () => {
    const onCalculate = vi.fn(() => true);
    const onChange = vi.fn();

    act(() => {
      root.render(
        <ExplosiveBranchCard
          branch="verticalJump"
          value="55"
          lengthUnit="cm"
          metricValue="55"
          profile={testProfile}
          profileReady
          inputsDisabled={false}
          result={{ raw: 87.5 }}
          onChange={onChange}
          onCalculate={onCalculate}
        />
      );
    });

    const calcBtn = document.querySelector(
      '[data-testid="explosive-branch-calc-verticalJump"]'
    ) as HTMLButtonElement;
    expect(calcBtn).not.toBeNull();
    act(() => {
      calcBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onCalculate).toHaveBeenCalledTimes(1);

    const result = document.querySelector(
      '[data-testid="explosive-branch-result-verticalJump"]'
    );
    expect(result?.textContent).toContain('87.50');
    expect(result?.textContent).toContain('高階玩家');

    const leafBtn = document.querySelector(
      '[data-testid="aesthetic-single-leaf-trigger-explosive.verticalJump"]'
    ) as HTMLButtonElement;
    expect(leafBtn).not.toBeNull();
    act(() => {
      leafBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(flushExplosiveDraftMock).toHaveBeenCalledWith({
      tab: 'jumps',
      verticalJumpCm: 55,
      standingLongJumpCm: null,
      sprintSeconds: null,
      profile: testProfile,
    });
    expect(openWithLeaf).toHaveBeenCalledWith('explosive.verticalJump');
  });

  it('opens explosive.sprint leaf for sprint branch (not sprint100m)', () => {
    act(() => {
      root.render(
        <ExplosiveBranchCard
          branch="sprint"
          value="11.45"
          metricValue="11.45"
          profile={testProfile}
          profileReady
          inputsDisabled={false}
          result={{ raw: 92.1 }}
          onChange={vi.fn()}
          onCalculate={vi.fn(() => true)}
        />
      );
    });

    const leafBtn = document.querySelector(
      '[data-testid="aesthetic-single-leaf-trigger-explosive.sprint"]'
    ) as HTMLButtonElement;
    expect(leafBtn).not.toBeNull();
    act(() => {
      leafBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(flushExplosiveDraftMock).toHaveBeenCalledWith({
      tab: 'sprint',
      verticalJumpCm: null,
      standingLongJumpCm: null,
      sprintSeconds: 11.45,
      profile: testProfile,
    });
    expect(openWithLeaf).toHaveBeenCalledWith('explosive.sprint');
  });

  it('opens standingLongJump leaf independently', () => {
    act(() => {
      root.render(
        <ExplosiveBranchCard
          branch="standingLongJump"
          value="220"
          lengthUnit="cm"
          metricValue="220"
          profile={testProfile}
          profileReady
          inputsDisabled={false}
          result={{ raw: 101.2 }}
          onChange={vi.fn()}
          onCalculate={vi.fn(() => true)}
        />
      );
    });

    const leafBtn = document.querySelector(
      '[data-testid="aesthetic-single-leaf-trigger-explosive.standingLongJump"]'
    ) as HTMLButtonElement;
    act(() => {
      leafBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(flushExplosiveDraftMock).toHaveBeenCalledWith({
      tab: 'jumps',
      verticalJumpCm: null,
      standingLongJumpCm: 220,
      sprintSeconds: null,
      profile: testProfile,
    });
    expect(openWithLeaf).toHaveBeenCalledWith('explosive.standingLongJump');
  });
});
