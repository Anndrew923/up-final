export default {
  plugins: {
    // WHY: Pin website config — monorepo root has another tailwind.config.ts without stage tokens.
    tailwindcss: { config: './tailwind.config.js' },
    autoprefixer: {},
  },
};
