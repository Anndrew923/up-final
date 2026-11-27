import { useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { VerifiedAthleteEntry } from '../data/athletes';
import { usePortalModalLock } from '../hooks/usePortalModalLock';
import {
  athleteStillObjectClass,
  athleteStillOptionsFromCrop,
} from './athleteStillFrame';

/**
 * Telemetry dossier — battle still + metrics / bio / career for verified athletes.
 * WHY: Keep homepage cards glanceable; progressive disclosure carries hard-data
 * credibility without bloating the snap rail. ImageLightbox stays image-only
 * for Systems / community.
 */

/** Emphasize measured numerals (decimals + thousands commas) with tabular-nums. */
function renderMetricLine(line: string) {
  return line.split(/(\d[\d,]*(?:\.\d+)?)/g).map((part, index) =>
    /^\d[\d,]*(?:\.\d+)?$/.test(part) ? (
      <span key={`n-${index}`} className="font-semibold tabular-nums text-fg">
        {part}
      </span>
    ) : (
      <span key={`t-${index}`}>{part}</span>
    ),
  );
}

interface TelemetryDossierModalProps {
  athlete: VerifiedAthleteEntry;
  onClose: () => void;
}

export function TelemetryDossierModal({
  athlete,
  onClose,
}: TelemetryDossierModalProps) {
  const titleId = useId();
  const battleSrc = athlete.battleCardUrl;
  const hasMetrics = athlete.metricGroups.length > 0;
  const hasBio = Boolean(athlete.bio?.trim());
  const career = athlete.careerHighlights ?? [];
  const hasCareer = career.length > 0;
  const quote = athlete.quote?.trim();
  usePortalModalLock(onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-950 shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:max-h-[90dvh] sm:rounded-2xl sm:pb-0"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="ui-kicker-zh">實測數據檔案</p>
            <h2
              id={titleId}
              className="mt-1 truncate text-base font-semibold text-white sm:text-lg"
            >
              {athlete.name}
            </h2>
            {/*
              WHY line-clamp-2: national-team roles are long; single-line truncate
              hid the specialty half on phone headers.
            */}
            <p className="ui-label mt-0.5 line-clamp-2">{athlete.role}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/90 text-fg-secondary transition hover:border-zinc-400 hover:text-fg"
            aria-label="關閉實測檔案"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {/*
          WHY: Mobile = stacked scroll dossier; md+ = still | copy columns so
          battle art and measured lines read as one telemetry sheet.
        */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-white/10 bg-void/60 p-4 sm:p-5 md:sticky md:top-0 md:self-start md:border-b-0 md:border-r">
              {battleSrc ? (
                <div className="relative mx-auto max-w-xs overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 md:max-w-none">
                  <img
                    src={battleSrc}
                    alt={`${athlete.name} 實機遙測戰報卡`}
                    className={`aspect-[3/4] w-full ${athleteStillObjectClass(
                      athleteStillOptionsFromCrop(athlete),
                    )}`}
                    decoding="async"
                  />
                  {athlete.battleScoreHint ? (
                    <span className="absolute left-2 top-2 rounded-md border border-orange-400/50 bg-black/75 px-2 py-1 text-sm font-semibold tabular-nums text-fg shadow-lg backdrop-blur-sm">
                      {athlete.battleScoreHint}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-zinc-600 bg-zinc-950/70 md:max-w-none">
                  <p className="ui-label">戰報卡 · 待匯入</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-5">
              {hasMetrics ? (
                <section className="space-y-3">
                  <p className="ui-kicker-zh">完整實測成績</p>
                  <ul className="space-y-3">
                    {athlete.metricGroups.map((group) => (
                      <li
                        key={group.label}
                        className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 sm:p-3.5"
                      >
                        <p className="ui-subhead mb-1.5">{group.label}</p>
                        <p className="text-sm leading-relaxed text-fg-secondary tabular-nums sm:text-[15px]">
                          {renderMetricLine(group.line)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {hasBio ? (
                <section className="space-y-2">
                  <p className="ui-kicker-zh">選手簡介</p>
                  <p className="text-sm leading-relaxed text-fg-secondary sm:text-[15px]">
                    {athlete.bio}
                  </p>
                </section>
              ) : null}

              {hasCareer ? (
                <section className="space-y-2.5">
                  <p className="ui-kicker-zh">賽事戰績與專業資歷</p>
                  <ul className="space-y-2">
                    {career.map((line, index) => (
                      <li
                        key={`career-${index}`}
                        className="flex gap-2.5 text-sm leading-relaxed text-fg-secondary sm:text-[15px]"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-energy/80"
                          aria-hidden
                        />
                        <span className="min-w-0">{renderMetricLine(line)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {quote ? (
                <blockquote className="rounded-xl border border-orange-400/25 bg-orange-500/[0.06] px-3.5 py-3 text-sm leading-relaxed text-fg sm:px-4 sm:py-3.5 sm:text-[15px]">
                  「{quote}」
                </blockquote>
              ) : null}

              {hasMetrics ? (
                <p className="ui-label border-t border-white/5 pt-3 leading-snug">
                  以上為實測紀錄與六大運動生理學常模換算對照基準
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
