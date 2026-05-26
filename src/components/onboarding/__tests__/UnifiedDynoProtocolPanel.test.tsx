/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import UnifiedDynoProtocolPanel from '../UnifiedDynoProtocolPanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('UnifiedDynoProtocolPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  it('renders resolved zh-Hant protocol copy (not raw i18n keys)', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(<UnifiedDynoProtocolPanel />);
    });

    const text = container.textContent ?? '';
    expect(text).toContain('統一測功');
    expect(text).toContain('力量');
    expect(text).not.toContain('onboarding.baseline.protocolTitle');
    expect(text).not.toContain('onboarding.baseline.features');
  });
});
