import { useTranslation } from 'react-i18next';
import type { NavItemConfig } from '../../config/nav.config';

export type NavTabLabelsProps = {
  labelKey: NavItemConfig['labelKey'];
  /** Highlights title line (active tab or boot spotlight). */
  accent?: boolean;
  className?: string;
};

/**
 * Dual-line cockpit nav labels: locale `title` + micro English `code`.
 * Hides `code` when identical to `title` (English locale).
 * WHY `min-[360px]` on code: five-tab row needs ~72px/slot; below 360px viewport the second line forces horizontal overflow.
 */
export function NavTabLabels({ labelKey, accent = false, className = '' }: NavTabLabelsProps) {
  const { t } = useTranslation();
  const title = t(`${labelKey}.title`, { ns: 'common' });
  const code = t(`${labelKey}.code`, { ns: 'common' });
  const showCode = Boolean(code) && code !== title;

  return (
    <span className={['flex w-full min-w-0 flex-col items-center leading-none', className].join(' ')}>
      <span
        className={[
          'w-full truncate text-center text-[10px] font-medium sm:text-[11px]',
          accent ? 'text-cyan-200' : 'text-zinc-300',
        ].join(' ')}
      >
        {title}
      </span>
      {showCode ? (
        <span className="mt-0.5 hidden w-full truncate text-center text-[8px] font-mono uppercase tracking-tight text-zinc-500 min-[360px]:block sm:text-[9px]">
          {code}
        </span>
      ) : null}
    </span>
  );
}
