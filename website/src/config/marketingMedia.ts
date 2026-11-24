/**
 * Marketing media SSOT for the homepage.
 * WHY: Poster/video paths stay out of presentational components — Hero and
 * Systems consume these without cross-importing UI modules. Athletes battle
 * cards live in `data/athletes.ts` (not ambient textures).
 *
 * Public stills:
 * - `/hero-poster.jpg` — product hero + Systems phone still
 * - `/og-image.png` — social share meta only (`index.html`); never a UI fill
 * - `/founder-battle-card.png` — referenced from athlete data SSOT
 * Video fields stay null until mp4 assets land.
 */

/** Full-bleed hero + Systems iPhone still (and video poster fallback). */
export const MARKETING_POSTER_SRC = '/hero-poster.jpg';

/** Hero looping background — set to `/hero-loop.mp4` (etc.) when the asset exists. */
export const HERO_VIDEO_SRC: string | null = null;

/** Systems iPhone frame demo loop — independent of hero so assets can ship separately. */
export const SYSTEM_VIDEO_SRC: string | null = null;
