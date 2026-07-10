import type { SixAxisMetric } from '../../types/scoring';

export type DynoIntelSuggestionId = 'overall' | 'axis' | 'methodology';

export interface DynoIntelSuggestionItem {
  id: DynoIntelSuggestionId;
  label: string;
  query: string;
}

export function resolveDynoIntelAxisSuggestionQuery(
  axis: SixAxisMetric,
  queryTemplate: string,
  resolveAxisLabel: (axis: SixAxisMetric) => string
): string {
  const axisLabel = resolveAxisLabel(axis);
  return queryTemplate.replace('{{axisLabel}}', axisLabel);
}

/**
 * Ordered onboarding chips — axis chip omitted when weakest axis is unavailable.
 */
export function buildDynoIntelSuggestions(input: {
  overallLabel: string;
  overallQuery: string;
  axisLabel: string;
  axisQuery: string | null;
  methodologyLabel: string;
  methodologyQuery: string;
}): DynoIntelSuggestionItem[] {
  const items: DynoIntelSuggestionItem[] = [
    { id: 'overall', label: input.overallLabel, query: input.overallQuery },
  ];
  if (input.axisQuery) {
    items.push({ id: 'axis', label: input.axisLabel, query: input.axisQuery });
  }
  items.push({
    id: 'methodology',
    label: input.methodologyLabel,
    query: input.methodologyQuery,
  });
  return items;
}
