/* @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { Run5KmSpecReferencePanel } from '../Run5KmSpecReferencePanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderWithI18n(node: ReactNode): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);
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
  document.body.innerHTML = '';
});

describe('Run5KmSpecReferencePanel', () => {
  it('renders Scheme C anchors from scoring clock constants (zh-Hant)', async () => {
    await i18n.changeLanguage('zh-Hant');
    const { container, unmount } = renderWithI18n(<Run5KmSpecReferencePanel />);
    const text = container.textContent ?? '';

    expect(text).toContain('20:00');
    expect(text).toContain('45:00');
    expect(text).toContain('22:30');
    expect(text).toContain('50:00');
    expect(text).toContain('12:20');
    expect(text).toContain('13:40');
    expect(text).toMatch(/成績僅供個人紀錄與天梯排行/);
    expect(text).toMatch(/評測基準|突破加分|成績天花板/);
    expect(container.querySelector('[role="note"]')).toBeTruthy();

    unmount();
  });
});
