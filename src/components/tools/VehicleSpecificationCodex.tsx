import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useCodexBandRows } from '../../hooks/useCodexBandRows';
import { CODEX_TABS, type CodexTab, type VehicleCodexScores } from '../../logic/core/codexCatalog';
import CodexBandRow from './CodexBandRow';

export interface VehicleSpecificationCodexProps {
  currentScores: VehicleCodexScores;
}

/** Matches `tools.codex` in common/tools.json — same prefix as other Tools page copy. */
const CODEX_I18N = 'tools.codex';

export const VehicleSpecificationCodex: FC<VehicleSpecificationCodexProps> = ({ currentScores }) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<CodexTab>('overall');
  const rows = useCodexBandRows(activeTab, currentScores);

  const tierRangeLabel = t(`${CODEX_I18N}.tierRange`);
  const activeSetupLabel = t(`${CODEX_I18N}.activeSetup`);

  return (
    <div className="vehicle-specification-codex w-full min-w-0 rounded-lg border border-zinc-900 bg-zinc-950 p-4 font-mono text-zinc-100 sm:p-5">
      <div className="mb-4 border-b border-zinc-800 pb-4 sm:mb-5">
        <h2 className="text-lg font-black leading-snug tracking-wide text-orange-500 sm:text-xl sm:tracking-widest">
          {t(`${CODEX_I18N}.mainTitle`)}
        </h2>
      </div>

      <div
        className="mb-5 grid grid-cols-2 gap-2 rounded border border-zinc-900/60 bg-zinc-900/40 p-2 sm:mb-6 sm:grid-cols-3"
        role="tablist"
        aria-label={t(`${CODEX_I18N}.panelTitle`)}
      >
        {CODEX_TABS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={activeTab === tabId}
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

      <div
        className="codex-list-viewport flex max-h-none flex-col gap-3 overflow-y-auto sm:max-h-[min(60vh,32rem)] sm:pr-1"
        role="tabpanel"
      >
        {rows.map((row) => (
          <CodexBandRow
            key={row.bandId}
            bandId={row.bandId}
            title={row.title}
            summary={row.summary}
            rangeDisplay={row.rangeDisplay}
            isActive={row.isActive}
            tierRangeLabel={tierRangeLabel}
            activeSetupLabel={activeSetupLabel}
          />
        ))}
      </div>
    </div>
  );
};
