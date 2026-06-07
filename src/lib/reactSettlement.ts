/** Yields until after the next paint so store/state updates from persist are visible to hooks. */
export function waitForReactSettlement(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
