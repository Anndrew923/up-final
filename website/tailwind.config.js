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
        panel: '#0a0a0a',
        card: '#111111',
        brand: {
          DEFAULT: '#ff8c00',
          soft: '#ff8c001f',
        },
        energy: '#00bfff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Noto Serif TC"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        brand: '0 0 40px rgba(255, 140, 0, 0.18)',
        energy: '0 0 40px rgba(0, 191, 255, 0.14)',
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
