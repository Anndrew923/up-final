import { useCallback, useMemo, useState } from 'react';
import {
  getDefaultProjectForDivision,
  getProjectOptionsForDivision,
  LADDER_PROJECT_NONE,
} from '../logic/core/ladderShards';
import type { LadderFilterValues } from '../types/ladderFilters';

export interface UseLadderFiltersDraftOptions {
  initialApplied?: Partial<LadderFilterValues>;
  onAppliedChange?: (next: LadderFilterValues) => void;
}

export interface UseLadderFiltersDraftResult {
  applied: LadderFilterValues;
  draft: LadderFilterValues;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  hasUnappliedChanges: boolean;
  activeAppliedFilterCount: number;
  draftProjectControlValue: string;
  appliedProjectControlValue: string;
  setDraftDivision: (next: LadderFilterValues['division']) => void;
  setDraftProject: (next: string) => void;
  setDraftGender: (next: LadderFilterValues['gender']) => void;
  setDraftAgeBucket: (next: LadderFilterValues['ageBucket']) => void;
  setDraftHeightBucket: (next: LadderFilterValues['heightBucket']) => void;
  setDraftWeightBucket: (next: LadderFilterValues['weightBucket']) => void;
  setDraftJobCategory: (next: LadderFilterValues['jobCategory']) => void;
  setDraftCountryCode: (next: LadderFilterValues['countryCode']) => void;
  setDraftCity: (next: LadderFilterValues['city']) => void;
  setDraftDistrict: (next: LadderFilterValues['district']) => void;
  clearDraftFilters: () => void;
  applyDraft: () => void;
}

const DEFAULT_VALUES: LadderFilterValues = {
  division: 'ladderScore',
  filterProject: getDefaultProjectForDivision('ladderScore'),
  gender: 'all',
  ageBucket: 'all',
  heightBucket: 'all',
  weightBucket: 'all',
  jobCategory: 'all',
  countryCode: 'all',
  city: 'all',
  district: 'all',
};

function resolveProjectForDivision(
  division: LadderFilterValues['division'],
  project: string
): string {
  const options = getProjectOptionsForDivision(division).map((o) => o.value);
  if (!options.length) return project;
  const defaultProject = getDefaultProjectForDivision(division);
  const candidate = project && project !== LADDER_PROJECT_NONE ? project : defaultProject;
  if (options.includes(candidate)) return candidate;
  return options[0]!;
}

function normalizeDraft(input: LadderFilterValues): LadderFilterValues {
  return {
    ...input,
    filterProject: resolveProjectForDivision(input.division, input.filterProject),
    city: input.countryCode === 'all' ? 'all' : input.city,
    district: input.countryCode === 'all' ? 'all' : input.district,
  };
}

function isSameFilterValues(a: LadderFilterValues, b: LadderFilterValues): boolean {
  return (
    a.division === b.division &&
    a.filterProject === b.filterProject &&
    a.gender === b.gender &&
    a.ageBucket === b.ageBucket &&
    a.heightBucket === b.heightBucket &&
    a.weightBucket === b.weightBucket &&
    a.jobCategory === b.jobCategory &&
    a.countryCode === b.countryCode &&
    a.city === b.city &&
    a.district === b.district
  );
}

export function useLadderFiltersDraft(
  options: UseLadderFiltersDraftOptions = {}
): UseLadderFiltersDraftResult {
  const onAppliedChange = options.onAppliedChange;
  const initialApplied: LadderFilterValues = normalizeDraft({
    ...DEFAULT_VALUES,
    ...options.initialApplied,
  });
  const [applied, setApplied] = useState<LadderFilterValues>(initialApplied);
  const [draft, setDraft] = useState<LadderFilterValues>(initialApplied);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = useCallback(() => {
    setDraft(applied);
    setSheetOpen(true);
  }, [applied]);

  const closeSheet = useCallback(() => {
    setDraft(applied);
    setSheetOpen(false);
  }, [applied]);

  const setDraftDivision = useCallback((next: LadderFilterValues['division']) => {
    setDraft((prev) => ({
      ...prev,
      division: next,
      filterProject: getDefaultProjectForDivision(next),
    }));
  }, []);

  const setDraftProject = useCallback((next: string) => {
    setDraft((prev) => ({
      ...prev,
      filterProject: next === '' ? getDefaultProjectForDivision(prev.division) : next,
    }));
  }, []);

  const setDraftGender = useCallback((next: LadderFilterValues['gender']) => {
    setDraft((prev) => ({ ...prev, gender: next }));
  }, []);
  const setDraftAgeBucket = useCallback((next: LadderFilterValues['ageBucket']) => {
    setDraft((prev) => ({ ...prev, ageBucket: next }));
  }, []);
  const setDraftHeightBucket = useCallback((next: LadderFilterValues['heightBucket']) => {
    setDraft((prev) => ({ ...prev, heightBucket: next }));
  }, []);
  const setDraftWeightBucket = useCallback((next: LadderFilterValues['weightBucket']) => {
    setDraft((prev) => ({ ...prev, weightBucket: next }));
  }, []);
  const setDraftJobCategory = useCallback((next: LadderFilterValues['jobCategory']) => {
    setDraft((prev) => ({ ...prev, jobCategory: next }));
  }, []);
  const setDraftCountryCode = useCallback((next: LadderFilterValues['countryCode']) => {
    setDraft((prev) => ({
      ...prev,
      countryCode: next,
      city: 'all',
      district: 'all',
    }));
  }, []);
  const setDraftCity = useCallback((next: LadderFilterValues['city']) => {
    setDraft((prev) => ({
      ...prev,
      city: next,
      district: 'all',
    }));
  }, []);
  const setDraftDistrict = useCallback((next: LadderFilterValues['district']) => {
    setDraft((prev) => ({ ...prev, district: next }));
  }, []);

  const clearDraftFilters = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      gender: 'all',
      ageBucket: 'all',
      heightBucket: 'all',
      weightBucket: 'all',
      jobCategory: 'all',
      countryCode: 'all',
      city: 'all',
      district: 'all',
    }));
  }, []);

  const applyDraft = useCallback(() => {
    const nextApplied = normalizeDraft(draft);
    setApplied(nextApplied);
    setDraft(nextApplied);
    setSheetOpen(false);
    onAppliedChange?.(nextApplied);
  }, [draft, onAppliedChange]);

  const hasUnappliedChanges = useMemo(() => {
    const normalizedDraft = normalizeDraft(draft);
    const normalizedApplied = normalizeDraft(applied);
    return !isSameFilterValues(normalizedDraft, normalizedApplied);
  }, [applied, draft]);

  const activeAppliedFilterCount = useMemo(() => {
    let count = 0;
    if (applied.gender !== 'all') count++;
    if (applied.ageBucket !== 'all') count++;
    if (applied.heightBucket !== 'all') count++;
    if (applied.weightBucket !== 'all') count++;
    if (applied.jobCategory !== 'all') count++;
    if (applied.countryCode !== 'all') count++;
    if (applied.city !== 'all') count++;
    if (applied.district !== 'all') count++;
    return count;
  }, [applied]);

  const draftProjectControlValue = useMemo(
    () => resolveProjectForDivision(draft.division, draft.filterProject),
    [draft.division, draft.filterProject]
  );
  const appliedProjectControlValue = useMemo(
    () => resolveProjectForDivision(applied.division, applied.filterProject),
    [applied.division, applied.filterProject]
  );

  return {
    applied,
    draft,
    sheetOpen,
    openSheet,
    closeSheet,
    hasUnappliedChanges,
    activeAppliedFilterCount,
    draftProjectControlValue,
    appliedProjectControlValue,
    setDraftDivision,
    setDraftProject,
    setDraftGender,
    setDraftAgeBucket,
    setDraftHeightBucket,
    setDraftWeightBucket,
    setDraftJobCategory,
    setDraftCountryCode,
    setDraftCity,
    setDraftDistrict,
    clearDraftFilters,
    applyDraft,
  };
}
