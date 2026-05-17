import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /** Scroll padding under fixed HUD — pair with `AppShell` `pt-shell-top` and page `sticky top-shell-top`. */
      spacing: {
        'shell-top': '4rem',
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
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
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
      },
      animation: {
        'diagnostic-scan': 'diagnostic-scan 1.75s linear infinite',
        'diagnostic-grid-breathe': 'diagnostic-grid-breathe 2.5s ease-in-out infinite',
        'breakthrough-enter': 'breakthrough-enter 420ms ease-out forwards',
        'aura-pulse': 'aura-pulse 2.4s ease-in-out infinite',
        'aura-flow': 'aura-flow 3.2s ease-in-out infinite alternate',
        'aura-shimmer': 'aura-shimmer 2.8s ease-in-out infinite alternate',
        'aura-lightning': 'aura-lightning 1.1s ease-in-out infinite',
        'aura-void': 'aura-void 8s linear infinite',
        'aura-divine': 'aura-divine 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
