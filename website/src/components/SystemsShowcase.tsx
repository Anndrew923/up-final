import {
  useCallback,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  MARKETING_POSTER_SRC,
  SYSTEM_PREVIEWS,
  type SystemTabId,
} from '../config/marketingMedia';
import { ImageLightbox } from './ImageLightbox';
import { PhoneSystemCarousel } from './PhoneSystemCarousel';

/**
 * Homepage「四大核心評測系統」— tabbed console + Ladder-style glowing iPhone.
 * WHY: Tabs → bold title → pure phone → caption only (no SYS eyebrow / chip);
 * `SYSTEM_PREVIEWS` drives still vs carousel; lightbox mirrors the active slide.
 */

type SystemAccent = 'energy' | 'violet' | 'emerald' | 'amber';

/** Caption body — emphasis span gets white; lead/trail stay zinc-400 for scan. */
interface SystemBodyCopy {
  before: string;
  emphasis: string;
  after: string;
}

interface SystemTab {
  sys: SystemTabId;
  /** Full tab label — sm+ */
  tab: string;
  /** Compact two-character label — phone single-row tabs */
  tabShort: string;
  title: string;
  body: SystemBodyCopy;
  accent: SystemAccent;
  /** A11y / lightbox short name — not shown as SYS eyebrow. */
  phoneLabel: string;
}

/** Shared raised segment under spectrum border — keeps four accents DRY. */
const TAB_SELECTED_SHELL = 'bg-zinc-900/95 shadow-md';

const TAB_TRACK =
  'grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-zinc-950/90 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)] sm:gap-1.5';

const TAB_IDLE =
  'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-200';

const ACCENT: Record<
  SystemAccent,
  {
    tabSelected: string;
    tabDot: string;
    focus: string;
    glow: string;
    ring: string;
    ringSoft: string;
  }
> = {
  energy: {
    tabSelected: `border-energy/55 ${TAB_SELECTED_SHELL} text-energy shadow-energy/10`,
    tabDot: 'bg-energy shadow-[0_0_8px_rgba(0,191,255,0.85)]',
    focus: 'focus-visible:ring-energy/50',
    glow: 'bg-energy/10',
    ring: 'rgba(0,191,255,0.75)',
    ringSoft: 'rgba(0,191,255,0.22)',
  },
  violet: {
    tabSelected: `border-violet-400/55 ${TAB_SELECTED_SHELL} text-violet-300 shadow-violet-500/15`,
    tabDot: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.85)]',
    focus: 'focus-visible:ring-violet-500/50',
    glow: 'bg-violet-500/10',
    ring: 'rgba(167,139,250,0.8)',
    ringSoft: 'rgba(139,92,246,0.25)',
  },
  emerald: {
    tabSelected: `border-emerald-400/55 ${TAB_SELECTED_SHELL} text-emerald-300 shadow-emerald-500/15`,
    tabDot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]',
    focus: 'focus-visible:ring-emerald-500/50',
    glow: 'bg-emerald-500/10',
    ring: 'rgba(52,211,153,0.8)',
    ringSoft: 'rgba(16,185,129,0.25)',
  },
  amber: {
    tabSelected: `border-amber-400/55 ${TAB_SELECTED_SHELL} text-amber-300 shadow-amber-500/15`,
    tabDot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
    focus: 'focus-visible:ring-amber-500/50',
    glow: 'bg-amber-500/10',
    ring: 'rgba(251,191,36,0.85)',
    ringSoft: 'rgba(245,158,11,0.28)',
  },
};

const SYSTEMS: readonly SystemTab[] = [
  {
    sys: '01',
    tab: '基準量化',
    tabShort: '基準',
    title: '打破量級與性別紅利，實力客觀說話',
    body: {
      before: '體重降 3 kg、臥推少 5 kg，是退步還是變強？整合',
      emphasis: '六大體能與體組成基準',
      after: '，消除量級與性別差異，算出真實戰力。',
    },
    accent: 'violet',
    phoneLabel: '六軸基準引擎',
  },
  {
    sys: '02',
    tab: '戰報自拍',
    tabShort: '戰報',
    title: '你的每一次突破，都值得一張冠軍戰報',
    body: {
      before: '將',
      emphasis: '六邊形戰力、破 PR 紀錄與訓練自拍',
      after: '一鍵合成，讓身體改裝有跡可循。',
    },
    accent: 'emerald',
    phoneLabel: '實戰戰報卡',
  },
  {
    sys: '03',
    tab: '全球天梯',
    tabShort: '天梯',
    title: '全球天梯 & 俱樂部私榜',
    body: {
      before: '尋找同齡、同量級甚至跨性別的訓練同好，疊加',
      emphasis: '雙人雷達正面 PK',
      after: '，在良性切磋中鎖定下一個突破目標。',
    },
    accent: 'energy',
    phoneLabel: '天梯競技場',
  },
  {
    sys: '04',
    tab: '戰力引擎',
    tabShort: '引擎',
    title: 'DYNO INTEL 戰力引擎',
    body: {
      before: '重量推得上去，心肺或握力卻拖垮總分？精準揪出',
      emphasis: '六軸弱項短板',
      after: '，給出下一步調校方向，讓每滴汗都有效。',
    },
    accent: 'amber',
    phoneLabel: 'DYNO INTEL',
  },
];

const TAB_PANEL_ID = 'system-tab-panel';

/**
 * Mobile frame width tracks max-h so aspect+[max-h] never letterbox-crops media.
 * 46svh × 9/16.2 ≈ width; capped at 252px.
 */
const PHONE_SHELL =
  'relative mx-auto w-[min(252px,100%,calc(46svh*9/16.2))] sm:w-full sm:max-w-[280px]';

/*
  WHY: Shared column for heading + caption — same max-w/px keeps long SYS 02
  titles and body clear of the floating back-to-top control.
 */
const COPY_COLUMN =
  'mx-auto max-w-[300px] px-2 text-center sm:max-w-md';

function SystemHeading({ item }: { item: SystemTab }) {
  // WHY: No SYS // eyebrow — tabs already identify the engine; title is the beat.
  return (
    <div className={`${COPY_COLUMN} mb-4 sm:mb-5`}>
      <h3 className="text-balance text-pretty text-lg font-bold leading-snug text-white sm:text-xl">
        {item.title}
      </h3>
    </div>
  );
}

function GlowIphoneFrame({
  item,
  previews,
  slideIndex,
  onSlideChange,
  onOpenLightbox,
}: {
  item: SystemTab;
  previews: readonly string[];
  slideIndex: number;
  onSlideChange: (index: number) => void;
  onOpenLightbox: () => void;
}) {
  const { ring, ringSoft } = ACCENT[item.accent];
  const ringStyle = {
    '--sys-ring': ring,
    '--sys-ring-soft': ringSoft,
  } as CSSProperties;

  return (
    <div className={PHONE_SHELL} style={ringStyle}>
      <div
        className="pointer-events-none absolute -inset-2 rounded-[2.4rem] opacity-90 transition-all duration-500 sm:-inset-3 sm:rounded-[2.6rem]"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, var(--sys-ring-soft), transparent 65%)',
          boxShadow:
            '0 0 0 1px var(--sys-ring-soft), 0 0 42px var(--sys-ring-soft)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-[3px] rounded-[2.2rem] transition-colors duration-500 sm:rounded-[2.35rem]"
        style={{
          background:
            'linear-gradient(160deg, var(--sys-ring), transparent 55%, var(--sys-ring-soft))',
        }}
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-600/80 bg-zinc-950 shadow-2xl sm:rounded-[2.1rem]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2 sm:pt-2.5"
          aria-hidden
        >
          <div className="h-3.5 w-16 rounded-full bg-black/90 sm:h-4 sm:w-20" />
        </div>

        <PhoneSystemCarousel
          key={item.sys}
          item={item}
          previews={previews}
          slideIndex={slideIndex}
          onSlideChange={onSlideChange}
          onOpenLightbox={onOpenLightbox}
        />
      </div>
    </div>
  );
}

/** Body under the bezel — emphasis only; no spectrum chip (breathing room). */
function SystemCaption({ item }: { item: SystemTab }) {
  const { before, emphasis, after } = item.body;

  return (
    <div className={`${COPY_COLUMN} mt-4 sm:mt-5`}>
      <p className="text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
        {before}
        <span className="font-medium text-white">{emphasis}</span>
        {after}
      </p>
    </div>
  );
}

export function SystemsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const active = SYSTEMS[activeIndex];
  const previews = SYSTEM_PREVIEWS[active.sys];
  const safeSlide = Math.min(slideIndex, Math.max(0, previews.length - 1));
  const activeSrc = previews[safeSlide] ?? MARKETING_POSTER_SRC;
  const activeGlow = ACCENT[active.accent].glow;
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  /** WHY: Tab change resets carousel + closes lightbox so locks never stick. */
  const selectTab = (index: number) => {
    setActiveIndex(index);
    setSlideIndex(0);
    setLightboxOpen(false);
  };

  const focusTab = (index: number) => {
    selectTab(index);
    requestAnimationFrame(() => {
      document.getElementById(`system-tab-${SYSTEMS[index].sys}`)?.focus();
    });
  };

  const onTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const last = SYSTEMS.length - 1;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = index === last ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = index === 0 ? last : index - 1;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = last;
    } else {
      return;
    }
    event.preventDefault();
    focusTab(next);
  };

  const lightboxTitle =
    previews.length > 1
      ? `${active.sys} ${active.tabShort} · 畫面 ${safeSlide + 1}/${previews.length}`
      : `${active.sys} ${active.tabShort} · ${active.title}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/*
        WHY: 1×4 recessed track — one instrument bezel (not four floating chips)
        keeps phone fold budget while matching RadarPreview tactile chrome.
      */}
      <div className="border-b border-white/5 p-2 sm:p-2.5">
        <div
          className={TAB_TRACK}
          role="tablist"
          aria-label="四大核心評測系統"
        >
          {SYSTEMS.map((item, index) => {
            const selected = index === activeIndex;
            const tone = ACCENT[item.accent];
            return (
              <button
                key={item.sys}
                type="button"
                role="tab"
                id={`system-tab-${item.sys}`}
                aria-label={`${item.sys} ${item.tab}`}
                aria-selected={selected}
                aria-controls={TAB_PANEL_ID}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(index)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 sm:min-h-11 sm:flex-row sm:items-center sm:justify-start sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-left ${tone.focus} ${
                  selected ? tone.tabSelected : TAB_IDLE
                }`}
              >
                <span className="inline-flex items-center gap-1 sm:contents">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition duration-200 ${
                      selected ? tone.tabDot : 'bg-zinc-600'
                    }`}
                    aria-hidden
                  />
                  <span className="font-mono text-[9px] tabular-nums tracking-wide opacity-80 sm:text-[10px]">
                    {item.sys}
                  </span>
                </span>
                <span
                  className="text-[11px] font-medium leading-none sm:hidden"
                  aria-hidden
                >
                  {item.tabShort}
                </span>
                <span className="hidden text-sm font-medium leading-snug sm:inline">
                  {item.tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={TAB_PANEL_ID}
        role="tabpanel"
        aria-labelledby={`system-tab-${active.sys}`}
        className="relative mt-3 px-3 pb-4 sm:mt-8 sm:px-6 sm:pb-8"
      >
        <div
          className={`pointer-events-none absolute inset-0 opacity-45 transition-colors [mask-image:radial-gradient(circle_at_50%_20%,black,transparent_60%)] ${activeGlow}`}
          aria-hidden
        />
        <div className="relative flex flex-col items-center">
          <SystemHeading item={active} />
          <GlowIphoneFrame
            item={active}
            previews={previews}
            slideIndex={safeSlide}
            onSlideChange={setSlideIndex}
            onOpenLightbox={() => setLightboxOpen(true)}
          />
          <SystemCaption item={active} />
        </div>
      </div>

      {lightboxOpen ? (
        <ImageLightbox
          src={activeSrc}
          title={lightboxTitle}
          alt={`${active.phoneLabel} — ${active.title}`}
          onClose={closeLightbox}
        />
      ) : null}
    </div>
  );
}
