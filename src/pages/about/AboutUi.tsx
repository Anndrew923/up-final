import { useState, type FC, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { AdvisorProfile } from './aboutI18n';

/** WHY: Absolute glow must not sit under `space-y` (margin-collapse gutter). Prefer flex/gap shells. */
export const AboutCard: FC<{
  title: string;
  accent?: boolean;
  children: ReactNode;
}> = ({ title, accent = false, children }) => (
  <section
    className={cn(
      'relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-bg-card/95 p-6 shadow-panel backdrop-blur',
      accent ? 'border-accent-info/35' : 'border-zinc-800'
    )}
  >
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl',
        accent ? 'bg-accent-info/15' : 'bg-zinc-500/10'
      )}
    />
    <h2
      className={cn(
        'relative text-sm font-semibold uppercase tracking-[0.15em]',
        accent ? 'text-accent-info' : 'text-zinc-400'
      )}
    >
      {title}
    </h2>
    <div className="relative flex flex-col gap-3">{children}</div>
  </section>
);

export const BulletList: FC<{ items: string[]; listKey: string }> = ({ items, listKey }) => (
  <ul className="flex list-none flex-col gap-2">
    {items.map((item, index) => (
      <li key={`${listKey}-${index}`} className="flex gap-2 text-sm leading-relaxed text-zinc-300">
        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-info" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const FounderListBlock: FC<{
  title: string;
  lead?: string;
  items: string[];
  listKey: string;
}> = ({ title, lead, items, listKey }) => {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
      {lead ? <p className="text-sm leading-relaxed text-zinc-300">{lead}</p> : null}
      <BulletList items={items} listKey={listKey} />
    </div>
  );
};

export const QuoteCallout: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="border-l-2 border-accent-info/60 pl-3 font-mono text-sm leading-relaxed text-accent-info">
    {children}
  </p>
);

export const FounderScoreBadge: FC<{ label: string; score: string }> = ({ label, score }) => (
  <dl className="flex items-center justify-between gap-3 rounded-xl border border-accent-info/30 bg-accent-info/5 px-4 py-3">
    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</dt>
    <dd className="font-mono text-lg font-semibold tabular-nums text-accent-info">{score}</dd>
  </dl>
);

function portraitInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}

/**
 * WHY: Keep avatar chrome presentational; hide broken assets behind an initial monogram
 * so About cards never show a broken-image icon in production.
 */
export const AboutPortrait: FC<{
  src: string;
  alt: string;
  size?: 'md' | 'lg';
}> = ({ src, alt, size = 'md' }) => {
  const [failed, setFailed] = useState(false);
  // WHY: ~80px (md) / ~88px (lg) keeps faces readable beside dense credential copy.
  const dimension = size === 'lg' ? 'h-[5.5rem] w-[5.5rem]' : 'h-20 w-20';

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full p-[2px]',
        'bg-gradient-to-br from-accent-info/70 via-zinc-700 to-zinc-900',
        'shadow-[0_0_18px_rgba(56,189,248,0.22)]'
      )}
    >
      <div
        className={cn(
          'overflow-hidden rounded-full border border-zinc-950/80 bg-zinc-900',
          dimension
        )}
      >
        {failed ? (
          <div
            aria-hidden
            className={cn(
              'flex h-full w-full items-center justify-center font-mono font-semibold text-accent-info/80',
              size === 'lg' ? 'text-xl' : 'text-lg'
            )}
          >
            {portraitInitial(alt)}
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
};

export const AdvisorCard: FC<AdvisorProfile & { imageSrc?: string }> = ({
  name,
  role,
  subtitle,
  bio,
  highlights,
  closing,
  imageSrc,
}) => (
  <article className="flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
    <header className="flex items-center gap-4">
      {imageSrc ? <AboutPortrait src={imageSrc} alt={name} /> : null}
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold text-zinc-100">{name}</h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{role}</p>
        {subtitle ? <p className="text-xs tracking-wide text-accent-info/90">{subtitle}</p> : null}
      </div>
    </header>
    <p className="text-sm leading-relaxed text-zinc-300">{bio}</p>
    <div className="border-t border-zinc-800/80 pt-3">
      <BulletList items={highlights} listKey={name} />
    </div>
    <QuoteCallout>{closing}</QuoteCallout>
  </article>
);
