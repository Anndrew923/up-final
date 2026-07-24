import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/** Fine grain for frosted-glass CTA — SVG turbulence, no external asset. */
const DIAGNOSTICS_GLASS_NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
)}")`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /**
       * Scroll offset under the fixed HUD (`AppShell` `shell-hud-slot`).
       *
       * Design intent (WHY): A fixed `4rem` ignored notch safe-area and overshot the HUD on
       * desktop, stacking dead air above every tab. This token must mirror the HUD slot exactly:
       * `pt-[env(safe-area-inset-top)]` + `min-h-14` (3.5rem) so scroll content clears the HUD
       * slot. Home / ladder / join-arena / tools **tab** use `shell-top-compact` instead (denser layout).
       * Calculator `/tools/*` pages keep full `shell-top` so top-right back clears the HUD.
       */
      spacing: {
        'shell-top': 'calc(env(safe-area-inset-top, 0px) + 3.5rem)',
        /**
         * Compact scroll/sticky offset for home + ladder + join-arena + tools tab (WHY): Denser than `shell-top`;
         * targets ~4–6px under the HUD icon row. AppShell: `pt-shell-top-compact`.
         * Calculator `/tools/*` subpages keep full `shell-top` so top-right back clears HUD.
         * Ladder sticky: `top-shell-top-compact`. Re-QA on notched devices if this value changes.
         */
        'shell-top-compact': 'calc(env(safe-area-inset-top, 0px) + 1.75rem)',
        /** @deprecated Use `shell-top-compact` — alias kept for existing class names during migration. */
        'shell-top-ladder': 'calc(env(safe-area-inset-top, 0px) + 1.75rem)',
      },
      colors: {
        bg: {
          base: '#050505',
          panel: '#0a0a0a',
          card: '#111111',
        },
        accent: {
          primary: '#ff8c00',
          primarySoft: '#ff8c001f',
          info: '#00bfff',
        },
      },
      borderRadius: {
        xl2: '1rem',
      },
      boxShadow: {
        panel: '0 10px 30px rgba(0,0,0,0.35)',
      },
      keyframes: {
        'diagnostic-scan': {
          '0%': { transform: 'translate3d(0, -110%, 0)' },
          '100%': { transform: 'translate3d(0, 210%, 0)' },
        },
        'diagnostic-grid-breathe': {
          '0%, 100%': {
            opacity: '0.1',
            transform: 'translate3d(0, 0, 0) scale(1)',
          },
          '50%': {
            opacity: '0.26',
            transform: 'translate3d(0, 0, 0) scale(1.015)',
          },
        },
        'breakthrough-enter': {
          '0%': { opacity: '0', transform: 'scale3d(0.92, 0.92, 1)' },
          '100%': { opacity: '1', transform: 'scale3d(1, 1, 1)' },
        },
        'aura-bleed-enter': {
          '0%': { opacity: '0', transform: 'scale3d(0.78, 0.78, 1)' },
          '100%': { opacity: '1', transform: 'scale3d(1, 1, 1)' },
        },
        'tachometer-glow-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
        },
        'aura-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'aura-flow': {
          '0%': { transform: 'translate3d(-30%, 0, 0)' },
          '100%': { transform: 'translate3d(30%, 0, 0)' },
        },
        'aura-shimmer': {
          '0%': { transform: 'translate3d(-40%, 0, 0) rotate(0deg)' },
          '100%': { transform: 'translate3d(40%, 0, 0) rotate(0deg)' },
        },
        'aura-lightning': {
          '0%, 100%': { opacity: '0.5' },
          '25%': { opacity: '1' },
          '50%': { opacity: '0.65' },
          '75%': { opacity: '0.95' },
        },
        'aura-void': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '100%': { transform: 'rotate(360deg) scale(1.02)' },
        },
        'aura-divine': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        /** Track-mode diagnostics CTA — box-shadow only for compositor-friendly breathe. */
        'track-mode-glow': {
          '0%, 100%': {
            boxShadow:
              'inset 0 0 14px rgba(255, 149, 0, 0.1), 0 0 10px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.15)',
          },
          '50%': {
            boxShadow:
              'inset 0 0 18px rgba(255, 149, 0, 0.16), 0 0 14px rgba(255, 149, 0, 0.42), 0 0 26px rgba(255, 149, 0, 0.2)',
          },
        },
        /** Join Arena Pro CTA — background-position shimmer (compositor-friendly). */
        'arena-cta-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        /** Ladder bullet — slow radar ring on feature icon halo. */
        'arena-radar-sweep': {
          '0%': { transform: 'rotate(0deg)', opacity: '0.35' },
          '50%': { opacity: '0.95' },
          '100%': { transform: 'rotate(360deg)', opacity: '0.35' },
        },
        /** Cloud sync bullet — gentle breathe on icon glow. */
        'arena-cloud-breathe': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.12)' },
        },
        /** Arena telemetry bullet — subtle pulse. */
        'arena-telemetry-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'report-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'diagnostic-scan': 'diagnostic-scan 1.75s linear infinite',
        'diagnostic-grid-breathe': 'diagnostic-grid-breathe 2.5s ease-in-out infinite',
        'breakthrough-enter': 'breakthrough-enter 420ms ease-out forwards',
        'aura-bleed-enter': 'aura-bleed-enter 520ms ease-out forwards',
        'tachometer-glow-pulse': 'tachometer-glow-pulse 2s ease-in-out infinite',
        'aura-pulse': 'aura-pulse 2.4s ease-in-out infinite',
        'aura-flow': 'aura-flow 3.2s ease-in-out infinite alternate',
        'aura-shimmer': 'aura-shimmer 2.8s ease-in-out infinite alternate',
        'aura-lightning': 'aura-lightning 1.1s ease-in-out infinite',
        'aura-void': 'aura-void 8s linear infinite',
        'aura-divine': 'aura-divine 2.2s ease-in-out infinite',
        'track-mode-glow': 'track-mode-glow 4s ease-in-out infinite',
        'arena-cta-shimmer': 'arena-cta-shimmer 4.5s ease-in-out infinite',
        'arena-radar-sweep': 'arena-radar-sweep 6s linear infinite',
        'arena-cloud-breathe': 'arena-cloud-breathe 2.8s ease-in-out infinite',
        'arena-telemetry-pulse': 'arena-telemetry-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.magitek-chassis-grid': {
          position: 'relative',
          isolation: 'isolate',
        },
        '.magitek-chassis-grid::before': {
          content: '""',
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: '0.05',
          zIndex: '0',
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent 0, transparent 15px, rgba(255,255,255,1) 15px, rgba(255,255,255,1) 16px)',
            'repeating-linear-gradient(90deg, transparent 0, transparent 15px, rgba(255,255,255,1) 15px, rgba(255,255,255,1) 16px)',
            'repeating-linear-gradient(45deg, transparent 0, transparent 22px, rgba(255,255,255,0.55) 22px, rgba(255,255,255,0.55) 23px)',
          ].join(', '),
          backgroundSize: '16px 16px, 16px 16px, 32px 32px',
        },
        '.text-aura-neon': {
          textShadow:
            '0 0 5px rgb(var(--aura-neon-rgb) / 0.95), 0 0 10px rgb(var(--aura-neon-rgb) / 0.55), 0 0 18px rgb(var(--aura-neon-rgb) / 0.28)',
        },
        '.tachometer-fill-glow': {
          filter:
            'drop-shadow(0 0 6px rgb(var(--aura-neon-rgb) / 0.55)) drop-shadow(0 0 14px rgb(var(--aura-neon-rgb) / 0.28))',
        },
        '.ui-btn-diagnostics': {
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
        },
        '.ui-btn-diagnostics-glass': {
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          backgroundColor: 'rgba(32, 32, 32, 0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          willChange: 'backdrop-filter',
          transform: 'translateZ(0)',
        },
        '.ui-btn-diagnostics-noise': {
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: '0.07',
          mixBlendMode: 'overlay',
          backgroundImage: DIAGNOSTICS_GLASS_NOISE,
          backgroundSize: '128px 128px',
        },
        '.ui-btn-diagnostics-inset-glow': {
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 16px rgba(255, 149, 0, 0.12)',
        },
        /** Animated neon halo — isolated from button hover so shadow breathe stays smooth. */
        '.ui-btn-diagnostics-glow': {
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: '0',
          boxShadow:
            'inset 0 0 14px rgba(255, 149, 0, 0.1), 0 0 10px rgba(255, 149, 0, 0.3), 0 0 20px rgba(255, 149, 0, 0.15)',
        },
      });
    }),
  ],
} satisfies Config;
