import type { ReactNode } from 'react';

type DocHeroTone = 'amber' | 'sky';

/**
 * Absolute-only header wash for longform doc pages (/pricing, /science).
 * WHY: Zero layout height — first-viewport geometry unchanged; tone picks the
 * radial so pricing↔plans amber seam and science lab blue stay intentional.
 */
const TONE: Record<
  DocHeroTone,
  { glow: string; border: string; gridOpacity: string }
> = {
  amber: {
    glow: 'bg-[radial-gradient(ellipse_at_50%_-10%,rgba(245,158,11,0.07),transparent_55%)]',
    border: 'border-amber-400/15',
    gridOpacity: 'opacity-[0.35]',
  },
  sky: {
    glow: 'bg-[radial-gradient(ellipse_at_50%_-10%,rgba(56,189,248,0.07),transparent_55%)]',
    border: 'border-sky-400/15',
    gridOpacity: 'opacity-[0.4]',
  },
};

export function DocPageHeroAtmosphere({
  tone,
  children,
}: {
  tone: DocHeroTone;
  children: ReactNode;
}) {
  const { glow, border, gridOpacity } = TONE[tone];

  return (
    <section
      className={`relative overflow-hidden border-b bg-panel/50 ${border}`}
    >
      <div className={`pointer-events-none absolute inset-0 ${glow}`} aria-hidden />
      <div
        className={`pointer-events-none absolute inset-0 bg-grid-faint bg-grid [mask-image:linear-gradient(to_bottom,black_15%,transparent_90%)] ${gridOpacity}`}
        aria-hidden
      />
      <div className="ui-container relative z-10 py-8 sm:py-16">{children}</div>
    </section>
  );
}
