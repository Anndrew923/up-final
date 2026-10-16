import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { joinArenaPath } from '../../lib/joinArenaNavigation';
import type { GuildCallableFailureReason } from '../../services/guildCallableService';

export interface CrewEmptyStateProps {
  isPro: boolean;
  busy: boolean;
  actionError: GuildCallableFailureReason | null;
  onJoin: (code: string) => Promise<unknown>;
  onCreate: (input: { name: string; tag: string }) => Promise<unknown>;
  onClearError: () => void;
}

const CrewEmptyState: FC<CrewEmptyStateProps> = ({
  isPro,
  busy,
  actionError,
  onJoin,
  onCreate,
  onClearError,
}) => {
  const { t } = useTranslation('common');
  const [code, setCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-bg-card/95 p-5 shadow-panel">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          {t('crew.empty.joinTitle')}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{t('crew.empty.joinHint')}</p>
        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">{t('crew.empty.codeLabel')}</span>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            value={code}
            disabled={busy}
            onChange={(e) => {
              onClearError();
              setCode(e.target.value);
            }}
            placeholder={t('crew.empty.codePlaceholder')}
            className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
          />
        </label>
        <button
          type="button"
          className="ui-btn ui-btn-primary mt-4 w-full disabled:opacity-40"
          disabled={busy || !code.trim()}
          onClick={() => void onJoin(code)}
        >
          {busy ? t('crew.empty.joining') : t('crew.empty.joinCta')}
        </button>
      </section>

      <section className="rounded-2xl border border-accent-primary/25 bg-gradient-to-br from-bg-card via-bg-panel to-bg-card p-5 shadow-panel">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-primary">
          {t('crew.empty.createTitle')}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{t('crew.empty.createHint')}</p>

        {!isPro ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-amber-200/90">{t('crew.empty.proRequired')}</p>
            <Link to={joinArenaPath('ladder')} className="ui-btn ui-btn-primary inline-flex">
              {t('crew.empty.upgradeCta')}
            </Link>
          </div>
        ) : !showCreate ? (
          <button
            type="button"
            className="ui-btn ui-btn-primary mt-4 w-full"
            disabled={busy}
            onClick={() => setShowCreate(true)}
          >
            {t('crew.empty.createCta')}
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">{t('crew.empty.nameLabel')}</span>
              <input
                type="text"
                maxLength={24}
                value={name}
                disabled={busy}
                onChange={(e) => {
                  onClearError();
                  setName(e.target.value);
                }}
                placeholder={t('crew.empty.namePlaceholder')}
                className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">{t('crew.empty.tagLabel')}</span>
              <input
                type="text"
                maxLength={4}
                value={tag}
                disabled={busy}
                onChange={(e) => {
                  onClearError();
                  setTag(e.target.value.toUpperCase());
                }}
                placeholder={t('crew.empty.tagPlaceholder')}
                className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none"
              />
              <span className="block text-[10px] text-zinc-500">{t('crew.empty.tagHint')}</span>
            </label>
            <button
              type="button"
              className="ui-btn ui-btn-primary w-full disabled:opacity-40"
              disabled={busy || !name.trim() || !tag.trim()}
              onClick={() => void onCreate({ name, tag })}
            >
              {busy ? t('crew.empty.creating') : t('crew.empty.createCta')}
            </button>
          </div>
        )}
      </section>

      {actionError ? (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {t(`crew.errors.${actionError}`)}
        </p>
      ) : null}
    </div>
  );
};

export default CrewEmptyState;
