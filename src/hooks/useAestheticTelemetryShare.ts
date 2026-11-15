/**
 * Dual-mode aesthetic certificate export — carbon plaque vs selfie HUD preview + share.
 *
 * WHY: Modal stays presentational; this hook owns ImageBitmap / Object URL lifetimes so
 * WebView leaks cannot hide inside JSX event handlers.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  readAestheticTelemetryAspectSession,
  writeAestheticTelemetryAspectSession,
} from '../lib/aestheticTelemetryAspectSession';
import { composeTelemetryCard } from '../lib/telemetryCardComposer';
import type { TelemetryCardAspectRatio } from '../lib/telemetryCardTypes';
import {
  captureSelfieImage,
  type SelfieCaptureSource,
} from '../services/selfieCaptureService';
import { shareTelemetryCardPng } from '../services/telemetryCardShareService';
import { buildAestheticTelemetryExportInput } from './buildAestheticTelemetryExportInput';
import type { AestheticSpecCardModel } from './useAestheticSpecCard';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';

export type AestheticTelemetryMode = 'carbon' | 'selfie';
export type AestheticTelemetryAspect = TelemetryCardAspectRatio;

export type AestheticTelemetryErrorKey =
  | 'captureUnavailable'
  | 'captureFailed'
  | 'composeFailed'
  | 'shareUnavailable'
  | 'shareFailed';

function mapCaptureError(
  reason: 'unavailable' | 'decode-failed'
): AestheticTelemetryErrorKey {
  return reason === 'unavailable' ? 'captureUnavailable' : 'captureFailed';
}

function mapShareError(
  reason: 'unavailable' | 'write-failed' | 'share-failed'
): AestheticTelemetryErrorKey {
  return reason === 'unavailable' ? 'shareUnavailable' : 'shareFailed';
}

function pinAspect(
  next: AestheticTelemetryAspect,
  aspectRef: { current: AestheticTelemetryAspect },
  setAspectRatio: (value: AestheticTelemetryAspect) => void
): void {
  if (aspectRef.current === next) {
    // Still refresh session so a remount mid-share recovers the user's choice.
    writeAestheticTelemetryAspectSession(next);
    return;
  }
  aspectRef.current = next;
  setAspectRatio(next);
  writeAestheticTelemetryAspectSession(next);
}

export function useAestheticTelemetryShare(model: AestheticSpecCardModel) {
  const { t } = useTranslation('common');
  const scores = useMergedScoresFromLocalStores();
  const [mode, setMode] = useState<AestheticTelemetryMode>('carbon');
  const [aspectRatio, setAspectRatio] = useState<AestheticTelemetryAspect>(() =>
    readAestheticTelemetryAspectSession()
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<AestheticTelemetryErrorKey | null>(null);

  const busyRef = useRef(false);
  const aliveRef = useRef(true);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const selfieBlobRef = useRef<Blob | null>(null);
  /** Bound aspect for selfieBlobRef — share must never emit a mismatched cache. */
  const selfieBlobAspectRef = useRef<AestheticTelemetryAspect | null>(null);
  const aspectRef = useRef<AestheticTelemetryAspect>(aspectRatio);

  const revokePreviewUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = null;
    selfieBlobRef.current = null;
    selfieBlobAspectRef.current = null;
    setPreviewUrl(null);
  }, []);

  const closeBitmap = useCallback(() => {
    if (bitmapRef.current) {
      try {
        bitmapRef.current.close();
      } catch {
        /* already closed */
      }
      bitmapRef.current = null;
    }
  }, []);

  const resetToCarbon = useCallback(() => {
    revokePreviewUrl();
    closeBitmap();
    setMode('carbon');
    setErrorKey(null);
  }, [closeBitmap, revokePreviewUrl]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      revokePreviewUrl();
      closeBitmap();
    };
  }, [closeBitmap, revokePreviewUrl]);

  const beginBusy = useCallback(() => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setErrorKey(null);
    return true;
  }, []);

  const endBusy = useCallback(() => {
    busyRef.current = false;
    if (aliveRef.current) setBusy(false);
  }, []);

  const composeSelfiePreview = useCallback(
    async (aspect: AestheticTelemetryAspect) => {
      const bitmap = bitmapRef.current;
      if (!bitmap) return;
      const input = buildAestheticTelemetryExportInput(t, model, scores, {
        mode: 'selfie',
        background: bitmap,
        aspectRatio: aspect,
      });
      const blob = await composeTelemetryCard(input);
      if (!aliveRef.current) return;
      revokePreviewUrl();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      selfieBlobRef.current = blob;
      selfieBlobAspectRef.current = aspect;
      setPreviewUrl(url);
      setMode('selfie');
    },
    [model, revokePreviewUrl, scores, t]
  );

  const captureBackground = useCallback(
    async (source: SelfieCaptureSource) => {
      if (!beginBusy()) return;
      try {
        const captured = await captureSelfieImage({ source });
        if (!aliveRef.current) return;
        if (!captured.ok) {
          if (captured.reason !== 'cancelled') {
            setErrorKey(mapCaptureError(captured.reason));
          }
          return;
        }

        closeBitmap();
        bitmapRef.current = captured.bitmap;

        try {
          await composeSelfiePreview(aspectRef.current);
        } catch {
          // Compose failed after decode — drop the orphan bitmap so carbon mode stays leak-free.
          closeBitmap();
          if (aliveRef.current) setErrorKey('composeFailed');
        }
      } catch {
        if (aliveRef.current) setErrorKey('composeFailed');
      } finally {
        endBusy();
      }
    },
    [beginBusy, closeBitmap, composeSelfiePreview, endBusy]
  );

  const selectAspectRatio = useCallback(
    async (next: AestheticTelemetryAspect) => {
      if (next === aspectRef.current) return;

      const needsSelfieRecompose = mode === 'selfie' && Boolean(bitmapRef.current);
      if (needsSelfieRecompose) {
        // WHY: Flip aspect only after we can recompose — otherwise the pill can show 4:5
        // while share still emits the cached 9:16 selfie PNG (or vice versa).
        if (!beginBusy()) return;
        const previous = aspectRef.current;
        pinAspect(next, aspectRef, setAspectRatio);
        try {
          await composeSelfiePreview(next);
        } catch {
          // WHY: Roll back pill + session so a failed 4:5 compose cannot leave preview on 9:16.
          if (aliveRef.current) {
            pinAspect(previous, aspectRef, setAspectRatio);
            setErrorKey('composeFailed');
          }
        } finally {
          endBusy();
        }
        return;
      }

      pinAspect(next, aspectRef, setAspectRatio);
      // Carbon (or selfie without bitmap): drop any stale export cache immediately.
      selfieBlobRef.current = null;
      selfieBlobAspectRef.current = null;
    },
    [beginBusy, composeSelfiePreview, endBusy, mode]
  );

  const shareReport = useCallback(async () => {
    if (!beginBusy()) return;
    try {
      // WHY: Re-pin before native Share — sheet open/close must not leave React state at 9:16
      // while aspectRef / session still hold the user's 4:5 choice.
      const aspect = aspectRef.current;
      pinAspect(aspect, aspectRef, setAspectRatio);

      const cacheHit =
        mode === 'selfie' &&
        Boolean(selfieBlobRef.current) &&
        selfieBlobAspectRef.current === aspect;

      let blob: Blob | null = cacheHit ? selfieBlobRef.current : null;

      if (!blob) {
        const input = buildAestheticTelemetryExportInput(t, model, scores, {
          mode: mode === 'selfie' && bitmapRef.current ? 'selfie' : 'carbon',
          background: mode === 'selfie' ? bitmapRef.current : null,
          aspectRatio: aspect,
        });
        blob = await composeTelemetryCard(input);
        if (!aliveRef.current) return;
        if (mode === 'selfie') {
          selfieBlobRef.current = blob;
          selfieBlobAspectRef.current = aspect;
        }
      }

      const shared = await shareTelemetryCardPng({
        blob,
        title: t('aesthetic.share.shareTitle'),
      });
      if (!aliveRef.current) return;
      // WHY: Native sheet can remount the modal; re-assert aspect after it returns.
      pinAspect(aspectRef.current, aspectRef, setAspectRatio);
      if (!shared.ok && shared.reason !== 'cancelled') {
        setErrorKey(mapShareError(shared.reason));
      }
    } catch {
      if (aliveRef.current) setErrorKey('composeFailed');
    } finally {
      endBusy();
    }
  }, [beginBusy, endBusy, mode, model, scores, t]);

  const errorMessage = errorKey ? t(`aesthetic.share.errors.${errorKey}`) : null;

  return {
    mode,
    aspectRatio,
    previewUrl,
    busy,
    errorMessage,
    captureBackground,
    resetToCarbon,
    selectAspectRatio,
    shareReport,
  };
}
