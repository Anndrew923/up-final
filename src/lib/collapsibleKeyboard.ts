import type { KeyboardEvent } from 'react';

/** Space/Enter activation for collapsible toggle buttons (shared a11y behavior). */
export function onCollapsibleToggleKeyDown(
  e: KeyboardEvent<HTMLButtonElement>,
  onToggle: () => void
): void {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  onToggle();
}
