import type { PhysicalProfileValidationErrorCode } from './physicalProfile';

/** Validation errors that only apply to fields inside the advanced disclosure panel. */
export const PHYSICAL_PROFILE_ADVANCED_ERRORS: ReadonlySet<PhysicalProfileValidationErrorCode> =
  new Set(['invalid-city', 'invalid-district']);

export function isPhysicalProfileAdvancedError(
  code: PhysicalProfileValidationErrorCode | null | undefined
): boolean {
  return code != null && PHYSICAL_PROFILE_ADVANCED_ERRORS.has(code);
}
