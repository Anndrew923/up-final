/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * WHY: Named `void` (not `base`) so it never collides with Tailwind’s
         * font-size utilities `text-base` / `sm:text-base` — that collision made
         * subtitle copy paint as #050505 (invisible on dark backgrounds).
         */
        void: '#050505',
        /** Homepage stage black — slightly lifted vs void for full-bleed section rhythm. */
        ink: '#06080B',
        /** Mindset upgrade steel-blue band — reads apart from ink systems. */
        steel: '#121A26',
        /** Systems night-violet stage — cool purple hall between steel and hall. */
        night: '#0D0A17',
        /** Ladder black-gold hall — warm brown-black stage. */
        hall: '#16110A',
        panel: '#0a0a0a',
        card: '#111111',
        brand: {
          DEFAULT: '#ff8c00',
          soft: '#ff8c001f',
        },
        /** Accent — eyebrows + text links only (Apple/WHOOP-style energy blue). */
        energy: '#38BDF8',
        /**
         * Copy ladder SSOT — Primary / Secondary / Muted.
         * WHY: Collapse 7–8 zinc/amber text utilities into three semantic FG tokens.
         */
        fg: {
          DEFAULT: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans TC"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        brand: '0 0 40px rgba(255, 140, 0, 0.18)',
        energy: '0 0 40px rgba(56, 189, 248, 0.14)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
    },
  },
  plugins: [],
};
