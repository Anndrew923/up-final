import { type FC, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useAndroidBackDismiss } from '../../hooks/useAndroidBackDismiss';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { resolveSixAxisChartLabel } from '../../i18n/resolveSixAxisChartLabel';
import {
  buildSixAxisRadarData,
  calculateSixAxisOverall,
  radarDisplayScaleMax,
} from '../../logic/core/scoring';
import { guildMemberHasRadarScores } from '../../logic/core/guildRadarScores';
import type { GuildMemberSnapshot } from '../../types/guild';
import type { SixAxisMetric } from '../../types/scoring';
import HexRadarChart from '../radar/HexRadarChart';
import ProAvatarRing from '../ProAvatarRing';
import { ladderIdentityInitial } from '../../logic/core/ladderUploadPolicy';

export interface CrewMemberRadarSheetProps {
  open: boolean;
  member: GuildMemberSnapshot | null;
  rank: number | null;
  guildTag: string;
  onClose: () => void;
}

/**
 * Club member radar detail — data from embedded members[] only (no preview fetch).
 */
const CrewMemberRadarSheet: FC<CrewMemberRadarSheetProps> = ({
  open,
  member,
  rank,
  guildTag,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const titleId = useId();

  useShellScrollLock(open);
  useAndroidBackDismiss(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const hasRadar = member ? guildMemberHasRadarScores(member) : false;

  const radarPoints = useMemo(() => {
    if (!member || !hasRadar) return [];
    return buildSixAxisRadarData(member.radarScores ?? {});
  }, [member, hasRadar]);

  const localizedRadarPoints = useMemo(
    () =>
      radarPoints.map((point) => ({
        ...point,
        label: resolveSixAxisChartLabel(t, point.key as SixAxisMetric),
      })),
    [radarPoints, t]
  );

  const scaleMax = useMemo(() => radarDisplayScaleMax(radarPoints), [radarPoints]);

  const overallFromRadar = useMemo(() => {
    if (!member || !hasRadar) return null;
    return calculateSixAxisOverall(member.radarScores ?? {});
  }, [member, hasRadar]);

  if (!open || !member || typeof document === 'undefined') return null;

  const displayName = member.displayName || member.uid;

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_INDEX_CLASS.ladderBlockedUsersSheet} flex flex-col justify-end ui-modal-safe-shell sm:items-center sm:justify-center sm:px-4`}
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex min-h-0 w-full max-w-lg max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-bg-card shadow-panel sm:max-h-[min(88dvh,36rem)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-4 pt-3 sm:pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
              {guildTag ? `[${guildTag}]` : t('crew.ladder.detailKicker')}
              {rank != null ? ` · #${rank}` : ''}
            </p>
            <h2
              id={titleId}
              className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50 sm:text-base"
            >
              <ProAvatarRing
                isPro={false}
                size="sm"
                src={member.avatarUrl}
                alt=""
                fallback={ladderIdentityInitial(displayName)}
              />
              <span className="truncate">{displayName}</span>
            </h2>
          </div>
          <button type="button" className="ui-btn py-1 text-[11px] sm:py-1.5 sm:text-xs" onClick={onClose}>
            {t('crew.ladder.detailClose')}
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 [-webkit-overflow-scrolling:touch] sm:py-4">
          {hasRadar ? (
            <div className="space-y-3">
              <p className="text-center font-mono text-xs text-zinc-400">
                {t('crew.ladder.detailOverall', {
                  score:
                    overallFromRadar != null
                      ? overallFromRadar.toFixed(2)
                      : member.ladderScore.toFixed(2),
                })}
              </p>
              <div className="mx-auto aspect-square w-full max-w-[280px]">
                <HexRadarChart
                  points={localizedRadarPoints}
                  scaleMax={scaleMax}
                  aria-label={t('crew.ladder.detailRadarAria', { name: displayName })}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-zinc-700/90 bg-zinc-900/40 px-4 py-8 text-center text-sm leading-relaxed text-zinc-400">
              {t('crew.ladder.detailNoRadar')}
            </p>
          )}
        </div>

        <div className="ui-modal-safe-footer shrink-0" />
      </section>
    </div>,
    document.body
  );
};

export default CrewMemberRadarSheet;
