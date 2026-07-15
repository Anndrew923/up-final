/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SomatotypeGender } from '../../../logic/core/somatotypeLab';
import { SomatotypeGapGauge } from '../SomatotypeGapGauge';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const map: Record<string, string> = {
        'tools.somatotypeLab.gap.beyondTitle_male': '👑 檢測到極致幾何維度 / Peak Physique Horizon',
        'tools.somatotypeLab.gap.beyondBody_male':
          '「……定錨為【傳奇級巔峰體貌】。請繼續保持您的頂峰狀態……」',
        'tools.somatotypeLab.gap.beyondTitle_female': '👑 檢測到極致幾何維度 / Peak Physique Horizon',
        'tools.somatotypeLab.gap.beyondBody_female':
          '「……定錨為【史詩級極致體貌】。您已主裝該改裝廠的極限比例！」',
        'tools.somatotypeLab.gap.upgradeGuide': `UPGRADE ${opts?.armGap ?? ''}`,
        'tools.somatotypeLab.gap.upgradeGuideGolden': `GOLDEN_GUIDE ${opts?.armGap ?? ''}`,
        'tools.somatotypeLab.gap.goldenLabel': '✨ 黃金比例天賦 / Golden Ratio',
        'tools.somatotypeLab.gap.goldenValue': `GOLDEN ${opts?.weight}/${opts?.bodyFat}/${opts?.arm}/${opts?.smm}`,
      };
      if (map[key]) return map[key];
      if (key === 'tools.somatotypeLab.gap.title') return `ID ${opts?.height}/${opts?.wrist}`;
      if (key.startsWith('tools.somatotypeLab.gap.')) return key;
      return key;
    },
  }),
}));

function renderGauge(props: {
  beyondHumanLimits?: boolean;
  gender?: SomatotypeGender;
  gapBenchmark?: 'golden' | 'maxTuned';
  armGapCm?: number;
  bodyFatGapPct?: number;
  goldenRatio?: {
    weightKg: number;
    bodyFatPct: number;
    armGirthCm: number;
    smmKg: number;
  } | null;
}): {
  container: HTMLDivElement;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <SomatotypeGapGauge
        heightCm={180}
        wristCm={17}
        currentWeightKg={90}
        currentBodyFatPct={12}
        currentArmGirthCm={40}
        currentSmmKg={40}
        maxTotalWeightKg={95}
        maxBodyFatPct={9}
        maxArmGirthCm={42}
        maxSmmKg={42}
        armGapCm={props.armGapCm ?? 0}
        bodyFatGapPct={props.bodyFatGapPct ?? 3}
        smmGapKg={0}
        weightGapKg={0}
        beyondHumanLimits={props.beyondHumanLimits ?? false}
        gender={props.gender ?? 'male'}
        gapBenchmark={props.gapBenchmark ?? 'maxTuned'}
        goldenRatio={props.goldenRatio ?? null}
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

describe('SomatotypeGapGauge beyondHumanLimits', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders male peak-horizon copy with 傳奇級巔峰體貌', () => {
    const { container, unmount } = renderGauge({ beyondHumanLimits: true, gender: 'male' });
    expect(container.textContent).toContain('Peak Physique Horizon');
    expect(container.textContent).toContain('極致幾何維度');
    expect(container.textContent).toContain('傳奇級巔峰體貌');
    expect(container.textContent).not.toContain('史詩級極致體貌');
    expect(container.textContent).not.toContain('UPGRADE');
    unmount();
  });

  it('renders female peak-horizon copy with 史詩級極致體貌', () => {
    const { container, unmount } = renderGauge({ beyondHumanLimits: true, gender: 'female' });
    expect(container.textContent).toContain('Peak Physique Horizon');
    expect(container.textContent).toContain('極致幾何維度');
    expect(container.textContent).toContain('史詩級極致體貌');
    expect(container.textContent).not.toContain('傳奇級巔峰體貌');
    expect(container.textContent).not.toContain('UPGRADE');
    unmount();
  });

  it('inserts golden-ratio row for female when goldenRatio is provided', () => {
    const { container, unmount } = renderGauge({
      gender: 'female',
      goldenRatio: { weightKg: 53.1, bodyFatPct: 20, armGirthCm: 26.7, smmKg: 19.5 },
    });
    expect(container.textContent).toContain('黃金比例天賦 / Golden Ratio');
    expect(container.textContent).toContain('GOLDEN 53.1/20.0/26.7/19.5');
    expect(container.textContent).toContain('tools.somatotypeLab.gap.maxLabel');
    unmount();
  });

  it('omits golden-ratio row when goldenRatio is null', () => {
    const { container, unmount } = renderGauge({
      gender: 'male',
      goldenRatio: null,
    });
    expect(container.textContent).not.toContain('黃金比例天賦');
    expect(container.textContent).not.toContain('GOLDEN 53');
    unmount();
  });

  it('renders golden-ratio row for male when goldenRatio is provided', () => {
    const { container, unmount } = renderGauge({
      gender: 'male',
      goldenRatio: { weightKg: 75.3, bodyFatPct: 11, armGirthCm: 37.2, smmKg: 38.2 },
    });
    expect(container.textContent).toContain('黃金比例天賦 / Golden Ratio');
    expect(container.textContent).toContain('GOLDEN 75.3/11.0/37.2/38.2');
    unmount();
  });

  it('uses golden upgrade guide copy when gapBenchmark is golden', () => {
    const { container, unmount } = renderGauge({
      gender: 'female',
      gapBenchmark: 'golden',
      armGapCm: 2.5,
      bodyFatGapPct: 4,
      goldenRatio: { weightKg: 53.1, bodyFatPct: 20, armGirthCm: 26.7, smmKg: 19.5 },
    });
    expect(container.textContent).toContain('GOLDEN_GUIDE 2.5');
    expect(container.textContent).not.toContain('UPGRADE');
    unmount();
  });
});
