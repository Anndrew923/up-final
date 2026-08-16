/**
 * Local-only training footprint persistence.
 * WHY: Must never import Firebase — this is a Core local feature, not Pro cloud traffic.
 */
import { safeGetItem, safeRemoveItem, safeSetItem } from '../lib/safeLocalStorage';
import {
  deriveUnlockedBadges,
  unlockedBadgeIdsFromViews,
  type SpecBadgeDeriveInput,
} from '../logic/core/trainingFootprintBadges';
import {
  applyFootprintRecord,
  applyUnlockedBadgeUnion,
  emptyTrainingFootprint,
  localDateKey,
  parseTrainingFootprintState,
  type FootprintLevel,
  type TrainingFootprintState,
} from '../logic/core/trainingFootprint';

export const TRAINING_FOOTPRINT_STORAGE_KEY = 'up.trainingFootprint';
export const LOCAL_FOOTPRINT_CHANGED_EVENT = 'up-final-local-footprint-changed';

const EMPTY_BADGE_CONTEXT: SpecBadgeDeriveInput = { scores: {}, historyLength: 0 };

function notifyFootprintObservers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_FOOTPRINT_CHANGED_EVENT));
}

export function loadTrainingFootprint(): TrainingFootprintState {
  const raw = safeGetItem(TRAINING_FOOTPRINT_STORAGE_KEY);
  if (!raw) return emptyTrainingFootprint();
  try {
    return parseTrainingFootprintState(JSON.parse(raw) as unknown);
  } catch {
    return emptyTrainingFootprint();
  }
}

export function saveTrainingFootprint(state: TrainingFootprintState): void {
  if (!safeSetItem(TRAINING_FOOTPRINT_STORAGE_KEY, JSON.stringify(state))) return;
  notifyFootprintObservers();
}

export function clearTrainingFootprint(): void {
  safeRemoveItem(TRAINING_FOOTPRINT_STORAGE_KEY);
  notifyFootprintObservers();
}

function mergeDerivedBadgeUnion(
  state: TrainingFootprintState,
  input: SpecBadgeDeriveInput,
  now: Date
): { state: TrainingFootprintState; changed: boolean } {
  const views = deriveUnlockedBadges(state, input, now);
  return applyUnlockedBadgeUnion(state, unlockedBadgeIdsFromViews(views));
}

/**
 * Records a gym action for the device-local day. Same-day equal/lower levels are no-ops
 * unless `badgeContext` newly unlocks an ID (ARC-01 / HIST-10 / SPEC-6 need scores + history length).
 */
export function recordTrainingFootprint(
  level: FootprintLevel,
  now: Date = new Date(),
  badgeContext: SpecBadgeDeriveInput = EMPTY_BADGE_CONTEXT
): TrainingFootprintState {
  const current = loadTrainingFootprint();
  const applied = applyFootprintRecord(current, localDateKey(now), level, now);
  const nextDays = applied.changed ? applied.state : current;
  const withBadges = mergeDerivedBadgeUnion(nextDays, badgeContext, now);
  if (!applied.changed && !withBadges.changed) return current;
  saveTrainingFootprint(withBadges.state);
  return withBadges.state;
}

/**
 * Catch-up write for already-qualified IDs (e.g. opening 日誌 after a catalog deploy).
 */
export function persistUnlockedBadgeUnion(
  input: SpecBadgeDeriveInput,
  now: Date = new Date()
): TrainingFootprintState {
  const current = loadTrainingFootprint();
  const withBadges = mergeDerivedBadgeUnion(current, input, now);
  if (!withBadges.changed) return current;
  saveTrainingFootprint(withBadges.state);
  return withBadges.state;
}

export function subscribeTrainingFootprint(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onCustom = () => onChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === TRAINING_FOOTPRINT_STORAGE_KEY) onChange();
  };
  window.addEventListener(LOCAL_FOOTPRINT_CHANGED_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LOCAL_FOOTPRINT_CHANGED_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
