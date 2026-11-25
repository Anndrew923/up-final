/**
 * Marketing media SSOT for the homepage.
 * WHY: Poster/video paths stay out of presentational components — Hero and
 * Systems consume these without cross-importing UI modules. Athletes battle
 * cards live in `data/athletes.ts` (not ambient textures).
 *
 * Public stills:
 * - `/hero-poster.jpg` — product hero + video poster fallback
 * - `/sys-01-1.png` … `/sys-01-4.png` — Systems「01 基準」App stills
 * - `/sys-02-1.jpg` … `/sys-02-5.jpg` — Systems「02 戰報」cards (composite → spec → run → arm → VJ)
 * - `/sys-03-1.png` … `/sys-03-3.png` — Systems「03 天梯」App stills
 * - `/sys-04-1.png` … `/sys-04-5.png` — Systems「04 工具」App stills (INTEL → compare → archive → morph → 1RM)
 * - Append further stills to each `SYSTEM_PREVIEWS` array for snap carousel
 * - `/og-image.png` — social share meta only (`index.html`); never a UI fill
 * - `/founder-battle-card.png` — referenced from athlete data SSOT
 * - `/images/explainer-cover.jpg` — Explainer facade still (null until asset lands)
 * - `/videos/explainer.mp4` — Explainer click-to-play (Facade mounts only on click)
 * Video fields stay null until mp4 assets land (except explainer video path,
 * which is wired for on-demand load + onError fallback before the file ships).
 */

/**
 * Hero full-bleed + video poster fallback.
 * Also empty-array safety for Systems lightbox/carousel (all four tabs ship real stills).
 */
export const MARKETING_POSTER_SRC = '/hero-poster.jpg';

/**
 * Systems「01 基準」carousel — narrative order:
 * performance radar → body baseline → strength input → FFMI readout.
 */
export const SYS_01_PREVIEWS = [
  '/sys-01-1.png',
  '/sys-01-2.png',
  '/sys-01-3.png',
  '/sys-01-4.png',
] as const;

/**
 * Systems「02 戰報」carousel — narrative order:
 * selfie+radar composite → aesthetic spec → 12-min run PR → arm girth → vertical jump.
 */
export const SYS_02_PREVIEWS = [
  '/sys-02-1.jpg',
  '/sys-02-2.jpg',
  '/sys-02-3.jpg',
  '/sys-02-4.jpg',
  '/sys-02-5.jpg',
] as const;

/**
 * Systems「03 天梯」carousel — narrative order:
 * live ladder list → dual-radar VS duel → detailed filters.
 */
export const SYS_03_PREVIEWS = [
  '/sys-03-1.png',
  '/sys-03-2.png',
  '/sys-03-3.png',
] as const;

/**
 * Systems「04 工具」carousel — narrative order:
 * DYNO INTEL chat → evolution compare → archive → morphology → 1RM calculator.
 */
export const SYS_04_PREVIEWS = [
  '/sys-04-1.png',
  '/sys-04-2.png',
  '/sys-04-3.png',
  '/sys-04-4.png',
  '/sys-04-5.png',
] as const;

/** Systems tab ids — keys for `SYSTEM_PREVIEWS` carousel arrays. */
export type SystemTabId = '01' | '02' | '03' | '04';

/**
 * Per-tab iPhone stills (1+). Length > 1 enables snap carousel chrome.
 * WHY: Named `SYS_0N_PREVIEWS` arrays keep every tab on the same append path.
 */
export const SYSTEM_PREVIEWS: Record<SystemTabId, readonly string[]> = {
  '01': SYS_01_PREVIEWS,
  '02': SYS_02_PREVIEWS,
  '03': SYS_03_PREVIEWS,
  '04': SYS_04_PREVIEWS,
};

/** Hero looping background — set to `/hero-loop.mp4` (etc.) when the asset exists. */
export const HERO_VIDEO_SRC: string | null = null;

/**
 * Systems demo loop for any future single-still tab — independent of hero.
 * Multi-still tabs (01–04 today) ignore this and keep the image carousel.
 */
export const SYSTEM_VIDEO_SRC: string | null = null;

/**
 * Explainer facade still — null until `public/images/explainer-cover.jpg` lands.
 * WHY null SSOT: avoids a first-paint 404 while the lab-grid fallback stays painted.
 */
export const EXPLAINER_POSTER_SRC: string | null = null;

/**
 * Explainer click-to-play source.
 * WHY path kept (not null): Facade never mounts `<video>` until click; missing
 * file hits onError → dashboard fallback. Flip-ready when the mp4 is dropped in.
 */
export const EXPLAINER_VIDEO_SRC = '/videos/explainer.mp4';
