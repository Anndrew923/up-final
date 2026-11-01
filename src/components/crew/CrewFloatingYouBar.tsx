import { useId, useState, type CSSProperties, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LADDER_BRIDGE_ARCH_DEPTH_PX,
  LADDER_BRIDGE_ARCH_WIDTH_PX,
  LADDER_BRIDGE_BOTTOM_PX,
  LADDER_BRIDGE_REF_WIDTH_PX,
  LADDER_FLOATING_RANK_BAR_PX,
  bottomChromeCalc,
} from '../../constants/bottomChrome';
import { cn } from '../../lib/cn';
import { buildLadderBridgeClipPathD } from '../../logic/core/ladderBridgeClipPath';
import { ladderIdentityInitial } from '../../logic/core/ladderUploadPolicy';

export interface CrewFloatingYouBarProps {
  myRank: number;
  myScoreLabel: string;
  displayName: string;
  avatarUrl?: string;
  onJumpToMyRow: () => void;
}

const BRIDGE_CLIP_PATH_D = buildLadderBridgeClipPathD({
  archWidthFrac: LADDER_BRIDGE_ARCH_WIDTH_PX / LADDER_BRIDGE_REF_WIDTH_PX,
  archDepthFrac: LADDER_BRIDGE_ARCH_DEPTH_PX / LADDER_FLOATING_RANK_BAR_PX,
});

/**
 * Club sticky “You” bar — same chrome geometry as the global ladder bridge.
 * WHY: clip-path punches the DYNO hex (paint + hit-test). Avatar onError must
 * fall back to initials so a dead https URL never shows the broken-image glyph.
 */
const CrewFloatingYouBar: FC<CrewFloatingYouBarProps> = ({
  myRank,
  myScoreLabel,
  displayName,
  avatarUrl,
  onJumpToMyRow,
}) => {
  const { t } = useTranslation('common');
  const clipPathId = `crew-bridge-clip-${useId().replace(/:/g, '')}`;
  const jumpLabel = t('crew.ladder.floatingYou.cta');
  const avatarInitial = ladderIdentityInitial(displayName);
  const src = String(avatarUrl ?? '').trim();
  const [failedForUrl, setFailedForUrl] = useState<string | null>(null);
  const showAvatar = Boolean(src) && failedForUrl !== src;

  const shellStyle = {
    bottom: bottomChromeCalc(LADDER_BRIDGE_BOTTOM_PX),
    clipPath: `url(#${clipPathId})`,
    WebkitClipPath: `url(#${clipPathId})`,
  } satisfies CSSProperties;

  return (
    <>
      {/* Defs live outside the interactive shell — keeps <button> free of SVG flow children. */}
      <svg width={0} height={0} className="absolute" aria-hidden focusable="false">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <path d={BRIDGE_CLIP_PATH_D} />
          </clipPath>
        </defs>
      </svg>

      <button
        type="button"
        data-testid="crew-floating-you-bar"
        onClick={onJumpToMyRow}
        className={cn(
          'pointer-events-auto fixed inset-x-0 z-30 mx-auto flex w-full max-w-3xl items-center justify-between gap-3',
          'border border-cyan-400/40 bg-slate-900/95 px-3 py-2.5 text-left backdrop-blur-md',
          'shadow-[0_0_24px_rgba(34,211,238,0.18)]',
          'motion-safe:transition-[border-color,transform] motion-safe:duration-150',
          'hover:border-cyan-400/55 active:scale-[0.99]'
        )}
        style={shellStyle}
        aria-label={jumpLabel}
        title={jumpLabel}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">#{myRank}</span>
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/35 bg-slate-800 text-sm font-semibold text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          >
            {showAvatar ? (
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setFailedForUrl(src)}
              />
            ) : (
              <span className="font-mono tracking-wide">{avatarInitial}</span>
            )}
          </span>
          <span className="min-w-0 truncate text-sm font-semibold leading-tight text-zinc-100">
            {displayName}
          </span>
        </span>

        {/* Horizontal reserve matching arch width so identity/score never sit over the hex. */}
        <span
          className="pointer-events-none shrink-0"
          style={{ width: LADDER_BRIDGE_ARCH_WIDTH_PX, height: LADDER_BRIDGE_ARCH_DEPTH_PX }}
          aria-hidden
        />

        <span className="shrink-0 whitespace-nowrap font-mono text-base font-semibold tabular-nums leading-tight text-cyan-300">
          {myScoreLabel}
        </span>
      </button>
    </>
  );
};

export default CrewFloatingYouBar;
