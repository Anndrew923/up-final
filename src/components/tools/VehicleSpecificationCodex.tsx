import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveOverallGradeTierCopy } from '../../i18n/resolveOverallGradeCopy';
import {
  CODEX_TABS,
  formatCodexTierRange,
  getBandsForCodexTab,
  getMetricForCodexTab,
  getUserScoreForCodexTab,
  type CodexTab,
  type VehicleCodexScores,
} from '../../logic/core/codexCatalog';
import { resolveCodexBandRowCopy } from '../../logic/core/scoreMeaningCopy';
import {
  resolveOverallGradeBand,
  resolveScoreMeaningBand,
  type OverallGradeBandId,
} from '../../logic/core/scoreMeaningCatalog';

export interface VehicleSpecificationCodexProps {
  currentScores: VehicleCodexScores;
}

/** Matches `tools.codex` in common/tools.json — same prefix as other Tools page copy. */
const CODEX_I18N = 'tools.codex';

export const VehicleSpecificationCodex: FC<VehicleSpecificationCodexProps> = ({ currentScores }) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<CodexTab>('overall');

  const isOverall = activeTab === 'overall';
  const currentMetric = getMetricForCodexTab(activeTab);
  const userScore = getUserScoreForCodexTab(activeTab, currentScores);
  const bands = getBandsForCodexTab(activeTab);

  const activeBandId = isOverall
    ? resolveOverallGradeBand(userScore)
    : currentMetric
      ? resolveScoreMeaningBand(currentMetric, userScore).id
      : '';

  return (
    <div className="vehicle-specification-codex w-full min-w-0 rounded-lg border border-zinc-900 bg-zinc-950 p-4 font-mono text-zinc-100 sm:p-5">
      <div className="mb-4 border-b border-zinc-800 pb-4 sm:mb-5">
        <h2 className="text-lg font-black leading-snug tracking-wide text-orange-500 sm:text-xl sm:tracking-widest">
          {t(`${CODEX_I18N}.mainTitle`)}
        </h2>
        <p className="mt-2 font-sans text-xs leading-relaxed text-zinc-500">
          {t(`${CODEX_I18N}.subTitle`)}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded border border-zinc-900/60 bg-zinc-900/40 p-2 sm:mb-6 sm:grid-cols-3">
        {CODEX_TABS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`rounded border p-2 text-left transition-all duration-150 ${
              activeTab === tabId
                ? 'border-orange-500 bg-orange-600 text-white shadow-md'
                : 'border-zinc-800/50 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="text-[10px] font-black uppercase leading-tight tracking-wider sm:text-[11px]">
              {t(`${CODEX_I18N}.tabs.${tabId}`)}
            </div>
            <div
              className={`mt-1 line-clamp-2 font-sans text-[9px] leading-snug ${
                activeTab === tabId ? 'font-bold text-zinc-900' : 'text-zinc-500'
              }`}
            >
              {t(`${CODEX_I18N}.systems.${tabId}`)}
            </div>
          </button>
        ))}
      </div>

      <div className="codex-list-viewport flex max-h-none flex-col gap-3 overflow-y-auto sm:max-h-[min(60vh,32rem)] sm:pr-1">
        {bands.map((band) => {
          const isCurrentActive = band.id === activeBandId;

          let title = '';
          let summary = '';

          if (isOverall) {
            const copy = resolveOverallGradeTierCopy(t, band.id as OverallGradeBandId);
            title = copy.name;
            summary = copy.desc;
          } else if (currentMetric) {
            const rowCopy = resolveCodexBandRowCopy(t, currentMetric, band.id);
            title = rowCopy.title;
            summary = rowCopy.summary;
          }

          const rangeDisplay = formatCodexTierRange(band);
          const hasSummary = summary.trim().length > 0;

          return (
            <article
              key={band.id}
              className={`codex-row-card space-y-2.5 rounded-lg border p-4 transition-colors duration-200 ${
                isCurrentActive
                  ? 'border-orange-500 bg-zinc-900 shadow-[0_0_15px_rgba(239,68,68,0.1)] ring-1 ring-orange-500/20'
                  : 'border-zinc-800/80 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40'
              }`}
            >
              {isCurrentActive ? (
                <span className="inline-flex w-fit rounded bg-orange-500 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black">
                  {t(`${CODEX_I18N}.activeSetup`)}
                </span>
              ) : null}

              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold leading-none ${
                    isCurrentActive
                      ? 'bg-orange-500 text-black'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {band.id}
                </span>
                <h4
                  className={`min-w-0 flex-1 break-words font-bold leading-snug tracking-wide ${
                    isCurrentActive ? 'text-sm text-orange-400' : 'text-xs text-zinc-300'
                  }`}
                >
                  {title}
                </h4>
              </div>

              <p className="font-mono text-[10px] leading-snug text-zinc-500">
                <span className="text-zinc-600">{t(`${CODEX_I18N}.tierRange`)}:</span>{' '}
                <span className="text-zinc-400">{rangeDisplay}</span>
              </p>

              {hasSummary ? (
                <p className="font-sans text-xs leading-relaxed text-zinc-400">{summary}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};
