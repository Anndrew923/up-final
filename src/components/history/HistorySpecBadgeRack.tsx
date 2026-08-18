import { Fragment, useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpecBadgeView } from '../../logic/core/trainingFootprintBadges';
import {
  CORE_SPEC_BADGE_IDS,
  isOptionalSpecBadgeId,
  type TrainingFootprintBadgeId,
} from '../../logic/core/trainingFootprint';
import { CompactTitaniumPlate } from './CompactTitaniumPlate';
import { HistorySpecBadgeGlyph } from './HistorySpecBadgeGlyphs';
import { TitaniumBadgeDefs } from './TitaniumBadgeDefs';

const BURNED_BADGE_IDS: ReadonlySet<TrainingFootprintBadgeId> = new Set(['PR-01', 'SPEC-6']);
const CORE_ID_SET = new Set<string>(CORE_SPEC_BADGE_IDS);
const BADGE_GRID_COLS = 3;

interface HistorySpecBadgeRackProps {
  badges: SpecBadgeView[];
  /** Parent rhythm panel is open — inspection sheet resets when this goes false. */
  inspectionEnabled: boolean;
  unseenBadgeIds: ReadonlySet<string>;
}

interface SpecBadgeGridProps {
  rows: SpecBadgeView[];
  openId: TrainingFootprintBadgeId | null;
  ariaLabel: string;
  onToggle: (id: TrainingFootprintBadgeId) => void;
  unseenBadgeIds: ReadonlySet<string>;
}

function inspectAlignClass(columnIndex: number): string {
  if (columnIndex === 0) return 'mr-auto';
  if (columnIndex === 1) return 'mx-auto';
  return 'ml-auto';
}

function chunkBadgeRows(badges: SpecBadgeView[]): SpecBadgeView[][] {
  const rows: SpecBadgeView[][] = [];
  for (let i = 0; i < badges.length; i += BADGE_GRID_COLS) {
    rows.push(badges.slice(i, i + BADGE_GRID_COLS));
  }
  return rows;
}

const SpecBadgeInspectPanel: FC<{ badge: SpecBadgeView }> = ({ badge }) => {
  const { t } = useTranslation('common');
  const titleId = `spec-badge-inspect-title-${badge.id}`;
  return (
    <div
      id={`spec-badge-inspect-${badge.id}`}
      role="region"
      aria-labelledby={titleId}
      className="rounded-lg border border-zinc-800 bg-zinc-950/95 px-3 py-3"
    >
      <p id={titleId} className="text-sm font-medium text-zinc-100">
        {t(`history.badges.items.${badge.id}.name`)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        {t(`history.badges.items.${badge.id}.desc`)}
      </p>
      <p className="mt-2 font-mono text-[11px] tabular-nums text-zinc-500">
        {t('history.badges.progress', { current: badge.current, target: badge.target })}
      </p>
    </div>
  );
};

const SpecBadgeGrid: FC<SpecBadgeGridProps> = ({ rows, openId, ariaLabel, onToggle, unseenBadgeIds }) => {
  const { t } = useTranslation('common');

  // WHY: inspect copy is an in-flow col-span row under the selected plates.
  // Absolute popovers fight History accordion overflow-hidden and cover later plates.

  return (
    <ul className="grid grid-cols-3 gap-2" aria-label={ariaLabel}>
      {chunkBadgeRows(rows).map((row) => {
        const selectedCol = row.findIndex((badge) => badge.id === openId);
        const selectedBadge = selectedCol >= 0 ? row[selectedCol] : undefined;
        return (
          <Fragment key={row[0]?.id}>
            {row.map((badge) => {
              const selected = openId === badge.id;
              return (
                <li key={badge.id}>
                  <button
                    type="button"
                    aria-expanded={selected}
                    aria-controls={selected ? `spec-badge-inspect-${badge.id}` : undefined}
                    aria-label={`${t(`history.badges.items.${badge.id}.name`)} · ${
                      badge.unlocked ? t('history.badges.unlocked') : t('history.badges.locked')
                    }`}
                    onClick={() => onToggle(badge.id)}
                    className="w-full rounded-md p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-info/60"
                  >
                    <CompactTitaniumPlate
                      catalogId={badge.id}
                      unlocked={badge.unlocked}
                      burned={BURNED_BADGE_IDS.has(badge.id)}
                      selected={selected}
                      unseenGlow={unseenBadgeIds.has(badge.id)}
                    >
                      <HistorySpecBadgeGlyph id={badge.id} />
                    </CompactTitaniumPlate>
                  </button>
                </li>
              );
            })}
            {selectedBadge ? (
              <li className="col-span-3">
                <div className={`w-full max-w-[18rem] ${inspectAlignClass(selectedCol)}`}>
                  <SpecBadgeInspectPanel badge={selectedBadge} />
                </div>
              </li>
            ) : null}
          </Fragment>
        );
      })}
    </ul>
  );
};

const HistorySpecBadgeRack: FC<HistorySpecBadgeRackProps> = ({ badges, inspectionEnabled, unseenBadgeIds }) => {
  const { t } = useTranslation('common');
  const [openId, setOpenId] = useState<TrainingFootprintBadgeId | null>(null);
  const coreBadges = badges.filter((row) => CORE_ID_SET.has(row.id));
  const optionalBadges = badges.filter((row) => isOptionalSpecBadgeId(row.id));

  useEffect(() => {
    if (!inspectionEnabled) setOpenId(null);
  }, [inspectionEnabled]);

  useEffect(() => {
    if (openId == null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openId]);

  const handleToggle = (id: TrainingFootprintBadgeId) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="relative mt-4">
      <TitaniumBadgeDefs />
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {t('history.badges.rackTitle')}
      </p>
      <SpecBadgeGrid
        rows={coreBadges}
        openId={openId}
        ariaLabel={t('history.badges.rackAria')}
        onToggle={handleToggle}
        unseenBadgeIds={unseenBadgeIds}
      />
      <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {t('history.badges.optionalRackTitle')}
      </p>
      <SpecBadgeGrid
        rows={optionalBadges}
        openId={openId}
        ariaLabel={t('history.badges.optionalRackAria')}
        onToggle={handleToggle}
        unseenBadgeIds={unseenBadgeIds}
      />
    </div>
  );
};

export default HistorySpecBadgeRack;
