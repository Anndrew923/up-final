/**
 * Marketing media SSOT for the homepage.
 * WHY: Poster/video paths must not live inside presentational components — Systems /
 * Athletes / Hero all consume the same assets without cross-importing UI modules.
 *
 * Current `website/public/` inventory: `/og-image.png`, `/founder-battle-card.png`.
 * No dedicated training still or mp4 yet — video fields stay null until files land.
 */

/** Full-bleed / phone-frame still used when video is absent or fails. */
export const MARKETING_POSTER_SRC = '/og-image.png';

/** Hero looping background — set to `/hero-loop.mp4` (etc.) when the asset exists. */
export const HERO_VIDEO_SRC: string | null = null;

/** Systems iPhone frame demo loop — independent of hero so assets can ship separately. */
export const SYSTEM_VIDEO_SRC: string | null = null;
