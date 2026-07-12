import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SomatochartView from '../components/tools/SomatochartView';
import SomatotypeGapGauge from '../components/tools/SomatotypeGapGauge';
import { useSomatotypeLab } from '../hooks/useSomatotypeLab';

export interface SomatotypeLabPageProps {
  onBack?: () => void;
}

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent-primary/60';

const SomatotypeLabPage: FC<SomatotypeLabPageProps> = ({ onBack }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const lab = useSomatotypeLab();
  const snap = lab.snapshot;

  return (
    <main className="ui-shell relative max-w-3xl space-y-6 text-zinc-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-primary">
            {t('tools.somatotypeLab.kicker')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {t('tools.somatotypeLab.title')}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            {t('tools.somatotypeLab.subtitle')}
          </p>
        </div>
        <button type="button" className="ui-btn" onClick={onBack ?? (() => navigate(-1))}>
          {t('back')}
        </button>
      </header>

      <section className="grid gap-3 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 sm:grid-cols-2 sm:p-5">
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.height')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.heightInput}
            onChange={(e) => lab.setHeightInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.height')}
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.weight')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.weightInput}
            onChange={(e) => lab.setWeightInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.weight')}
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.bodyFat')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.bodyFatInput}
            onChange={(e) => lab.setBodyFatInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.bodyFat')}
          />
        </label>
        <label className="block text-xs text-zinc-400">
          {t('tools.somatotypeLab.fields.wrist')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.wristInput}
            onChange={(e) => lab.setWristInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.wrist')}
          />
        </label>
        <label className="block text-xs text-zinc-400 sm:col-span-2">
          {t('tools.somatotypeLab.fields.arm')}
          <input
            className={fieldClass}
            inputMode="decimal"
            value={lab.armGirthInput}
            onChange={(e) => lab.setArmGirthInput(e.target.value)}
            placeholder={t('tools.somatotypeLab.placeholders.arm')}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300 sm:col-span-2">
          <input
            type="checkbox"
            checked={lab.isVeteran}
            onChange={(e) => lab.setIsVeteran(e.target.checked)}
            className="size-4 rounded border-zinc-600 bg-zinc-900 accent-orange-500"
          />
          {t('tools.somatotypeLab.fields.veteran')}
        </label>
      </section>

      {snap ? (
        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-bg-card/95 p-4 sm:p-5">
          {snap.current.atypicalProportion ? (
            <p
              role="status"
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90"
            >
              {t('tools.somatotypeLab.atypicalWarning')}
            </p>
          ) : null}
          <div className="flex justify-center">
            <SomatochartView
              key={`${snap.currentPoint.x}:${snap.currentPoint.y}:${snap.maxTuned.coordinates.x}:${snap.maxTuned.coordinates.y}`}
              pointA={snap.currentPoint}
              pointB={snap.maxTuned.coordinates}
            />
          </div>
          <SomatotypeGapGauge
            heightCm={snap.metrics.heightCm}
            wristCm={snap.metrics.wristCm}
            currentBodyFatPct={snap.metrics.bodyFatPct}
            currentArmGirthCm={snap.metrics.flexedArmGirthCm}
            currentSmmKg={snap.currentSmmKg}
            maxBodyFatPct={snap.maxTuned.bodyFatPct}
            maxArmGirthCm={snap.maxTuned.armGirthMaxCm}
            maxSmmKg={snap.maxSmmKg}
            armGapCm={snap.armGapCm}
            bodyFatGapPct={snap.bodyFatGapPct}
            smmGapKg={snap.smmGapKg}
          />
          <p className="font-mono text-[11px] text-zinc-500">
            {t('tools.somatotypeLab.readout', {
              endo: snap.current.endomorphy.toFixed(2),
              meso: snap.current.mesomorphy.toFixed(2),
              ecto: snap.current.ectomorphy.toFixed(2),
              x: snap.currentPoint.x.toFixed(2),
              y: snap.currentPoint.y.toFixed(2),
            })}
          </p>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          {t('tools.somatotypeLab.emptyHint')}
        </p>
      )}
    </main>
  );
};

export default SomatotypeLabPage;
