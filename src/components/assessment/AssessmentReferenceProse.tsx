import type { FC, HTMLAttributes, OlHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Design Intent (WHY): One typography contract for every assessment reference disclosure — eliminates per-page zinc/mono/size drift. */
export const ASSESSMENT_REFERENCE_PANEL_BODY_CLASS =
  'space-y-3 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400';

/** Slightly roomier rhythm for multi-section panels (tables, ordered lists). */
export const ASSESSMENT_REFERENCE_STRUCTURED_PANEL_BODY_CLASS =
  'space-y-4 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-400';

export const ReferenceParagraph: FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn(className)} {...props} />;

export const ReferenceLead: FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('font-medium text-zinc-200', className)} {...props} />;

export const ReferenceFootnote: FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('text-zinc-500', className)} {...props} />;

export const ReferenceCallout: FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('text-amber-100/90', className)} {...props} />;

export interface ReferenceLabelledLineProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export const ReferenceLabelledLine: FC<ReferenceLabelledLineProps> = ({
  label,
  children,
  className,
}) => (
  <p className={className}>
    <span className="font-medium text-zinc-200">{label}</span> {children}
  </p>
);

export interface ReferenceSimpleCopyProps {
  /** Pre-translated body paragraphs in display order. */
  paragraphs: readonly ReactNode[];
  footnote?: ReactNode;
}

/** Flat reference copy (body paragraphs + optional footnote) shared by most assessment pages. */
export const ReferenceSimpleCopy: FC<ReferenceSimpleCopyProps> = ({ paragraphs, footnote }) => (
  <>
    {paragraphs.map((paragraph, index) => (
      <ReferenceParagraph key={index}>{paragraph}</ReferenceParagraph>
    ))}
    {footnote != null ? <ReferenceFootnote>{footnote}</ReferenceFootnote> : null}
  </>
);

export const ReferenceBulletList: FC<HTMLAttributes<HTMLUListElement>> = ({
  className,
  ...props
}) => <ul className={cn('list-inside list-disc space-y-1', className)} {...props} />;

export const ReferenceDataBlock: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5',
      className,
    )}
    {...props}
  />
);

export const ReferenceDataList: FC<HTMLAttributes<HTMLUListElement>> = ({
  className,
  ...props
}) => (
  <ul
    className={cn(
      'list-inside list-disc space-y-1.5 font-mono tabular-nums text-zinc-300',
      className,
    )}
    {...props}
  />
);

export const ReferenceSection: FC<HTMLAttributes<HTMLElement>> = ({
  className,
  ...props
}) => (
  <section className={cn('space-y-3 border-t border-zinc-800/80 pt-4', className)} {...props} />
);

export const ReferenceSectionTitle: FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3 className={cn('text-sm font-medium tracking-tight text-zinc-200', className)} {...props} />
);

export const ReferenceSectionHint: FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('text-zinc-500', className)} {...props} />;

export const ReferenceOrderedList: FC<OlHTMLAttributes<HTMLOListElement>> = ({
  className,
  ...props
}) => <ol className={cn('list-decimal space-y-2 pl-5', className)} {...props} />;
