/**
 * Shared aesthetic certificate copy resolution.
 * WHY: Card plaque and telemetry PNG export must resolve the same visual / force / kinetic lines.
 */
import type { TFunction } from 'i18next';
import type { DecadeBandId } from './aestheticTypes';

export function formatAestheticBfPct(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function resolveAestheticBandCopy(
  t: TFunction,
  kind: 'force' | 'kinetic',
  gender: 'male' | 'female' | null,
  id: DecadeBandId | null
): { title: string; subtitle: string } {
  const unmeasured = t('aesthetic.labels.unmeasured');
  if (!gender || id == null) return { title: unmeasured, subtitle: unmeasured };
  const sexKey = gender === 'female' ? 'f' : 'm';
  return {
    title: t(`aesthetic.${kind}.${sexKey}.${id}.title`),
    subtitle: t(`aesthetic.${kind}.${sexKey}.${id}.subtitle`),
  };
}

export function resolveAestheticVisualLine(
  t: TFunction,
  input: {
    visualSubtitle: string;
    unmeasured: boolean;
    bodyFatMissing: boolean;
    bodyFatPct: number | null;
  }
): string {
  if (input.unmeasured) return input.visualSubtitle;
  const note =
    input.bodyFatMissing || input.bodyFatPct == null
      ? t('aesthetic.labels.bodyFatMissing')
      : t('aesthetic.labels.bodyFatValue', { bf: formatAestheticBfPct(input.bodyFatPct) });
  return t('aesthetic.labels.visualLineWithNote', {
    subtitle: input.visualSubtitle,
    note,
  });
}
