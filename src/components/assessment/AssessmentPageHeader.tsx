import type { FC, ReactNode } from 'react';

export interface AssessmentPageHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  /**
   * Optional profile / scoring baseline chips (gender, age, weight).
   * WHY: Keep meta inside the header so ShellFlowStack gaps do not invent a tall void
   * between the title and the primary form card.
   */
  meta?: ReactNode;
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
  meta,
}) => {
  return (
    <header className="min-w-0 space-y-1">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
        {kicker}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">{title}</h1>
      {subtitle ? (
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{subtitle}</p>
      ) : null}
      {meta ? <div className="pt-0.5">{meta}</div> : null}
    </header>
  );
};
