import type { TFunction } from 'i18next';
import {
  getOverallGradeKeys,
  type OverallGradeBandId,
} from '../logic/core/scoreMeaningCatalog';

export interface OverallGradeTierCopy {
  name: string;
  desc: string;
  representativeCar: string;
  carPrice: string;
}

export interface OverallGradeDetailRow {
  label: string;
  value: string;
}

type TierLeafField = 'desc' | 'representativeCar' | 'carPrice';

function pickTierString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveTierLeaf(t: TFunction, objectKey: string, field: TierLeafField | 'name'): string {
  const leafKey = `${objectKey}.${field}`;
  const value = t(leafKey);
  return value !== leafKey ? pickTierString(value) : '';
}

function pickOrResolveLeaf(
  t: TFunction,
  objectKey: string,
  field: TierLeafField,
  raw: unknown
): string {
  const picked = pickTierString(raw);
  return picked.length > 0 ? picked : resolveTierLeaf(t, objectKey, field);
}

function assembleTierCopy(
  t: TFunction,
  objectKey: string,
  bandId: OverallGradeBandId,
  partial: {
    name?: unknown;
    desc?: unknown;
    representativeCar?: unknown;
    carPrice?: unknown;
  }
): OverallGradeTierCopy {
  const name = pickTierString(partial.name);
  if (name.length === 0) {
    return { name: bandId, desc: '', representativeCar: '', carPrice: '' };
  }
  return {
    name,
    desc: pickOrResolveLeaf(t, objectKey, 'desc', partial.desc),
    representativeCar: pickOrResolveLeaf(t, objectKey, 'representativeCar', partial.representativeCar),
    carPrice: pickOrResolveLeaf(t, objectKey, 'carPrice', partial.carPrice),
  };
}

/**
 * Resolves homologation tier copy from the `common` bundle.
 * WHY: `t('home.overallGrade.TIER_xx.name')` can fail when bundles are flat strings or HMR
 * leaves stale leaves — `returnObjects: true` reads the tier object directly (Spotify/Strava
 * badge copy stays in sync with home.json tier shape).
 */
export function resolveOverallGradeTierCopy(
  t: TFunction,
  bandId: OverallGradeBandId
): OverallGradeTierCopy {
  const objectKey = `home.overallGrade.${bandId}`;
  const tier: unknown = t(objectKey, { returnObjects: true });

  if (typeof tier === 'object' && tier !== null && 'name' in tier && 'desc' in tier) {
    return assembleTierCopy(t, objectKey, bandId, tier as Record<string, unknown>);
  }

  if (typeof tier === 'string' && tier.length > 0 && tier !== objectKey) {
    return { name: tier, desc: '', representativeCar: '', carPrice: '' };
  }

  const name = resolveTierLeaf(t, objectKey, 'name');
  if (name.length > 0) {
    return assembleTierCopy(t, objectKey, bandId, { name });
  }

  return { name: bandId, desc: '', representativeCar: '', carPrice: '' };
}

/** Labeled vehicle benchmark rows for homologation detail sheet — skips empty locale leaves. */
export function buildOverallGradeDetailRows(
  t: TFunction,
  bandId: OverallGradeBandId,
  tier: Pick<OverallGradeTierCopy, 'representativeCar' | 'carPrice'>
): OverallGradeDetailRow[] {
  const keys = getOverallGradeKeys(bandId);
  const rows: OverallGradeDetailRow[] = [];
  if (tier.representativeCar.length > 0) {
    rows.push({ label: t(keys.carSpecLabel), value: tier.representativeCar });
  }
  if (tier.carPrice.length > 0) {
    rows.push({ label: t(keys.priceLabel), value: tier.carPrice });
  }
  return rows;
}
