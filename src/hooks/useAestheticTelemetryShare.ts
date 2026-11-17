/**
 * Dual-mode aesthetic certificate export — carbon plaque vs selfie HUD preview + share.
 *
 * WHY: Modal stays presentational; this hook owns ImageBitmap / Object URL lifetimes so
 * WebView leaks cannot hide inside JSX event handlers. SelfieBlobStamp includes aspect,
 * reportType, leafKey, and contentHash so openWithLeaf remounts cannot share a stale PNG.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  readAestheticTelemetryAspectSession,
  writeAestheticTelemetryAspectSession,
} from '../lib/aestheticTelemetryAspectSession';
import { composeTelemetryReport } from '../lib/telemetryReportComposer';
import type { TelemetryCardAspectRatio } from '../lib/telemetryCardTypes';
import type { TelemetryReportInput } from '../lib/telemetryReportTypes';
import {
  buildPhysicalProfileHashKey,
  buildSingleLeafContentHash,
} from '../logic/aesthetic/singleLeafContentHash';
import {
  resolveSingleLeafReport,
  type SingleLeafId,
} from '../logic/aesthetic/singleLeafReport';
import { buildSixAxisRadarData, countCoreSixFilled } from '../logic/core/scoring';
import {
  captureSelfieImage,
  type SelfieCaptureSource,
} from '../services/selfieCaptureService';
import { shareTelemetryCardPng } from '../services/telemetryCardShareService';
import type { AestheticReportSelection } from '../stores/aestheticReportUiStore';
import { buildAestheticTelemetryExportInput } from './buildAestheticTelemetryExportInput';
import { buildAestheticSingleLeafExportInput } from './buildAestheticSingleLeafExportInput';
import { loadSingleLeafDraftBundle } from './loadSingleLeafDraftBundle';
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

/** Cache stamp — any field change must drop selfieBlobRef. */
export interface SelfieBlobStamp {
  aspect: AestheticTelemetryAspect;
  reportType: 'full' | 'single-leaf';
  leafKey: SingleLeafId | null;
  contentHash: string;
}

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
    writeAestheticTelemetryAspectSession(next);
    return;
  }
  aspectRef.current = next;
  setAspectRatio(next);
  writeAestheticTelemetryAspectSession(next);
}

function stampsEqual(a: SelfieBlobStamp | null, b: SelfieBlobStamp): boolean {
  if (!a) return false;
  return (
    a.aspect === b.aspect &&
    a.reportType === b.reportType &&
    a.leafKey === b.leafKey &&
    a.contentHash === b.contentHash
  );
}

export function useAestheticTelemetryShare(
  model: AestheticSpecCardModel,
  selection: AestheticReportSelection
) {
  const { t, i18n } = useTranslation('common');
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
  const selfieBlobStampRef = useRef<SelfieBlobStamp | null>(null);
  const aspectRef = useRef<AestheticTelemetryAspect>(aspectRatio);

  const draftBundle = useMemo(() => loadSingleLeafDraftBundle(scores), [scores]);

  const leafResult = useMemo(() => {
    if (selection.reportType !== 'single-leaf') return null;
    const resolved = resolveSingleLeafReport(selection.leaf, draftBundle);
    return resolved.status === 'ok' ? resolved : null;
  }, [draftBundle, selection]);

  const contentHash = useMemo(() => {
    if (selection.reportType === 'full') {
      // Fingerprint axis values so a same-overall edit still busts the selfie cache.
      const axisFp = buildSixAxisRadarData(scores)
        .map((p) => `${p.key}:${p.value.toFixed(2)}`)
        .join(',');
      return [
        'full',
        model.overallScore.toFixed(2),
        model.battleCode,
        countCoreSixFilled(scores),
        axisFp,
        i18n.language,
      ].join('|');
    }
    if (!leafResult) return `missing|${selection.leaf}|${i18n.language}`;
    return buildSingleLeafContentHash({
      leaf: leafResult.leaf,
      rawReading: leafResult.rawReading,
      heroScore: leafResult.heroScore,
      profileKey: buildPhysicalProfileHashKey(draftBundle.profile),
      locale: i18n.language,
    });
  }, [draftBundle.profile, i18n.language, leafResult, model.battleCode, model.overallScore, scores, selection]);

  const currentStamp = useMemo<SelfieBlobStamp>(
    () => ({
      aspect: aspectRatio,
      reportType: selection.reportType,
      leafKey: selection.reportType === 'single-leaf' ? selection.leaf : null,
      contentHash,
    }),
    [aspectRatio, contentHash, selection]
  );

  const revokePreviewUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = null;
    selfieBlobRef.current = null;
    selfieBlobStampRef.current = null;
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

  const buildReportInput = useCallback(
    (
      aspect: AestheticTelemetryAspect,
      reportMode: AestheticTelemetryMode,
      background: ImageBitmap | null
    ): TelemetryReportInput | null => {
      if (selection.reportType === 'single-leaf') {
        if (!leafResult) return null;
        return buildAestheticSingleLeafExportInput(t, leafResult, {
          mode: reportMode === 'selfie' && background ? 'selfie' : 'carbon',
          aspectRatio: aspect,
          background,
          uiLocale: i18n.language.toLowerCase().startsWith('en') ? 'en' : 'zh',
        });
      }
      const full = buildAestheticTelemetryExportInput(t, model, scores, {
        mode: reportMode === 'selfie' && background ? 'selfie' : 'carbon',
        background,
        aspectRatio: aspect,
      });
      return { ...full, reportType: 'full' };
    },
    [i18n.language, leafResult, model, scores, selection.reportType, t]
  );

  const composeSelfiePreview = useCallback(
    async (aspect: AestheticTelemetryAspect) => {
      const bitmap = bitmapRef.current;
      if (!bitmap) return;
      const input = buildReportInput(aspect, 'selfie', bitmap);
      if (!input) {
        setErrorKey('composeFailed');
        return;
      }
      const blob = await composeTelemetryReport(input);
      if (!aliveRef.current) return;
      revokePreviewUrl();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      selfieBlobRef.current = blob;
      selfieBlobStampRef.current = {
        aspect,
        reportType: selection.reportType,
        leafKey: selection.reportType === 'single-leaf' ? selection.leaf : null,
        contentHash,
      };
      setPreviewUrl(url);
      setMode('selfie');
    },
    [buildReportInput, contentHash, revokePreviewUrl, selection]
  );

  // WHY: One effect owns stamp invalidation + selfie recompose — dual effects raced
  // (clear preview → recompose) and could flash an empty stage on leaf flips.
  useEffect(() => {
    if (stampsEqual(selfieBlobStampRef.current, currentStamp) && (mode !== 'selfie' || previewUrl)) {
      return;
    }
    selfieBlobRef.current = null;
    selfieBlobStampRef.current = null;

    if (mode !== 'selfie' || !bitmapRef.current) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
        setPreviewUrl(null);
      }
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await composeSelfiePreview(aspectRef.current);
      } catch {
        if (!cancelled && aliveRef.current) setErrorKey('composeFailed');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stamp/content driven
  }, [currentStamp]);

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
        if (!beginBusy()) return;
        const previous = aspectRef.current;
        pinAspect(next, aspectRef, setAspectRatio);
        try {
          await composeSelfiePreview(next);
        } catch {
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
      selfieBlobRef.current = null;
      selfieBlobStampRef.current = null;
    },
    [beginBusy, composeSelfiePreview, endBusy, mode]
  );

  const shareReport = useCallback(async () => {
    if (!beginBusy()) return;
    try {
      const aspect = aspectRef.current;
      pinAspect(aspect, aspectRef, setAspectRatio);

      const stamp: SelfieBlobStamp = {
        aspect,
        reportType: selection.reportType,
        leafKey: selection.reportType === 'single-leaf' ? selection.leaf : null,
        contentHash,
      };

      const cacheHit =
        mode === 'selfie' &&
        Boolean(selfieBlobRef.current) &&
        stampsEqual(selfieBlobStampRef.current, stamp);

      let blob: Blob | null = cacheHit ? selfieBlobRef.current : null;

      if (!blob) {
        const input = buildReportInput(
          aspect,
          mode === 'selfie' && bitmapRef.current ? 'selfie' : 'carbon',
          mode === 'selfie' ? bitmapRef.current : null
        );
        if (!input) {
          if (aliveRef.current) setErrorKey('composeFailed');
          return;
        }
        blob = await composeTelemetryReport(input);
        if (!aliveRef.current) return;
        if (mode === 'selfie') {
          selfieBlobRef.current = blob;
          selfieBlobStampRef.current = stamp;
        }
      }

      const shared = await shareTelemetryCardPng({
        blob,
        title: t('aesthetic.share.shareTitle'),
      });
      if (!aliveRef.current) return;
      pinAspect(aspectRef.current, aspectRef, setAspectRatio);
      if (!shared.ok && shared.reason !== 'cancelled') {
        setErrorKey(mapShareError(shared.reason));
      }
    } catch {
      if (aliveRef.current) setErrorKey('composeFailed');
    } finally {
      endBusy();
    }
  }, [beginBusy, buildReportInput, contentHash, endBusy, mode, selection, t]);

  const errorMessage = errorKey ? t(`aesthetic.share.errors.${errorKey}`) : null;

  return {
    mode,
    aspectRatio,
    previewUrl,
    busy,
    errorMessage,
    leafResult,
    captureBackground,
    resetToCarbon,
    selectAspectRatio,
    shareReport,
  };
}
