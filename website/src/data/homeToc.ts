/**
 * Homepage chapter TOC — single source for Navbar links and HomePage section ids.
 * Keep `hash` values identical to element `id`s on HomePage.
 */
export const HOME_TOC = [
  { hash: 'radar', label: '雷達即時預覽' },
  { hash: 'systems', label: '四大核心系統' },
  { hash: 'ladder', label: '14 階評級探測' },
  { hash: 'athletes', label: '實測背書牆' },
  { hash: 'plans', label: '方案與早鳥權益' },
] as const;

export type HomeTocHash = (typeof HOME_TOC)[number]['hash'];
