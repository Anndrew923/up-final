/**
 * Site brand wordmark — Navbar / drawer / Footer SSOT.
 * WHY: Pure-white bold ZH + secondary EN must never drift across chrome surfaces.
 */
export const BRAND_NAME_CLASS =
  'font-bold text-white';

export const BRAND_SUB_CLASS =
  'text-xs font-medium tracking-wider text-fg-secondary';

export function BrandLockup({
  nameClassName,
  showSub = true,
}: {
  /** Size / truncate utilities layered on the shared bold white name. */
  nameClassName?: string;
  showSub?: boolean;
}) {
  return (
    <>
      <span className={`block ${BRAND_NAME_CLASS} ${nameClassName ?? ''}`}>
        最強肉體
      </span>
      {showSub ? (
        <span className={`block ${BRAND_SUB_CLASS}`}>ULTIMATE PHYSIQUE</span>
      ) : null}
    </>
  );
}
