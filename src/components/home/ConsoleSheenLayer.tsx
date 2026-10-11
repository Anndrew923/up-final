import type { FC } from 'react';

/**
 * Diagonal platinum sheen host (WHY): Presentational-only — animation is driven by a
 * parent `.is-surging` so React does not carry a second ritual boolean.
 */
export const ConsoleSheenLayer: FC = () => (
  <span aria-hidden className="ui-console-sheen-layer" />
);

export default ConsoleSheenLayer;
