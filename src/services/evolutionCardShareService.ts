/**
 * Evolution card share facade.
 *
 * WHY: Components must not call Capacitor Share / Web Share directly — reuse the
 * battle-report local PNG path so native vs web fallback stays one SSOT.
 */
import {
  shareTelemetryCardPng,
  type ShareTelemetryCardInput,
  type TelemetryShareResult,
} from './telemetryCardShareService';

export type EvolutionShareResult = TelemetryShareResult;

export function buildEvolutionCardFileName(now: number = Date.now()): string {
  return `ultimate-physique-evolution-${now}.png`;
}

export async function shareEvolutionCardPng(
  input: Omit<ShareTelemetryCardInput, 'fileName'> & { fileName?: string }
): Promise<EvolutionShareResult> {
  return shareTelemetryCardPng({
    ...input,
    fileName: input.fileName?.trim() || buildEvolutionCardFileName(),
    title: input.title?.trim() || 'ULTIMATE PHYSIQUE // EVOLUTION LOG',
  });
}
