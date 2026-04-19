import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
} satisfies Config;
