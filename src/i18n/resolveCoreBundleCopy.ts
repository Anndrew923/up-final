import type { TFunction } from 'i18next';

/**
 * Reads a string leaf under `identity` from the common bundle (core.json).
 * WHY: Same HMR / merge resilience as home.overallGrade tier resolution.
 */
export function resolveIdentityString(t: TFunction, field: string): string {
  const sectionKey = 'identity';
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
