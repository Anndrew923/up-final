import type { TFunction } from 'i18next';
import type { OverallGradeBandId } from '../logic/core/scoreMeaningCatalog';

export interface OverallGradeTierCopy {
  name: string;
  desc: string;
}

/**
 * Resolves homologation tier copy from the `common` bundle.
 * WHY: `t('home.overallGrade.TIER_xx.name')` can fail when bundles are flat strings or HMR
 * leaves stale leaves — `returnObjects: true` reads the tier object directly (Spotify/Strava
 * badge copy stays in sync with home.json `{ name, desc }` shape).
 */
export function resolveOverallGradeTierCopy(
  t: TFunction,
  bandId: OverallGradeBandId
): OverallGradeTierCopy {
  const objectKey = `home.overallGrade.${bandId}`;
  const tier: unknown = t(objectKey, { returnObjects: true });

  if (typeof tier === 'object' && tier !== null && 'name' in tier && 'desc' in tier) {
    const copy = tier as { name?: string; desc?: string };
    const name = String(copy.name ?? '').trim();
    const desc = String(copy.desc ?? '').trim();
    if (name.length > 0) {
      return { name, desc };
    }
  }

  if (typeof tier === 'string' && tier.length > 0 && tier !== objectKey) {
    return { name: tier, desc: '' };
  }

  const name = t(`${objectKey}.name`);
  const desc = t(`${objectKey}.desc`);
  if (name !== `${objectKey}.name`) {
    return { name, desc: desc !== `${objectKey}.desc` ? desc : '' };
  }

  return { name: bandId, desc: '' };
}
