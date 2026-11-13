/**
 * Dual-mode aesthetic certificate export — carbon plaque vs selfie HUD preview + share.
 *
 * WHY: Modal stays presentational; this hook owns ImageBitmap / Object URL lifetimes so
 * WebView leaks cannot hide inside JSX event handlers.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { composeTelemetryCard } from '../lib/telemetryCardComposer';
import {
  captureSelfieImage,
  type SelfieCaptureSource,
} from '../services/selfieCaptureService';
import { shareTelemetryCardPng } from '../services/telemetryCardShareService';
import { buildAestheticTelemetryExportInput } from './buildAestheticTelemetryExportInput';
import type { AestheticSpecCardModel } from './useAestheticSpecCard';
import { useMergedScoresFromLocalStores } from './useMergedScoresFromLocalStores';

export type AestheticTelemetryMode = 'carbon' | 'selfie';

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

export function useAestheticTelemetryShare(model: AestheticSpecCardModel) {
  const { t } = useTranslation('common');
  const scores = useMergedScoresFromLocalStores();
  const [mode, setMode] = useState<AestheticTelemetryMode>('carbon');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<AestheticTelemetryErrorKey | null>(null);

  const busyRef = useRef(false);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const selfieBlobRef = useRef<Blob | null>(null);

  const revokePreviewUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    selfieBlobRef.current = null;
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
    return () => {
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
    setBusy(false);
  }, []);

  const captureBackground = useCallback(
    async (source: SelfieCaptureSource) => {
      if (!beginBusy()) return;
      try {
        const captured = await captureSelfieImage({ source });
        if (!captured.ok) {
          if (captured.reason !== 'cancelled') {
            setErrorKey(mapCaptureError(captured.reason));
          }
          return;
        }

        closeBitmap();
        bitmapRef.current = captured.bitmap;

        try {
          const input = buildAestheticTelemetryExportInput(t, model, scores, {
            mode: 'selfie',
            background: captured.bitmap,
          });
          const blob = await composeTelemetryCard(input);

          revokePreviewUrl();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          selfieBlobRef.current = blob;
          setPreviewUrl(url);
          setMode('selfie');
        } catch {
          // Compose failed after decode — drop the orphan bitmap so carbon mode stays leak-free.
          closeBitmap();
          setErrorKey('composeFailed');
        }
      } catch {
        setErrorKey('composeFailed');
      } finally {
        endBusy();
      }
    },
    [beginBusy, closeBitmap, endBusy, model, revokePreviewUrl, scores, t]
  );

  const shareReport = useCallback(async () => {
    if (!beginBusy()) return;
    try {
      let blob: Blob | null =
        mode === 'selfie' && selfieBlobRef.current ? selfieBlobRef.current : null;

      if (!blob) {
        const input = buildAestheticTelemetryExportInput(t, model, scores, {
          mode: 'carbon',
          background: null,
        });
        blob = await composeTelemetryCard(input);
      }

      const shared = await shareTelemetryCardPng({
        blob,
        title: t('aesthetic.share.shareTitle'),
      });
      if (!shared.ok && shared.reason !== 'cancelled') {
        setErrorKey(mapShareError(shared.reason));
      }
    } catch {
      setErrorKey('composeFailed');
    } finally {
      endBusy();
    }
  }, [beginBusy, endBusy, mode, model, scores, t]);

  const errorMessage = errorKey ? t(`aesthetic.share.errors.${errorKey}`) : null;

  return {
    mode,
    previewUrl,
    busy,
    errorMessage,
    captureBackground,
    resetToCarbon,
    shareReport,
  };
}
