import type { TFunction } from 'i18next';

type HomeSection = 'resonance' | 'diagnostics' | 'overallGrade';

export type HomeFormSubsection = 'profile' | 'ladderIdentity';

function isUnresolvedI18nKey(value: string, dotted: string): boolean {
  return value === dotted;
}

/** Last-resort when i18next cannot interpolate after HMR (template still in bundle). */
function applyInterpolationTemplate(
  template: string,
  values: Record<string, unknown>
): string {
  return Object.entries(values).reduce((acc, [key, val]) => {
    const token = `{{${key}}}`;
    return acc.split(token).join(String(val ?? ''));
  }, template);
}

function resolveHomeLeafString(
  t: TFunction,
  sectionKey: string,
  field: string,
  options?: { ns?: string; interpolation?: Record<string, unknown> }
): string {
  const ns = options?.ns ?? 'common';
  const interpolation = options?.interpolation;
  const dotted = `${sectionKey}.${field}`;
  const sectionObj: unknown = t(sectionKey, { returnObjects: true, ns });

  let templateFromObject: string | undefined;
  if (typeof sectionObj === 'object' && sectionObj !== null) {
    const leaf = (sectionObj as Record<string, unknown>)[field];
    if (typeof leaf === 'string' && leaf.trim().length > 0 && leaf !== dotted) {
      templateFromObject = leaf;
    }
  }

  if (interpolation) {
    const direct = t(dotted, { ns, defaultValue: templateFromObject, ...interpolation });
    if (!isUnresolvedI18nKey(direct, dotted) && !direct.includes('{{')) return direct;
    if (templateFromObject) return applyInterpolationTemplate(templateFromObject, interpolation);
    return '';
  }

  if (templateFromObject) return templateFromObject;

  const direct = t(dotted, { ns });
  return !isUnresolvedI18nKey(direct, dotted) ? direct : '';
}

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
  return resolveHomeLeafString(t, `home.${section}`, field);
}

/**
 * Reads a string leaf under `home.profile` or `home.ladderIdentity`.
 * WHY: New home form keys can surface as raw dotted paths after locale HMR until a full reload.
 */
export function resolveHomeSubsectionString(
  t: TFunction,
  subsection: HomeFormSubsection,
  field: string,
  interpolation?: Record<string, unknown>
): string {
  return resolveHomeLeafString(t, `home.${subsection}`, field, { interpolation });
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
