/**
 * Report-type dispatcher for offline share plates.
 *
 * WHY: `telemetryCardComposer` stays locked at ≤490 lines / full-axis only.
 * This module routes `full` → existing composer and dual-hero → leaf painter.
 */
import { composeTelemetryCard, type TelemetryComposeDeps } from './telemetryCardComposer';
import {
  ensureTelemetrySerifFontsReady,
} from './telemetryCardFonts';
import { resolveTelemetryCardSize } from './telemetryCardBackground';
import { paintSingleLeafReport } from './telemetrySingleLeafPainter';
import {
  TelemetryComposeError,
  type TelemetryCanvasSurface,
  type TelemetryDrawContext,
} from './telemetryCardTypes';
import {
  isDualHeroReportInput,
  type TelemetryDualHeroCardInput,
  type TelemetryReportInput,
} from './telemetryReportTypes';

function createDomSurface(): TelemetryCanvasSurface {
  if (typeof document === 'undefined') {
    throw new TelemetryComposeError('no-document');
  }
  const canvas = document.createElement('canvas');
  return {
    get width() {
      return canvas.width;
    },
    set width(value: number) {
      canvas.width = value;
    },
    get height() {
      return canvas.height;
    },
    set height(value: number) {
      canvas.height = value;
    },
    getContext: () => canvas.getContext('2d') as TelemetryDrawContext | null,
    toBlob: (callback, type) => {
      canvas.toBlob((blob) => callback(blob), type ?? 'image/png');
    },
  };
}

function surfaceToPngBlob(surface: TelemetryCanvasSurface): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      surface.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new TelemetryComposeError('encode-failed'));
      }, 'image/png');
    } catch (error) {
      reject(
        error instanceof TelemetryComposeError
          ? error
          : new TelemetryComposeError('encode-failed')
      );
    }
  });
}

async function composeDualHeroTelemetryCard(
  input: TelemetryDualHeroCardInput,
  deps?: TelemetryComposeDeps
): Promise<Blob> {
  await ensureTelemetrySerifFontsReady();

  const plate = resolveTelemetryCardSize(input.aspectRatio);
  const surface = (deps?.createSurface ?? createDomSurface)();
  surface.width = plate.pixelWidth;
  surface.height = plate.pixelHeight;
  const ctx = surface.getContext('2d');
  if (!ctx) throw new TelemetryComposeError('no-context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(plate.exportScale, plate.exportScale);

  paintSingleLeafReport(ctx, input);
  return surfaceToPngBlob(surface);
}

/** Compose full six-axis or dual-hero PNG. Never touches Firestore. */
export async function composeTelemetryReport(
  input: TelemetryReportInput,
  deps?: TelemetryComposeDeps
): Promise<Blob> {
  if (isDualHeroReportInput(input)) {
    return composeDualHeroTelemetryCard(input, deps);
  }
  const { reportType: _reportType, ...cardInput } = input;
  void _reportType;
  return composeTelemetryCard(cardInput, deps);
}

export type { TelemetryReportInput, TelemetryDualHeroCardInput, TelemetrySingleLeafCardInput } from './telemetryReportTypes';
export type { TelemetryFullReportInput } from './telemetryReportTypes';
