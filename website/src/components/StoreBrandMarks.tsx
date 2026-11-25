/**
 * Decorative store marks shared by Hero CTAs + DownloadModal.
 * WHY: One SVG path set — Hero and modal stay visually locked without drift.
 */

export function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.22-1.98 1.09-3.13-1.06.04-2.34.7-3.1 1.58-.69.78-1.29 2.05-1.13 3.26 1.19.09 2.41-.62 3.14-1.71" />
    </svg>
  );
}

/** Four-color Play triangle mark — decorative only (not a trademark lockup). */
export function GooglePlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#00C3FF"
        d="M3.5 2.75A1.25 1.25 0 0 0 1.75 4v16A1.25 1.25 0 0 0 3.5 21.25L13 12 3.5 2.75Z"
      />
      <path
        fill="#FF3A44"
        d="M13 12 3.5 2.75a1.25 1.25 0 0 1 1.2-.35l13.1 7.45L13 12Z"
      />
      <path
        fill="#00F076"
        d="M13 12 17.8 14.15 4.7 21.6a1.25 1.25 0 0 1-1.2-.35L13 12Z"
      />
      <path
        fill="#FFD400"
        d="m17.8 9.85-4.8 2.15 4.8 2.15 1.55-.9a1.4 1.4 0 0 0 0-2.5l-1.55-.9Z"
      />
    </svg>
  );
}
