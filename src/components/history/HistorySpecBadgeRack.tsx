import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpecBadgeView } from '../../logic/core/trainingFootprintBadges';
import type { TrainingFootprintBadgeId } from '../../logic/core/trainingFootprint';
import { CompactTitaniumPlate } from './CompactTitaniumPlate';
import { HistorySpecBadgeGlyph } from './HistorySpecBadgeGlyphs';
import { TitaniumBadgeDefs } from './TitaniumBadgeDefs';

const BURNED_BADGE_IDS: ReadonlySet<TrainingFootprintBadgeId> = new Set(['PR-01', 'SPEC-6']);

interface HistorySpecBadgeRackProps {
  badges: SpecBadgeView[];
  /** Parent rhythm panel is open — inspection sheet resets when this goes false. */
  inspectionEnabled: boolean;
}

const HistorySpecBadgeRack: FC<HistorySpecBadgeRackProps> = ({ badges, inspectionEnabled }) => {
  const { t } = useTranslation('common');
  const [openId, setOpenId] = useState<TrainingFootprintBadgeId | null>(null);
  const open = badges.find((row) => row.id === openId) ?? null;

  useEffect(() => {
    if (!inspectionEnabled) setOpenId(null);
  }, [inspectionEnabled]);

  return (
    <div className="relative mt-4">
      <TitaniumBadgeDefs />
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {t('history.badges.rackTitle')}
      </p>
      <ul className="grid grid-cols-3 gap-2" aria-label={t('history.badges.rackAria')}>
        {badges.map((badge) => {
          const selected = openId === badge.id;
          return (
            <li key={badge.id}>
              <button
                type="button"
                aria-expanded={selected}
                aria-label={`${t(`history.badges.items.${badge.id}.name`)} · ${
                  badge.unlocked ? t('history.badges.unlocked') : t('history.badges.locked')
                }`}
                onClick={() => setOpenId(selected ? null : badge.id)}
                className="w-full rounded-md p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60"
              >
                <CompactTitaniumPlate
                  catalogId={badge.id}
                  unlocked={badge.unlocked}
                  burned={BURNED_BADGE_IDS.has(badge.id)}
                  selected={selected}
                >
                  <HistorySpecBadgeGlyph id={badge.id} />
                </CompactTitaniumPlate>
              </button>
            </li>
          );
        })}
      </ul>
      {open ? (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3">
          <p className="text-sm font-medium text-zinc-100">
            {t(`history.badges.items.${open.id}.name`)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            {t(`history.badges.items.${open.id}.desc`)}
          </p>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-zinc-500">
            {t('history.badges.progress', { current: open.current, target: open.target })}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default HistorySpecBadgeRack;
