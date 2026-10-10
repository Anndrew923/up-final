import type { FC } from 'react';

/** Tiny monoline glyphs for SettingsListRow — no icon-font dependency. */
export const SettingsGlyph: FC<{ label: string }> = ({ label }) => (
  <span className="font-mono text-[10px] uppercase tracking-wide">{label}</span>
);
