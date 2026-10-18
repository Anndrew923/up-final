/**
 * Scoped CSS strings for PK clash choreography.
 * WHY: Keep HexRadarChart / Banner free of duplicated keyframe boilerplate.
 */

import { RADAR_PK_CLASH_MOTION } from '../../logic/core/radarPkClashMotion';

/** Quiet compare unfold / fade / win-pulse sheet keyed by SVG animation id. */
export function buildRadarPkCompareStyleSheet(animationId: string): string {
  const m = RADAR_PK_CLASH_MOTION;
  return `
          @media (prefers-reduced-motion: no-preference) {
            .radar-pk-compare-enter-${animationId} {
              transform-origin: 0px 0px;
              animation: radar-pk-compare-enter-${animationId} ${m.compareEnterMs}ms ${m.easing} both;
              will-change: transform, opacity;
            }
            .radar-pk-compare-exit-${animationId} {
              transform-origin: 0px 0px;
              animation: radar-pk-compare-exit-${animationId} ${m.compareExitMs}ms ease-out both;
              will-change: opacity, transform;
            }
            .radar-pk-win-pulse-${animationId} {
              transform-box: fill-box;
              transform-origin: center;
              animation: radar-pk-win-pulse-${animationId} ${m.winPulseMs}ms ease-out ${m.winPulseDelayMs}ms both;
              will-change: transform, opacity;
            }
            @keyframes radar-pk-compare-enter-${animationId} {
              from {
                transform: scale(0.15);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes radar-pk-compare-exit-${animationId} {
              from {
                transform: scale(1);
                opacity: 1;
              }
              to {
                transform: scale(0.96);
                opacity: 0;
              }
            }
            @keyframes radar-pk-win-pulse-${animationId} {
              0% {
                opacity: 0.35;
                transform: scale(0.72);
              }
              55% {
                opacity: 1;
                transform: scale(1.18);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .radar-pk-compare-enter-${animationId},
            .radar-pk-compare-exit-${animationId},
            .radar-pk-win-pulse-${animationId} {
              animation: none !important;
            }
          }
        `;
}

/** VS banner slide / pop / badge / exit sheet keyed by banner anim id. */
export function buildRadarPkBannerStyleSheet(animId: string): string {
  const m = RADAR_PK_CLASH_MOTION;
  return `
        @media (prefers-reduced-motion: no-preference) {
          .radar-pk-banner-slide-left-${animId} {
            animation: radar-pk-banner-slide-left-${animId} ${m.bannerSlideMs}ms ${m.easing} both;
            will-change: transform, opacity;
          }
          .radar-pk-banner-slide-right-${animId} {
            animation: radar-pk-banner-slide-right-${animId} ${m.bannerSlideMs}ms ${m.easing} both;
            will-change: transform, opacity;
          }
          .radar-pk-banner-vs-${animId} {
            animation: radar-pk-banner-vs-${animId} ${m.bannerVsMs}ms ${m.easing} both;
            will-change: transform, opacity;
          }
          .radar-pk-banner-badge-${animId} {
            animation: radar-pk-banner-badge-${animId} ${m.bannerBadgeMs}ms ${m.easing} ${m.bannerBadgeDelayMs}ms both;
            will-change: transform, opacity;
          }
          .radar-pk-banner-exit-${animId} {
            animation: radar-pk-banner-exit-${animId} ${m.compareExitMs}ms ease-out both;
            will-change: opacity;
          }
          @keyframes radar-pk-banner-slide-left-${animId} {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes radar-pk-banner-slide-right-${animId} {
            from { opacity: 0; transform: translateX(12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes radar-pk-banner-vs-${animId} {
            from { opacity: 0; transform: scale(0.85); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes radar-pk-banner-badge-${animId} {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes radar-pk-banner-exit-${animId} {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .radar-pk-banner-slide-left-${animId},
          .radar-pk-banner-slide-right-${animId},
          .radar-pk-banner-vs-${animId},
          .radar-pk-banner-badge-${animId},
          .radar-pk-banner-exit-${animId} {
            animation: none !important;
          }
        }
      `;
}
