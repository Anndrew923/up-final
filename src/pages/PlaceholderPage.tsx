import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export default function PlaceholderPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <main className="ui-shell max-w-2xl">
      <section className="ui-card space-y-3">
        <h1 className="text-lg font-semibold text-zinc-200">
          {t('placeholderTitle', { ns: 'common' })}
        </h1>
        <p className="text-sm text-zinc-400">
          {t('placeholderPath', { ns: 'common', path: pathname })}
        </p>
        <Link to={ROUTES.home} className="ui-btn ui-btn-primary inline-flex w-fit">
          {t('placeholderBackHome', { ns: 'common' })}
        </Link>
      </section>
    </main>
  );
}
