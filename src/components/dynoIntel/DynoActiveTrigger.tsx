import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX_CLASS } from '../../constants/uiZIndex';
import { hapticService } from '../../services/hapticService';

export interface DynoActiveTriggerProps {
  consoleLabel: string;
  onPress: () => void;
  hidden?: boolean;
}

const DynoActiveTrigger: FC<DynoActiveTriggerProps> = ({ consoleLabel, onPress, hidden }) => {
  const { t } = useTranslation('common');

  if (hidden) return null;

  const handleClick = () => {
    void hapticService.trigger('ack');
    onPress();
  };

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 ${Z_INDEX_CLASS.dynoIntelTrigger} flex justify-end px-4 pb-[calc(94px+env(safe-area-inset-bottom,0px))]`}
    >
      <button
        type="button"
        aria-label={t('dynoIntel.triggerAria')}
        onClick={handleClick}
        className="pointer-events-auto flex h-12 w-12 flex-col items-center justify-center rounded-full border border-cyan-400/70 bg-zinc-950/95 shadow-[0_0_18px_rgba(34,211,238,0.45)] ring-1 ring-amber-500/30 transition-transform active:scale-95"
      >
        <span className="text-[9px] font-bold tracking-wider text-amber-400/90">DI</span>
        <span className="mt-0.5 max-w-[44px] truncate text-[7px] font-mono uppercase tracking-tight text-cyan-200/80">
          {consoleLabel}
        </span>
      </button>
    </div>
  );
};

export default DynoActiveTrigger;
