/**
 * Certificate cascade timings — one clock, CSS animations consume the delays.
 * WHY: Resting DOM is the finished stamp; revealing only adds keyframes under data-cert-phase.
 */
export const CERT_REVEAL_MS = 850;

export const CERT_NEEDLE_STAGGER_MS = [220, 260, 300, 340] as const;

export type CertRevealPhase = 'revealing' | 'done';

/** Additive reveal classes — JIT-safe literals so Tailwind emits the group-data variants. */
export const CERT_PLATE_REVEAL_CLASS =
  'group-data-[cert-phase=revealing]:animate-cert-plate';

export const CERT_STAMP_REVEAL_CLASS =
  'group-data-[cert-phase=revealing]:animate-cert-stamp';

export const CERT_BADGE_REVEAL_CLASS =
  'group-data-[cert-phase=revealing]:animate-cert-badge';

export const CERT_FOOTER_REVEAL_CLASS =
  'group-data-[cert-phase=revealing]:animate-cert-footer';

export const CERT_NEEDLE_REVEAL_CLASS =
  'group-data-[cert-phase=revealing]:animate-cert-needle';

export const CERT_VEIL_REVEAL_CLASS =
  'group-data-[cert-phase=revealing]:animate-cert-veil';
