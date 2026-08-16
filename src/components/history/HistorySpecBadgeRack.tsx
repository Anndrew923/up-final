import { useEffect, useState, type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpecBadgeView } from '../../logic/core/trainingFootprintBadges';
import type { TrainingFootprintBadgeId } from '../../logic/core/trainingFootprint';
import { CompactTitaniumPlate } from './CompactTitaniumPlate';
import { TitaniumBadgeDefs } from './TitaniumBadgeDefs';

const BURNED_BADGE_IDS: ReadonlySet<TrainingFootprintBadgeId> = new Set(['PR-01', 'SPEC-6']);
const TURBINE_BLADE_DEG = [0, 60, 120, 180, 240, 300] as const;
const WHEEL_SPOKE_DEG = [0, 72, 144, 216, 288] as const;
const CALIPER_PISTON_Y = [8, 9.6, 11.2, 12.8, 14.4, 16] as const;

function BadgeGlyph({ id }: { id: TrainingFootprintBadgeId }): ReactNode {
  switch (id) {
    case 'IGN-01':
      return (
        <>
          <circle cx="12" cy="12" r="2.1" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="8.3" strokeWidth="1.15" />
          {TURBINE_BLADE_DEG.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 12 12)`}>
              <path d="M12 9.6 Q 14.6 6.4 12 3.6 Q 9.4 6.4 12 9.6" strokeWidth="1.15" />
            </g>
          ))}
        </>
      );
    case 'RUN-30':
      return (
        <>
          <rect x="8.4" y="3.4" width="7.2" height="5.4" rx="0.6" strokeWidth="1.2" />
          <path d="M12 8.8 V15.2 L8.2 20.4" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M16.2 5.6 L20.6 3.4 M16.4 8 L21.2 6.6" strokeWidth="1.15" strokeLinecap="round" />
        </>
      );
    case 'CRS-04':
      return (
        <>
          <path
            d="M2.8 13.2 Q 8 8.2 14 9.2 Q 19.5 10.2 21.4 13 Q 14.2 12.2 8 14.4 Q 5 15.2 2.8 13.2"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M15.6 8.2 Q 18.8 6.2 21.6 5 M14.8 10.6 Q 18.6 9.4 21.6 8.4" strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
    case 'HIST-10':
      return (
        <>
          <path d="M4 16.8 L7.2 13.6 L10.2 14.8 L13.8 7.4 L16.8 9.6 L20.2 4.6" strokeWidth="1.25" strokeLinejoin="round" />
          <path d="M4 19.2 H20.2" strokeWidth="1.1" />
          <path d="M7.2 19.2 V20.6 M13.8 19.2 V20.6" strokeWidth="1.1" />
        </>
      );
    case 'PR-01':
      return (
        <>
          <circle cx="12" cy="12" r="8.4" strokeWidth="1.15" />
          <circle cx="12" cy="12" r="2.05" strokeWidth="1.15" />
          {WHEEL_SPOKE_DEG.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 12 12)`}>
              <path
                d="M11.15 11.2 L10.35 5.35 L12 4.15 L13.65 5.35 L12.85 11.2"
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </>
      );
    case 'SPEC-6':
      return (
        <>
          <circle cx="10.2" cy="12" r="7.1" strokeWidth="1.15" />
          <circle cx="10.2" cy="12" r="2.05" strokeWidth="1.15" />
          <path d="M16 7.2 H20.6 L21.2 16.8 H16 Q 14.6 12 16 7.2" strokeWidth="1.15" strokeLinejoin="round" />
          {CALIPER_PISTON_Y.map((y) => (
            <circle key={y} cx="16.35" cy={y} r="0.7" strokeWidth="1" />
          ))}
        </>
      );
  }
}

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
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label={t('history.badges.rackAria')}>
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
                  <BadgeGlyph id={badge.id} />
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
