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
 * Homepage「四大核心評測系統」— tabbed console + Canva-style rounded preview frame.
 * WHY: Tabs → bold title → flat rounded still → caption only (no SYS eyebrow /
 * chip / hardware chrome); `SYSTEM_PREVIEWS` drives still vs carousel; lightbox
 * mirrors the active slide.
 */

type SystemAccent = 'energy' | 'violet' | 'emerald' | 'amber';

/**
 * Caption body — emphasis span uses primary; lead/trail stay muted for scan.
 * WHY split fields: keep one scan anchor white without hardcoding JSX per tab.
 */
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
  'border-transparent text-fg-muted hover:border-white/10 hover:bg-white/[0.03] hover:text-fg-secondary';

const ACCENT: Record<
  SystemAccent,
  {
    tabSelected: string;
    tabDot: string;
    focus: string;
    /** Panel wash behind title + frame. */
    panelGlow: string;
    /** Soft halo behind the preview chassis. */
    frameGlow: string;
  }
> = {
  energy: {
    tabSelected: `border-energy/55 ${TAB_SELECTED_SHELL} text-energy shadow-energy/10`,
    tabDot: 'bg-energy shadow-[0_0_8px_rgba(0,191,255,0.85)]',
    focus: 'focus-visible:ring-energy/50',
    panelGlow: 'bg-energy/10',
    frameGlow: 'rgba(0,191,255,0.22)',
  },
  violet: {
    tabSelected: `border-violet-400/55 ${TAB_SELECTED_SHELL} text-violet-300 shadow-violet-500/15`,
    tabDot: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.85)]',
    focus: 'focus-visible:ring-violet-500/50',
    panelGlow: 'bg-violet-500/10',
    frameGlow: 'rgba(139,92,246,0.25)',
  },
  emerald: {
    tabSelected: `border-emerald-400/55 ${TAB_SELECTED_SHELL} text-emerald-300 shadow-emerald-500/15`,
    tabDot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]',
    focus: 'focus-visible:ring-emerald-500/50',
    panelGlow: 'bg-emerald-500/10',
    frameGlow: 'rgba(16,185,129,0.25)',
  },
  amber: {
    tabSelected: `border-amber-400/55 ${TAB_SELECTED_SHELL} text-amber-300 shadow-amber-500/15`,
    tabDot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]',
    focus: 'focus-visible:ring-amber-500/50',
    panelGlow: 'bg-amber-500/10',
    frameGlow: 'rgba(245,158,11,0.28)',
  },
};

const SYSTEMS: readonly SystemTab[] = [
  {
    sys: '01',
    tab: '基準量化',
    tabShort: '基準',
    title: '科學校正先天差異，精準給分',
    body: {
      before: '排除身高、體重、年齡與性別差異，整合',
      emphasis: '六大體能指標',
      after: '，算出最客觀的真實戰力。',
    },
    accent: 'violet',
    phoneLabel: '六軸基準引擎',
  },
  {
    sys: '02',
    tab: '戰報自拍',
    tabShort: '戰報',
    title: '每次突破，都值得一張冠軍戰報',
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
      before: '鎖定同齡、同量級訓練同好，疊加',
      emphasis: '雙人雷達正面對照',
      after: '，找準下一個突破目標。',
    },
    accent: 'energy',
    phoneLabel: '天梯競技場',
  },
  {
    sys: '04',
    tab: '訓練工具',
    tabShort: '工具',
    title: '日誌、1RM 換算與戰力引擎',
    body: {
      before: '整合',
      emphasis: '訓練日誌、1RM 計算機與 AI 短板診斷',
      after: '，從日常紀錄到突破調校一次搞定。',
    },
    accent: 'amber',
    phoneLabel: '訓練日誌與工具',
  },
];

const TAB_PANEL_ID = 'system-tab-panel';

/**
 * Preview frame width tracks max-h so aspect+[max-h] never letterbox-crops media.
 * 46svh × 9/16.2 ≈ width; capped at 252px.
 */
const PREVIEW_SHELL =
  'relative mx-auto w-[min(252px,100%,calc(46svh*9/16.2))] sm:w-full sm:max-w-[280px]';

/** Slim Canva-store bezel — flat top, no notch / island / side keys. */
const PREVIEW_FRAME =
  'relative overflow-hidden rounded-[2.25rem] border border-zinc-700/80 bg-zinc-950 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(251,191,36,0.08)] sm:rounded-[2.35rem] sm:p-1.5';

const PREVIEW_SCREEN =
  'overflow-hidden rounded-[1.85rem] bg-void sm:rounded-[1.95rem]';

/*
  WHY: Caption stays ≤300px for 2-line scan; heading drops side pad + uses
  full stage so 21px nowrap titles (02 / 04) clear 375px without clip.
 */
const CAPTION_COLUMN =
  'mx-auto max-w-[300px] px-2 text-center sm:max-w-md';

const HEADING_COLUMN =
  'mx-auto w-full px-0 text-center sm:max-w-2xl sm:px-2';

/** Locked one-line title — overrides ui-h3 so tab switches never reflow height. */
const SYSTEM_TITLE =
  'whitespace-nowrap text-[21px] font-semibold tracking-tight text-white sm:text-3xl';

function SystemHeading({ item }: { item: SystemTab }) {
  // WHY: No SYS eyebrow — tabs identify the engine; height lock is font+nowrap.
  return (
    <div className={`${HEADING_COLUMN} mb-4 sm:mb-5`}>
      <h3 className={SYSTEM_TITLE}>{item.title}</h3>
    </div>
  );
}

/**
 * Systems preview chassis — rounded rect + accent halo only.
 * WHY: Store-art frames read as product UI, not plastic iPhone shells; island /
 * notch / side keys previously occluded screenshot headers on every tab.
 */
function SystemPreviewFrame({
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
  const { frameGlow } = ACCENT[item.accent];
  const glowStyle = {
    '--sys-glow': frameGlow,
  } as CSSProperties;

  return (
    <div className={PREVIEW_SHELL} style={glowStyle}>
      <div
        className="pointer-events-none absolute -inset-3 rounded-[2.6rem] opacity-80 transition-all duration-500 sm:-inset-4 sm:rounded-[2.75rem]"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, var(--sys-glow), transparent 68%)',
          boxShadow: '0 0 36px var(--sys-glow)',
        }}
        aria-hidden
      />

      <div className={PREVIEW_FRAME}>
        <div className={PREVIEW_SCREEN}>
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
    </div>
  );
}

/**
 * Body under the preview frame — emphasis only; no spectrum chip.
 * WHY min-h + line-clamp-2: four tab captions stay the same 2-line budget so
 * frame↔CTA spacing does not jump when switching systems on narrow phones.
 */
function SystemCaption({ item }: { item: SystemTab }) {
  const { before, emphasis, after } = item.body;

  return (
    <div className={`${CAPTION_COLUMN} mt-4 sm:mt-5`}>
      <p className="ui-body line-clamp-2 min-h-[2.75rem] text-pretty text-fg-muted sm:min-h-[3rem]">
        {before}
        <span className="font-medium text-fg">{emphasis}</span>
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
  const activeGlow = ACCENT[active.accent].panelGlow;
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
        keeps phone fold budget on a single tactile chrome strip.
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
                  <span className="text-xs tabular-nums tracking-wide opacity-80 sm:text-xs">
                    {item.sys}
                  </span>
                </span>
                <span
                  className="text-xs font-medium leading-none sm:hidden"
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
          <SystemPreviewFrame
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
