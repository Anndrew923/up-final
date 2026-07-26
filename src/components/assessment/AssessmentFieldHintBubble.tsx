import type { FC } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

export interface AssessmentFieldHintBubbleProps {
  /** Accessible name for the ⓘ control. */
  ariaLabel: string;
  /** Short tip body shown inside the bubble. */
  tip: string;
  /** Optional non-interactive footer (e.g. where to find full reference). */
  footer?: string;
  /**
   * When false, force-close the bubble (tab switch / panel hide).
   * Design intent: keep dismiss logic local while parent can still invalidate open state.
   */
  active?: boolean;
}

/**
 * Compact ⓘ control + click bubble for field-level tips.
 * Non-modal on purpose: no focus trap — suited for short copy, not full reference sheets.
 */
export const AssessmentFieldHintBubble: FC<AssessmentFieldHintBubbleProps> = ({
  ariaLabel,
  tip,
  footer,
  active = true,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const bubbleId = `field-hint-bubble-${reactId.replace(/:/g, '')}`;

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-accent-info/55 bg-accent-info/10 text-sm leading-none text-accent-info ring-1 ring-accent-info/25 transition hover:border-accent-info hover:bg-accent-info/20 hover:text-sky-100"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={() => setOpen((value) => !value)}
      >
        ⓘ
      </button>
      {open ? (
        <div
          id={bubbleId}
          role="region"
          aria-label={ariaLabel}
          className="absolute right-0 top-full z-20 mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-accent-info/35 bg-zinc-950/95 px-3 py-2.5 shadow-lg shadow-black/40 backdrop-blur-sm"
        >
          <p className="text-xs leading-relaxed text-zinc-200">{tip}</p>
          {footer ? (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{footer}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default AssessmentFieldHintBubble;
