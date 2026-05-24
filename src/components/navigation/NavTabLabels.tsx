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
 */
export function NavTabLabels({ labelKey, accent = false, className = '' }: NavTabLabelsProps) {
  const { t } = useTranslation();
  const title = t(`${labelKey}.title`, { ns: 'common' });
  const code = t(`${labelKey}.code`, { ns: 'common' });
  const showCode = Boolean(code) && code !== title;

  return (
    <span className={['flex w-[4.5rem] flex-col items-center leading-none', className].join(' ')}>
      <span
        className={[
          'text-center text-[11px] font-medium',
          accent ? 'text-cyan-200' : 'text-zinc-300',
        ].join(' ')}
      >
        {title}
      </span>
      {showCode ? (
        <span className="mt-0.5 text-center text-[9px] font-mono uppercase tracking-tight text-zinc-500">
          {code}
        </span>
      ) : null}
    </span>
  );
}
