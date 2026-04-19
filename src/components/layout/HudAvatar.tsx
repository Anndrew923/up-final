import { useTranslation } from 'react-i18next';
import { useLocalProfileBrief } from '../../hooks/useLocalProfileBrief';

/** Commander avatar slot — initials from local profile (`localStorage`). */
export default function HudAvatar() {
  const { t } = useTranslation();
  const { initial, displayName } = useLocalProfileBrief();

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent-info/55 bg-zinc-900 text-base font-semibold uppercase text-zinc-100 shadow-[0_0_14px_theme(colors.accent.info_/_0.35)]"
      title={displayName ?? t('shellAvatarFallback', { ns: 'common' })}
      aria-label={t('shellAvatarAria', { ns: 'common', initial })}
    >
      {initial}
    </div>
  );
}
