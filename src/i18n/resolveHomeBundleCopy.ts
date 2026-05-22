import type { TFunction } from 'i18next';

type HomeSection = 'resonance' | 'diagnostics' | 'overallGrade';

/**
 * Reads a string leaf under `home.{section}` from the common bundle.
 * WHY: Dotted keys like `home.resonance.reportTitle` can fail after HMR or stale merges;
 * `returnObjects: true` on the parent section matches the fix used for overallGrade tiers.
 */
export function resolveHomeSectionString(
  t: TFunction,
  section: HomeSection,
  field: string
): string {
  const sectionKey = `home.${section}`;
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

/** Resolves `home.resonance.phase.{phaseId}` with the same parent-object fallback. */
export function resolveHomeResonancePhase(t: TFunction, phaseId: string): string {
  const phaseKey = 'home.resonance.phase';
  const phaseObj: unknown = t(phaseKey, { returnObjects: true });

  if (typeof phaseObj === 'object' && phaseObj !== null) {
    const leaf = (phaseObj as Record<string, unknown>)[phaseId];
    if (typeof leaf === 'string' && leaf.trim().length > 0) {
      return leaf;
    }
  }

  const dotted = `${phaseKey}.${phaseId}`;
  const direct = t(dotted);
  return direct !== dotted ? direct : '';
}
