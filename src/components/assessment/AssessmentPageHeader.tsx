import type { FC } from 'react';

export interface AssessmentPageHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
}

/**
 * Shared page title block — single column.
 * WHY: Back lives in AppShell HUD (fixed top-left); keeping it out of scroll content
 * avoids duplicate affordances and matches iOS-style persistent chrome.
 */
export const AssessmentPageHeader: FC<AssessmentPageHeaderProps> = ({
  kicker,
  title,
  subtitle,
}) => {
  return (
    <header className="min-w-0 space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
        {kicker}
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{title}</h1>
      {subtitle ? (
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{subtitle}</p>
      ) : null}
    </header>
  );
};
