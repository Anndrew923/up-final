import type { KeyboardEvent } from 'react';

/**
 * Soft-keyboard focus: keep the focused field clear of the IME without jumping the whole form.
 * WHY: `nearest` avoids large scroll jumps on short calculator forms while still clearing the caret.
 */
export function scrollFocusedInputIntoView(target: HTMLElement): void {
  target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** Enter / IME "Next|Done" → run action (focus next field or submit calculate). */
export function onInputEnterKey(
  event: KeyboardEvent<HTMLInputElement>,
  action: () => void
): void {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  action();
}
