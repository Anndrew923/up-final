/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import type { AestheticSpecCardModel } from '../../../hooks/useAestheticSpecCard';
import AestheticSpecModal from '../AestheticSpecModal';
import { CERT_STAGE_WRAP_CLASS } from '../aestheticChrome';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const fixture: AestheticSpecCardModel = {
  overallScore: 69.06,
  battleCode: 'UP-Bruce #1234',
  gender: 'male',
  bodyFatPct: 8,
  spec: {
    overallTitleId: 'health',
    visual: { id: 'assassin', score: 88.3, unmeasured: false, bodyFatMissing: false },
    force: { id: '80', score: 85, unmeasured: false },
    kinetic: { id: '70', score: 72, unmeasured: false },
    hasTitanGrip: false,
    peakKg: null,
  },
};

const composeTelemetryCard = vi.fn();
const shareTelemetryCardPng = vi.fn();
const captureSelfieImage = vi.fn();

vi.mock('../../../lib/motionPreference', () => ({
  prefersReducedMotion: () => false,
}));

vi.mock('../../../hooks/useAestheticSpecCard', () => ({
  useAestheticSpecCard: () => fixture,
}));

vi.mock('../../../hooks/useMergedScoresFromLocalStores', () => ({
  useMergedScoresFromLocalStores: () => ({
    strength: 70,
    explosivePower: 65,
    cardio: 60,
    muscleMass: 68,
    bodyFat: 72,
    gripStrength: 55,
  }),
}));

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => undefined,
}));

vi.mock('../../../hooks/useShellScrollLock', () => ({
  useShellScrollLock: () => undefined,
}));

vi.mock('../../../lib/telemetryCardComposer', () => ({
  composeTelemetryCard: (...args: unknown[]) => composeTelemetryCard(...args),
}));

vi.mock('../../../services/telemetryCardShareService', () => ({
  shareTelemetryCardPng: (...args: unknown[]) => shareTelemetryCardPng(...args),
}));

vi.mock('../../../services/selfieCaptureService', () => ({
  captureSelfieImage: (...args: unknown[]) => captureSelfieImage(...args),
}));

describe('AestheticSpecModal certificate shell', () => {
  let container: HTMLDivElement;
  let root: Root;
  const createObjectURL = vi.fn(() => 'blob:aesthetic-preview');
  const revokeObjectURL = vi.fn();

  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    composeTelemetryCard.mockReset();
    shareTelemetryCardPng.mockReset();
    captureSelfieImage.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    composeTelemetryCard.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    shareTelemetryCardPng.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('keeps close outside the plaque and never scrolls the 9:16 stage', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    const card = document.querySelector('[data-testid="aesthetic-spec-card"]');
    expect(card).not.toBeNull();
    expect(card?.querySelector('button')).toBeNull();

    expect(document.querySelector('[data-testid="aesthetic-share-report"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="aesthetic-selfie-camera"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="aesthetic-selfie-photos"]')).not.toBeNull();

    const close = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === '關閉名片'
    );
    expect(close).toBeDefined();
    expect(card?.contains(close ?? null)).toBe(false);

    const wrap = card?.parentElement;
    expect(wrap?.className).toBe(CERT_STAGE_WRAP_CLASS);
    expect(wrap?.className).not.toContain('overflow-y');
    expect(document.body.innerHTML).toContain('h-dvh');
    expect(document.body.innerHTML).toContain('ui-modal-safe-footer');

    act(() => {
      close?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('skips the cascade on first backdrop tap and closes on the second', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    const shell = document.querySelector('[data-cert-phase]');
    const dialog = document.querySelector('[role="dialog"]');
    expect(shell?.getAttribute('data-cert-phase')).toBe('revealing');
    expect(dialog?.getAttribute('aria-busy')).toBe('true');

    const backdrop = document.querySelector<HTMLButtonElement>(
      '[aria-label="關閉生理規格證書"]'
    );
    expect(backdrop).not.toBeNull();

    act(() => {
      backdrop?.click();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(shell?.getAttribute('data-cert-phase')).toBe('done');
    expect(dialog?.getAttribute('aria-busy')).toBe('false');

    act(() => {
      backdrop?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes immediately from the plaque-close button during revealing', () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    expect(document.querySelector('[data-cert-phase]')?.getAttribute('data-cert-phase')).toBe(
      'revealing'
    );

    const close = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === '關閉名片'
    );
    act(() => {
      close?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shares a carbon telemetry plate from the default mode', async () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    const shareBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="aesthetic-share-report"]'
    );
    await act(async () => {
      shareBtn?.click();
    });

    expect(composeTelemetryCard).toHaveBeenCalledTimes(1);
    expect(composeTelemetryCard.mock.calls[0]?.[0]).toMatchObject({
      mode: 'carbon',
      battleCode: 'UP-Bruce #1234',
      overallScore: 69.06,
    });
    expect(shareTelemetryCardPng).toHaveBeenCalledTimes(1);
    expect(shareTelemetryCardPng.mock.calls[0]?.[0]?.blob).toBeInstanceOf(Blob);
  });

  it('switches to selfie preview and closes the ImageBitmap on unmount', async () => {
    const close = vi.fn();
    const bitmap = {
      width: 1080,
      height: 1920,
      close,
    } as unknown as ImageBitmap;
    captureSelfieImage.mockResolvedValue({ ok: true, bitmap });
    composeTelemetryCard.mockResolvedValue(new Blob(['selfie-png'], { type: 'image/png' }));

    const onClose = vi.fn();
    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={onClose} />
        </I18nextProvider>
      );
    });

    const photosBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="aesthetic-selfie-photos"]'
    );
    await act(async () => {
      photosBtn?.click();
    });

    expect(captureSelfieImage).toHaveBeenCalledWith({ source: 'photos' });
    expect(composeTelemetryCard).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'selfie',
        background: bitmap,
      })
    );
    expect(createObjectURL).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="aesthetic-spec-card"]')).toBeNull();
    const preview = document.querySelector<HTMLImageElement>(
      '[data-testid="aesthetic-telemetry-preview"]'
    );
    expect(preview?.getAttribute('src')).toBe('blob:aesthetic-preview');
    expect(document.querySelector('[data-testid="aesthetic-restore-carbon"]')).not.toBeNull();
    expect(document.querySelector('[data-telemetry-mode="selfie"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:aesthetic-preview');
  });

  it('restores the carbon plaque and releases selfie resources', async () => {
    const close = vi.fn();
    const bitmap = {
      width: 1080,
      height: 1920,
      close,
    } as unknown as ImageBitmap;
    captureSelfieImage.mockResolvedValue({ ok: true, bitmap });
    composeTelemetryCard.mockResolvedValue(new Blob(['selfie-png'], { type: 'image/png' }));

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={vi.fn()} />
        </I18nextProvider>
      );
    });

    await act(async () => {
      document.querySelector<HTMLButtonElement>('[data-testid="aesthetic-selfie-camera"]')?.click();
    });
    expect(document.querySelector('[data-testid="aesthetic-telemetry-preview"]')).not.toBeNull();

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="aesthetic-restore-carbon"]')?.click();
    });

    expect(document.querySelector('[data-testid="aesthetic-spec-card"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="aesthetic-telemetry-preview"]')).toBeNull();
    expect(close).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:aesthetic-preview');
  });

  it('stays silent when selfie capture is cancelled', async () => {
    captureSelfieImage.mockResolvedValue({ ok: false, reason: 'cancelled' });

    act(() => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <AestheticSpecModal onClose={vi.fn()} />
        </I18nextProvider>
      );
    });

    await act(async () => {
      document.querySelector<HTMLButtonElement>('[data-testid="aesthetic-selfie-photos"]')?.click();
    });

    expect(document.querySelector('[data-testid="aesthetic-telemetry-error"]')).toBeNull();
    expect(document.querySelector('[data-testid="aesthetic-spec-card"]')).not.toBeNull();
    expect(composeTelemetryCard).not.toHaveBeenCalled();
  });
});
