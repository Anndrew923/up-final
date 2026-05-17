import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { VehicleClassId } from '../../logic/core/vehicleResolver';

export interface HomeDiagnosticsPanelProps {
  vehicleClassId: VehicleClassId;
  disabled?: boolean;
  onStartDiagnostics: () => void;
}

const HomeDiagnosticsPanel: FC<HomeDiagnosticsPanelProps> = ({
  vehicleClassId,
  disabled = false,
  onStartDiagnostics,
}) => {
  const { t } = useTranslation('common');

  return (
    <section className="w-full max-w-md rounded-lg border border-zinc-800/80 bg-bg-panel/35 p-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {t('home.diagnostics.kicker')}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-zinc-100">
        {t(`identity.archetypes.${vehicleClassId}.title`)}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        {t('home.diagnostics.archetypeHint')}
      </p>
      <button
        type="button"
        className="relative mt-4 w-full overflow-hidden rounded-md border border-accent-primary/40 bg-zinc-950/70 px-4 py-3 text-left motion-reduce:animate-none motion-safe:transition-[border-color,box-shadow] motion-safe:duration-300 hover:border-accent-info/55 disabled:pointer-events-none disabled:opacity-40"
        disabled={disabled}
        onClick={onStartDiagnostics}
      >
        <span
          className="pointer-events-none absolute inset-0 animate-aura-pulse bg-gradient-to-r from-accent-primary/10 via-accent-info/15 to-accent-primary/10 motion-reduce:animate-none"
          aria-hidden
        />
        <span className="relative block font-mono text-[10px] uppercase tracking-[0.22em] text-accent-primary/90">
          {t('home.diagnostics.ctaSub')}
        </span>
        <span className="relative mt-1 block text-sm font-semibold text-zinc-100">
          {t('home.diagnostics.cta')}
        </span>
      </button>
    </section>
  );
};

export default HomeDiagnosticsPanel;
