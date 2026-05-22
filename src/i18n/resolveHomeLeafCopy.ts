import type { TFunction } from 'i18next';

/**
 * Reads a top-level string under `home` (e.g. `home.overallAverage`).
 */
export function resolveHomeLeafString(t: TFunction, field: string): string {
  const sectionKey = 'home';
  const sectionObj: unknown = t(sectionKey, { returnObjects: true });

  if (typeof sectionObj === 'object' && sectionObj !== null) {
    const leaf = (sectionObj as Record<string, unknown>)[field];
    if (typeof leaf === 'string' && leaf.trim().length > 0 && leaf !== `${sectionKey}.${field}`) {
      return leaf;
    }
  }

  const dotted = `${sectionKey}.${field}`;
  const direct = t(dotted);
  return direct !== dotted ? direct : '';
}
