import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { useAndroidBackDismiss } from '../../hooks/useAndroidBackDismiss';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShellScrollLock } from '../../hooks/useShellScrollLock';
import { cn } from '../../lib/cn';
import { usePrefersReducedMotion } from '../../lib/motionPreference';
import {
  buildAxisHallLadder,
  type HallOfFameSpectrumAxisId,
} from '../../logic/core/hallOfFameSpectrumResolver';
import NormBadgeChip from '../common/NormBadgeChip';

export interface HallOfFameSpectrumDrawerProps {
  open: boolean;
  onClose: () => void;
  axisId: HallOfFameSpectrumAxisId;
  /** Localized axis title used in the drawer header. */
  axisTitle: string;
  scoreDisplay: string;
  decadeKey: string;
  populationClass: string;
  /**
   * Free Dyno remaining count shown on the CTA.
   * WHY: Required from parent quota — never invent a fake "2 left" default in the shell.
   */
  dynoRemaining: number;
  /** Fires after drawer teardown intent — parent should open Dyno with decode prompt. */
  onOpenDyno: () => void;
}

const LEGAL_PREVIEW_CHARS = 72;

/**
 * Single-axis Hall of Fame spectrum drawer.
 * WHY: Assessment pages need a restrained ladder + Dyno teaser without stuffing the breakthrough modal.
 */
const HallOfFameSpectrumDrawer: FC<HallOfFameSpectrumDrawerProps> = ({
  open,
  onClose,
  axisId,
  axisTitle,
  scoreDisplay,
  decadeKey,
  populationClass,
  dynoRemaining,
  onOpenDyno,
}) => {
  const { t, i18n } = useTranslation('common');
  const titleId = useId();
  const ladderId = useId();
  const legalId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLLIElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [legalExpanded, setLegalExpanded] = useState(false);

  useFocusTrap(dialogRef, open);
  useShellScrollLock(open);
  useAndroidBackDismiss(open, onClose);

  const spectrumLocale = i18n?.language === 'zh-Hant' ? 'zh-Hant' : 'en';
  const ladder = useMemo(
    () =>
      buildAxisHallLadder({
        axisId,
        currentDecadeKey: decadeKey,
        // WHY: Product restraint — show at most two faces on the current rung (matrix maxDisplayNames is consult-only).
        maxNamesOnCurrent: 2,
        locale: spectrumLocale,
        t,
      }),
    [axisId, decadeKey, spectrumLocale, t]
  );

  const legalFull = t('dynoIntel.hallOfFame.legalShield');
  const legalNeedsTruncate = legalFull.length > LEGAL_PREVIEW_CHARS;
  const legalPreview = legalNeedsTruncate
    ? `${legalFull.slice(0, LEGAL_PREVIEW_CHARS).trim()}…`
    : legalFull;

  useEffect(() => {
    if (!open) {
      setLegalExpanded(false);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // WHY: Open on the user's rung so they do not hunt through a 13-row pantheon list.
  useLayoutEffect(() => {
    if (!open) return;
    currentRowRef.current?.scrollIntoView({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [open, decadeKey, axisId, reducedMotion]);

  if (!open || typeof document === 'undefined') return null;

  const remaining = Math.max(0, Math.floor(Number(dynoRemaining) || 0));

  const handleOpenDyno = () => {
    onClose();
    onOpenDyno();
  };

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-end justify-center pt-[max(0.75rem,env(safe-area-inset-top,24px))] sm:items-center sm:px-4 sm:pt-[max(1rem,env(safe-area-inset-top,24px))]',
        Z_INDEX_CLASS.hallOfFameSpectrumDrawer
      )}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm motion-safe:animate-auth-choice-enter motion-reduce:animate-none"
        aria-label={t('assessment.hallSpectrum.closeAria')}
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ladderId}
        className={cn(
          'relative z-10 flex h-[min(75dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-zinc-600/70 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-panel sm:rounded-2xl',
          'motion-safe:animate-hall-spectrum-enter motion-reduce:animate-none'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header — fixed */}
        <header className="shrink-0 border-b border-zinc-800/90 px-4 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-600/80" aria-hidden />
          <h2
            id={titleId}
            className="text-center text-sm font-semibold tracking-tight text-zinc-100"
          >
            {t('assessment.hallSpectrum.title', { axisTitle })}
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
            <p className="font-mono text-2xl tabular-nums leading-none text-zinc-50">
              {scoreDisplay}
            </p>
            <NormBadgeChip
              populationClass={populationClass}
              decadeKey={decadeKey}
              size="md"
            />
          </div>
        </header>

        {/* Ladder — sole scroll region */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5">
          <ol
            id={ladderId}
            aria-label={t('assessment.hallSpectrum.ladderRegionAria')}
            className="space-y-1"
          >
            {ladder.map((row) => {
              const isCurrent = row.isCurrent;
              return (
                <li
                  key={row.decadeKey}
                  ref={isCurrent ? currentRowRef : undefined}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={
                    isCurrent
                      ? t('assessment.hallSpectrum.currentRungAria', {
                          populationClass: row.populationClass,
                        })
                      : undefined
                  }
                  className={cn(
                    'relative overflow-hidden rounded-lg px-3 py-2.5 transition-colors',
                    isCurrent
                      ? 'border border-amber-400/35 bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent shadow-[inset_0_1px_0_rgba(251,191,36,0.14)]'
                      : 'border border-transparent'
                  )}
                >
                  {/* WHY: Solid gold lock bar — reads as "you are here" without competing with score numerals. */}
                  {isCurrent ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    />
                  ) : null}
                  <div className={cn('flex items-baseline justify-between gap-3', isCurrent && 'pl-2')}>
                    <span
                      className={cn(
                        'font-mono text-[11px] tabular-nums tracking-wide',
                        isCurrent ? 'font-semibold text-amber-200' : 'text-zinc-400'
                      )}
                    >
                      {row.decadeKey}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-right text-sm',
                        isCurrent ? 'font-semibold text-amber-200' : 'text-zinc-400'
                      )}
                    >
                      {row.populationClass}
                    </span>
                  </div>
                  {isCurrent && row.representativeNames.length > 0 ? (
                    <p className="mt-1.5 truncate pl-2 text-left text-[11px] leading-snug tracking-wide text-zinc-300">
                      <span className="mr-1.5 inline-block font-mono text-[10px] text-amber-500/80" aria-hidden>
                        ◆
                      </span>
                      {row.representativeNames.join(' · ')}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Footer — pinned; ui-modal-safe-footer owns additive breath + safe-area inset. */}
        <footer className="ui-modal-safe-footer shrink-0 border-t border-zinc-800/90 px-4">
          <div className="space-y-1">
            <p id={legalId} className="text-[11px] leading-relaxed text-zinc-500">
              {legalExpanded || !legalNeedsTruncate ? legalFull : legalPreview}
            </p>
            {legalNeedsTruncate ? (
              <button
                type="button"
                className="text-[11px] font-medium tracking-wide text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                aria-expanded={legalExpanded}
                aria-controls={legalId}
                onClick={() => setLegalExpanded((prev) => !prev)}
              >
                {legalExpanded
                  ? t('assessment.hallSpectrum.legalCollapse')
                  : t('assessment.hallSpectrum.legalExpand')}
              </button>
            ) : null}
          </div>

          {/* WHY: Amber telemetry shell — CTA must read as the primary honor action at the foot. */}
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(251,191,36,0.08)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-500/70">
              {t('assessment.hallSpectrum.teaserKicker')}
            </p>
            <p className="mt-1.5 text-sm leading-snug text-zinc-200">
              {t('assessment.hallSpectrum.teaserLine')}
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-amber-500/50 bg-amber-500/5 px-3 py-2.5 text-left text-sm font-semibold tracking-tight text-amber-300 transition hover:border-amber-400/70 hover:bg-amber-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
              aria-label={t('assessment.hallSpectrum.teaserCtaAria', { remaining })}
              onClick={handleOpenDyno}
            >
              {t('assessment.hallSpectrum.teaserCta', { remaining })}
              <span className="ml-1 text-amber-400/80" aria-hidden>
                {t('assessment.hallSpectrum.teaserCtaArrow')}
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default HallOfFameSpectrumDrawer;
