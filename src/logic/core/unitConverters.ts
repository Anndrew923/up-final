/**
 * Global unit conversion — metric storage, display-layer imperial.
 *
 * WHY: Persist kg/cm only so repeated UI toggles never compound floating-point drift.
 * Display values are always projected from metric; parse paths convert once back to metric.
 */

export type UnitSystem = 'metric' | 'imperial';

export type MetricQuantity = 'weight' | 'length';

/** Exact NIST-aligned factor used across training tools and profile forms. */
export const KG_TO_LB = 2.2046226218;

/** Exact inch-to-centimeter factor (1 in = 2.54 cm). */
export const IN_TO_CM = 2.54;

export type FormatUnitOptions = {
  /** Decimal places for the numeric portion (default 1 for weight, 1 for length). */
  digits?: number;
  /** Optional unit suffix (e.g. from i18n). When omitted, uses short codes kg/lb or cm/in. */
  unitLabel?: string;
  /** When false, returns only the numeric string. Default true. */
  includeUnit?: boolean;
};

function sanitizeNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** Math.max(0, digits);
  return Math.round(value * factor) / factor;
}

function trimNumericString(value: number, digits: number): string {
  return Number(roundTo(value, digits).toFixed(digits)).toString();
}

export function kgToLb(kg: number): number {
  return sanitizeNonNegative(kg) * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return sanitizeNonNegative(lb) / KG_TO_LB;
}

export function cmToIn(cm: number): number {
  return sanitizeNonNegative(cm) / IN_TO_CM;
}

export function inToCm(inches: number): number {
  return sanitizeNonNegative(inches) * IN_TO_CM;
}

/** Project stored kg into the active display system. */
export function toDisplayWeight(kg: number, system: UnitSystem): number {
  return system === 'metric' ? sanitizeNonNegative(kg) : kgToLb(kg);
}

/** Project stored cm into the active display system. */
export function toDisplayLength(cm: number, system: UnitSystem): number {
  return system === 'metric' ? sanitizeNonNegative(cm) : cmToIn(cm);
}

/**
 * Parse a UI input string/number into metric storage units.
 * Returns null for empty / non-finite / negative values (callers decide required vs optional).
 */
export function parseInputToMetric(
  inputValue: string | number,
  type: MetricQuantity,
  unitSystem: UnitSystem
): number | null {
  if (typeof inputValue === 'string' && inputValue.trim() === '') return null;
  const raw =
    typeof inputValue === 'number' ? inputValue : Number(String(inputValue).trim());
  if (!Number.isFinite(raw) || raw < 0) return null;

  if (type === 'weight') {
    return unitSystem === 'metric' ? raw : lbToKg(raw);
  }
  return unitSystem === 'metric' ? raw : inToCm(raw);
}

/** Format stored kg for controlled input fields under the active system. */
export function formatWeightInput(kg: number, system: UnitSystem, digits = 1): string {
  if (!Number.isFinite(kg) || kg < 0) return '';
  return trimNumericString(toDisplayWeight(kg, system), digits);
}

/** Format stored cm for controlled input fields under the active system. */
export function formatLengthInput(cm: number, system: UnitSystem, digits = 1): string {
  if (!Number.isFinite(cm) || cm < 0) return '';
  return trimNumericString(toDisplayLength(cm, system), digits);
}

/**
 * Re-project a display string when the user toggles unit systems mid-edit.
 * Empty input stays empty; invalid input is left unchanged to avoid surprising clears.
 */
export function reprojectDisplayInput(
  raw: string,
  type: MetricQuantity,
  from: UnitSystem,
  to: UnitSystem,
  digits = 1
): string {
  if (from === to) return raw;
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  const metric = parseInputToMetric(trimmed, type, from);
  if (metric === null) return raw;
  return type === 'weight'
    ? formatWeightInput(metric, to, digits)
    : formatLengthInput(metric, to, digits);
}

export function formatWeight(
  kgValue: number,
  unitSystem: UnitSystem,
  options: FormatUnitOptions = {}
): string {
  const digits = options.digits ?? 1;
  const includeUnit = options.includeUnit !== false;
  const display = toDisplayWeight(kgValue, unitSystem);
  const numeric = trimNumericString(display, digits);
  if (!includeUnit) return numeric;
  const unit = options.unitLabel ?? (unitSystem === 'metric' ? 'kg' : 'lb');
  return `${numeric} ${unit}`;
}

export function formatLength(
  cmValue: number,
  unitSystem: UnitSystem,
  options: FormatUnitOptions = {}
): string {
  const digits = options.digits ?? 1;
  const includeUnit = options.includeUnit !== false;
  const display = toDisplayLength(cmValue, unitSystem);
  const numeric = trimNumericString(display, digits);
  if (!includeUnit) return numeric;
  const unit = options.unitLabel ?? (unitSystem === 'metric' ? 'cm' : 'in');
  return `${numeric} ${unit}`;
}

/** Map global preference → training-tool mass unit (`kg` | `lb`). */
export function unitSystemToTrainingUnit(system: UnitSystem): 'kg' | 'lb' {
  return system === 'metric' ? 'kg' : 'lb';
}

export function trainingUnitToUnitSystem(unit: 'kg' | 'lb'): UnitSystem {
  return unit === 'kg' ? 'metric' : 'imperial';
}

/**
 * Snap metric values that round-trip from 1-decimal imperial display onto exact limits.
 * WHY: 120 cm → 47.2 in → 119.888 cm would otherwise fail PHYSICAL_LIMITS after a valid UI entry.
 */
export function snapNearMetricLimit(
  metricValue: number,
  limit: number,
  epsilon: number
): number {
  if (!Number.isFinite(metricValue) || !Number.isFinite(limit)) return metricValue;
  return Math.abs(metricValue - limit) <= epsilon ? limit : metricValue;
}
