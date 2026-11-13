/**
 * Canvas contracts for the offline telemetry card.
 * WHY: Shared by selfie chrome/radar painters and the carbon certificate without a circular import.
 */
import type { TelemetryBackgroundSource } from './telemetryCardCover';

export interface TelemetryGradient {
  addColorStop(offset: number, color: string): void;
}

/**
 * Minimal 2D surface the painter needs. Production passes a real canvas context;
 * tests pass a recording double. Kept narrow so a mock cannot drift into DOM screenshot libs.
 */
export interface TelemetryDrawContext {
  fillStyle: string | TelemetryGradient;
  strokeStyle: string | TelemetryGradient;
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  lineCap: CanvasLineCap;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  /** Optional; used for wide-tracked stamp engraving when the runtime supports it. */
  letterSpacing?: string;
  /** Soft drop shadow for HUD text on bright selfie backgrounds. */
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  stroke(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  measureText(text: string): { width: number };
  clip(): void;
  rect(x: number, y: number, w: number, h: number): void;
  drawImage(
    image: TelemetryBackgroundSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): TelemetryGradient;
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): TelemetryGradient;
  setLineDash(segments: number[]): void;
}

export interface TelemetryCanvasSurface {
  width: number;
  height: number;
  getContext(contextId: '2d'): TelemetryDrawContext | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string): void;
}

export type TelemetryComposeErrorCode = 'no-document' | 'no-context' | 'encode-failed';

export class TelemetryComposeError extends Error {
  readonly code: TelemetryComposeErrorCode;

  constructor(code: TelemetryComposeErrorCode) {
    super(code);
    this.name = 'TelemetryComposeError';
    this.code = code;
  }
}
