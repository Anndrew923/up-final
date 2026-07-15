/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  SomatotypeGender,
  SomatotypeGuideMode,
} from '../../../logic/core/somatotypeLab';
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
        'tools.somatotypeLab.gap.upgradeGuideCut_male': `升級指南：【降噪減脂】建議減少約 ${opts?.fatToLoseKg ?? ''}kg 純脂肪以顯露線條。`,
        'tools.somatotypeLab.gap.upgradeGuideCut_female': `升級指南：【降噪減脂】建議減少約 ${opts?.fatToLoseKg ?? ''}kg 純脂肪以顯露線條。`,
        'tools.somatotypeLab.gap.upgradeGuideGolden_male': `升級指南：【黃金比例目標】尚需增肌 ${opts?.smmGap ?? ''}kg、提升臂圍 ${opts?.armGap ?? ''}cm。`,
        'tools.somatotypeLab.gap.upgradeGuideGolden_female': `升級指南：【黃金比例目標】尚需增肌 ${opts?.smmGap ?? ''}kg、提升臂圍 ${opts?.armGap ?? ''}cm。`,
        'tools.somatotypeLab.gap.upgradeGuideLimit_male': `升級指南：【極限天賦挑戰】尚需增肌 ${opts?.smmGap ?? ''}kg、提升臂圍 ${opts?.armGap ?? ''}cm。`,
        'tools.somatotypeLab.gap.upgradeGuideLimit_female': `升級指南：【極限天賦挑戰】尚需增肌 ${opts?.smmGap ?? ''}kg、提升臂圍 ${opts?.armGap ?? ''}cm。`,
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
  guideMode?: SomatotypeGuideMode;
  fatToLoseKg?: number;
  armGapCm?: number;
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
        smmGapKg={0}
        weightGapKg={0}
        beyondHumanLimits={props.beyondHumanLimits ?? false}
        gender={props.gender ?? 'male'}
        guideMode={props.guideMode ?? 'pushToLimit'}
        fatToLoseKg={props.fatToLoseKg ?? 0}
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
    expect(container.textContent).not.toContain('【降噪減脂】');
    unmount();
  });

  it('renders female peak-horizon copy with 史詩級極致體貌', () => {
    const { container, unmount } = renderGauge({ beyondHumanLimits: true, gender: 'female' });
    expect(container.textContent).toContain('Peak Physique Horizon');
    expect(container.textContent).toContain('極致幾何維度');
    expect(container.textContent).toContain('史詩級極致體貌');
    expect(container.textContent).not.toContain('傳奇級巔峰體貌');
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

  it('renders cut guide with fatToLoseKg for male', () => {
    const { container, unmount } = renderGauge({
      gender: 'male',
      guideMode: 'cut',
      fatToLoseKg: 4.8,
      goldenRatio: { weightKg: 75.3, bodyFatPct: 11, armGirthCm: 37.2, smmKg: 38.2 },
    });
    expect(container.textContent).toContain('【降噪減脂】');
    expect(container.textContent).toContain('4.8kg');
    expect(container.textContent).not.toContain('【黃金比例目標】');
    expect(container.textContent).not.toContain('【極限天賦挑戰】');
    unmount();
  });

  it('renders golden bulk guide for female', () => {
    const { container, unmount } = renderGauge({
      gender: 'female',
      guideMode: 'bulkToGolden',
      armGapCm: 2.5,
      goldenRatio: { weightKg: 53.1, bodyFatPct: 20, armGirthCm: 26.7, smmKg: 19.5 },
    });
    expect(container.textContent).toContain('【黃金比例目標】');
    expect(container.textContent).toContain('2.5cm');
    expect(container.textContent).not.toContain('【降噪減脂】');
    expect(container.textContent).not.toContain('【極限天賦挑戰】');
    unmount();
  });

  it('renders limit guide for male', () => {
    const { container, unmount } = renderGauge({
      gender: 'male',
      guideMode: 'pushToLimit',
      armGapCm: 3.1,
    });
    expect(container.textContent).toContain('【極限天賦挑戰】');
    expect(container.textContent).toContain('3.1cm');
    expect(container.textContent).not.toContain('【降噪減脂】');
    expect(container.textContent).not.toContain('【黃金比例目標】');
    unmount();
  });
});
