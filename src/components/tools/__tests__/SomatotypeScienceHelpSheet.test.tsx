/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SomatotypeScienceHelpSheet } from '../SomatotypeScienceHelpSheet';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'tools.somatotypeLab.help.dismiss': '了解',
        'tools.somatotypeLab.help.closeAria': '關閉說明',
        'tools.somatotypeLab.help.somatotype.title': '什麼是人體幾何胚型？',
        'tools.somatotypeLab.help.somatotype.intro': 'Heath-Carter 定錨說明。',
        'tools.somatotypeLab.help.somatotype.endoLabel': '內胚層 (Endomorphy)',
        'tools.somatotypeLab.help.somatotype.endoBody': '儲能與組織飽滿度。',
        'tools.somatotypeLab.help.somatotype.mesoLabel': '中胚層 (Mesomorphy)',
        'tools.somatotypeLab.help.somatotype.mesoBody': '骨骼肌、關節與運動天賦比例。',
        'tools.somatotypeLab.help.somatotype.ectoLabel': '外胚層 (Ectomorphy)',
        'tools.somatotypeLab.help.somatotype.ectoBody': '修長、骨架線性度與視覺比例。',
        'tools.somatotypeLab.help.somatotype.outro': '導航改裝動線。',
        'tools.somatotypeLab.help.goldenRatio.title': '黃金比例天賦如何計算？',
        'tools.somatotypeLab.help.goldenRatio.intro': '衣架子賽道說明。',
        'tools.somatotypeLab.help.goldenRatio.colMetric': '項目',
        'tools.somatotypeLab.help.goldenRatio.colMale': '男性',
        'tools.somatotypeLab.help.goldenRatio.colFemale': '女性',
        'tools.somatotypeLab.help.goldenRatio.rowWeight': '黃金體重',
        'tools.somatotypeLab.help.goldenRatio.maleWeight': 'BMI 23.0 · 精壯倒三角',
        'tools.somatotypeLab.help.goldenRatio.femaleWeight': 'BMI 19.5 · 高質感名模',
        'tools.somatotypeLab.help.goldenRatio.rowBf': '黃金體脂',
        'tools.somatotypeLab.help.goldenRatio.maleBf': '11.0% · 雕刻級六塊肌',
        'tools.somatotypeLab.help.goldenRatio.femaleBf': '20.0% · 緊緻飽滿馬甲線',
        'tools.somatotypeLab.help.goldenRatio.rowSmm': '黃金肌肉',
        'tools.somatotypeLab.help.goldenRatio.maleSmm': '57% FFM · 除脂體重佔比',
        'tools.somatotypeLab.help.goldenRatio.femaleSmm': '55% FFM · 除脂體重佔比',
        'tools.somatotypeLab.help.goldenRatio.outro': '終極幾何比例。',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

describe('SomatotypeScienceHelpSheet', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function mount(kind: 'somatotype' | 'goldenRatio', onClose = vi.fn()) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root: Root = createRoot(host);
    act(() => {
      root.render(<SomatotypeScienceHelpSheet open kind={kind} onClose={onClose} />);
    });
    return {
      onClose,
      unmount: () => {
        act(() => {
          root.unmount();
        });
        host.remove();
      },
    };
  }

  it('renders somatotype axis list for Heath–Carter help', () => {
    const { unmount } = mount('somatotype');
    expect(document.body.textContent).toContain('什麼是人體幾何胚型？');
    expect(document.body.textContent).toContain('內胚層 (Endomorphy)');
    expect(document.body.textContent).toContain('中胚層 (Mesomorphy)');
    expect(document.body.textContent).toContain('外胚層 (Ectomorphy)');
    expect(document.body.querySelector('table')).toBeNull();
    unmount();
  });

  it('renders golden-ratio comparison table', () => {
    const { unmount } = mount('goldenRatio');
    expect(document.body.textContent).toContain('黃金比例天賦如何計算？');
    expect(document.body.textContent).toContain('BMI 23.0');
    expect(document.body.textContent).toContain('BMI 19.5');
    expect(document.body.textContent).toContain('57% FFM');
    expect(document.body.textContent).toContain('55% FFM');
    expect(document.body.querySelector('table')).not.toBeNull();
    unmount();
  });

  it('invokes onClose from dismiss button', () => {
    const { onClose, unmount } = mount('somatotype');
    const dismiss = Array.from(document.body.querySelectorAll('button')).find(
      (btn) => btn.textContent === '了解'
    );
    expect(dismiss).toBeDefined();
    act(() => {
      dismiss?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });
});
