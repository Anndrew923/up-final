import { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../config/routes';
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

/**
 * Empty Club HQ — join by invite or create (Pro).
 * WHY: Single Guild Guard is page-level (`showEmpty` only when unbound) + server `already-in-guild`;
 * this surface must not carry a dead `hasGuild` prop that is always false while mounted.
 */
const CrewEmptyState: FC<CrewEmptyStateProps> = ({
  isPro,
  busy,
  actionError,
  onJoin,
  onCreate,
  onClearError,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');

  const handleCreateCta = () => {
    if (busy) return;
    // WHY: Non-Pro tap opens the shared Join Arena subscribe funnel (return → Club).
    if (!isPro) {
      navigate(joinArenaPath('pro-upsell', ROUTES.crew));
      return;
    }
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-bg-card/95 p-5 shadow-panel">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          {t('crew.empty.joinTitle')}
        </h2>
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

        {!showCreate || !isPro ? (
          <button
            type="button"
            className="ui-btn ui-btn-primary mt-4 w-full disabled:opacity-40"
            disabled={busy}
            onClick={handleCreateCta}
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
