import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveHomeSectionString } from '../../i18n/resolveHomeBundleCopy';

export interface HomeDiagnosticsPanelProps {
  disabled?: boolean;
  onStartDiagnostics: () => void;
}

function DiagnosticsArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-[#FF9500]"
      aria-hidden
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Track-mode diagnostics CTA — layered frosted glass (blur + grain), neon depth, breathing glow.
 * WHY: Glow animates on a dedicated layer so hover/active border feedback does not fight box-shadow keyframes.
 */
const HomeDiagnosticsPanel: FC<HomeDiagnosticsPanelProps> = ({
  disabled = false,
  onStartDiagnostics,
}) => {
  const { t, i18n } = useTranslation('common');
  const ctaLabel = resolveHomeSectionString(t, 'diagnostics', 'cta');
  const ctaSub = resolveHomeSectionString(t, 'diagnostics', 'ctaSub');
  const ctaLabelClass =
    i18n.language === 'zh-Hant'
      ? 'whitespace-nowrap text-xs font-semibold leading-none tracking-tight text-zinc-100'
      : 'whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-zinc-100';

  return (
    <div className="flex w-full justify-center">
      <div className="relative w-[72%] min-w-[200px] max-w-[280px] pt-4">
        <span
          className="pointer-events-none absolute left-0 top-0 z-10 font-mono text-[11px] font-normal uppercase tracking-[0.15em] text-[#A0A0A0]"
          aria-hidden
        >
          {ctaSub}
        </span>

        <button
          type="button"
          disabled={disabled}
          aria-label={ctaLabel}
          onClick={onStartDiagnostics}
          className="ui-btn-diagnostics group flex w-full min-h-12 items-center justify-between gap-3 rounded-lg border border-[#FF9500] px-4 py-3.5 text-left will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9500]/70 motion-safe:transition-[transform,border-color] motion-safe:duration-150 motion-safe:active:scale-[0.98] motion-safe:active:border-[#FFB84D] motion-safe:hover:border-[#FFAA33] disabled:pointer-events-none disabled:opacity-40"
        >
          <span
            className="ui-btn-diagnostics-glow motion-reduce:animate-none motion-safe:animate-track-mode-glow"
            aria-hidden
          />
          <span className="ui-btn-diagnostics-glass motion-reduce:will-change-auto" aria-hidden />
          <span className="ui-btn-diagnostics-noise" aria-hidden />
          <span className="ui-btn-diagnostics-inset-glow" aria-hidden />
          <span className="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-3">
            <span
              className={`${ctaLabelClass} min-w-0 flex-1 overflow-hidden text-ellipsis`}
            >
              {ctaLabel}
            </span>
            <DiagnosticsArrowIcon />
          </span>
        </button>
      </div>
    </div>
  );
};

export default HomeDiagnosticsPanel;
