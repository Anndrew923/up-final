import { type CSSProperties, type FC } from 'react';
import { cn } from '../../lib/cn';
import { FOIL_NUMERAL_CLASS, FOIL_PLATE_CLASS } from './aestheticChrome';
import { CERT_BADGE_REVEAL_CLASS } from '../../lib/certRevealMotion';
import { clampMeterFill } from './AestheticMeter';

export interface AestheticKpiColumnModel {
  label: string;
  value: string;
  fillPct: number;
  badge: string | null;
  emphasize: boolean;
  staggerMs?: number;
}

/**
 * 4:5 feed KPI strip — three compact columns free ~200px of vertical stack vs stacked calipers.
 * WHY: Carbon 4:5 export paints the same strip; DOM preview must stay WYSIWYG.
 */
const AestheticKpiStrip: FC<{ columns: readonly AestheticKpiColumnModel[] }> = ({
  columns,
}) => {
  return (
    <div data-testid="aesthetic-kpi-strip" className="grid grid-cols-3 gap-3">
      {columns.map((col) => {
        const fill = clampMeterFill(col.fillPct);
        return (
          <div
            key={col.label}
            data-testid="aesthetic-kpi-column"
            className="flex min-w-0 flex-col items-center gap-1.5 text-center"
          >
            <p className="w-full truncate text-[8px] tracking-[0.14em] text-zinc-400">
              {col.label}
            </p>
            <p
              className={cn(
                'text-[13px] font-semibold tabular-nums leading-none',
                col.emphasize ? FOIL_NUMERAL_CLASS : 'text-zinc-100'
              )}
            >
              {col.value}
            </p>
            <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-zinc-800/80">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-gradient-to-r from-[#7a5c28] via-[#c9a227] to-[#f3e6c8]"
                style={{ width: `${fill}%` }}
              />
            </div>
            {col.badge ? (
              <span
                className={cn(FOIL_PLATE_CLASS, CERT_BADGE_REVEAL_CLASS, 'mt-0.5')}
                style={
                  {
                    animationDelay: `${col.staggerMs ?? 0}ms`,
                  } as CSSProperties
                }
              >
                {col.badge}
              </span>
            ) : (
              <span className="h-[14px]" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AestheticKpiStrip;
