/**
 * Shared Guilloche UP monogram geometry (SVG viewBox units, center 48,48).
 * WHY: DOM AestheticSpecCard and offline certificate PNG must stroke the same mark —
 * duplicating polylines drifts optical center and breaks 1:1 crest fidelity.
 */
export const GUILLOCHE_MONOGRAM_CENTER = 48;

export const GUILLOCHE_UP_POLYLINES: ReadonlyArray<
  ReadonlyArray<readonly [number, number]>
> = [
  [
    [48, 38],
    [48, 58],
  ],
  [
    [38, 40],
    [38, 54],
    [42, 58],
    [48, 58],
  ],
  [
    [48, 38],
    [54, 38],
    [58, 42],
    [58, 46],
    [54, 50],
    [48, 50],
  ],
] as const;

/** SVG `d` attributes derived from the polyline SSOT. */
export const GUILLOCHE_UP_SVG_PATHS = GUILLOCHE_UP_POLYLINES.map((points) =>
  points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]} ${point[1]}`)
    .join(' ')
);
