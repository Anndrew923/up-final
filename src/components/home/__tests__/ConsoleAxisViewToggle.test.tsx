/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import { ConsoleAxisViewToggle } from '../ConsoleAxisViewToggle';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('ConsoleAxisViewToggle', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderToggle(
    value: 'fitness' | 'telemetry',
    onChange = vi.fn()
  ): { onChange: ReturnType<typeof vi.fn> } {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <ConsoleAxisViewToggle value={value} onChange={onChange} />
        </I18nextProvider>
      );
    });
    return { onChange };
  }

  it('renders fitness/telemetry pills with pressed state', () => {
    renderToggle('fitness');
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1]?.getAttribute('aria-pressed')).toBe('false');
    expect(container.textContent).toContain('體能');
    expect(container.textContent).toContain('遙測');
  });

  it('emits onChange only when selecting the other mode', () => {
    const { onChange } = renderToggle('fitness');
    const buttons = container.querySelectorAll('button');
    act(() => {
      buttons[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      buttons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('telemetry');
  });
});
