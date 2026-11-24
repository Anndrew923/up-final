import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  MARKETING_POSTER_SRC,
  SYSTEM_VIDEO_SRC,
} from '../config/marketingMedia';
import { OptionalLoopVideo } from './OptionalLoopVideo';

/**
 * Homepage「四大核心評測系統」— tabbed console + Ladder-style glowing iPhone frame.
 * WHY: Copy lives inside the phone bottom wash (shared overlay above media) so
 * tabs connect straight to the device; accent ring + in-screen copy stay in sync.
 */

type SystemAccent = 'energy' | 'violet' | 'emerald' | 'amber';

interface SystemTab {
  sys: string;
  tab: string;
  title: string;
  body: string;
  highlight: string;
  accent: SystemAccent;
  phoneLabel: string;
}

const ACCENT: Record<
  SystemAccent,
  {
    tabSelected: string;
    focus: string;
    highlight: string;
    glow: string;
    ring: string;
    ringSoft: string;
  }
> = {
  energy: {
    tabSelected: 'border-energy/50 bg-energy/10 text-energy',
    focus: 'focus-visible:ring-energy/50',
    highlight: 'border-energy/35 bg-energy/10 text-energy',
    glow: 'bg-energy/10',
    ring: 'rgba(0,191,255,0.75)',
    ringSoft: 'rgba(0,191,255,0.22)',
  },
  violet: {
    tabSelected: 'border-violet-500/50 bg-violet-500/10 text-violet-400',
    focus: 'focus-visible:ring-violet-500/50',
    highlight: 'border-violet-500/35 bg-violet-500/10 text-violet-400',
    glow: 'bg-violet-500/10',
    ring: 'rgba(167,139,250,0.8)',
    ringSoft: 'rgba(139,92,246,0.25)',
  },
  emerald: {
    tabSelected: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    focus: 'focus-visible:ring-emerald-500/50',
    highlight: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
    glow: 'bg-emerald-500/10',
    ring: 'rgba(52,211,153,0.8)',
    ringSoft: 'rgba(16,185,129,0.25)',
  },
  amber: {
    tabSelected: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    focus: 'focus-visible:ring-amber-500/50',
    highlight: 'border-amber-500/35 bg-amber-500/10 text-amber-400',
    glow: 'bg-amber-500/10',
    ring: 'rgba(251,191,36,0.85)',
    ringSoft: 'rgba(245,158,11,0.28)',
  },
};

const SYSTEMS: readonly SystemTab[] = [
  {
    sys: '01',
    tab: '常模量化',
    title: '打破量級與性別紅利，實力客觀說話',
    body: '體重降 3 kg、臥推少 5 kg，是退步還是變強？整合六大體能與體組成常模，消除量級與性別差異，算出真實戰力。',
    highlight: '消除量級與性別紅利',
    accent: 'violet',
    phoneLabel: '六軸常模引擎',
  },
  {
    sys: '02',
    tab: '戰報自拍',
    title: '專屬戰力戰報 & 訓練自拍卡',
    body: '記錄每次身體改裝軌跡。無論六邊形全能戰力、單項破 PR 或健身房自拍，一鍵生成高質感戰報卡片。',
    highlight: '一鍵輸出高質感戰報',
    accent: 'emerald',
    phoneLabel: '戰報輸出台',
  },
  {
    sys: '03',
    tab: '全球天梯',
    title: '全球天梯 & 俱樂部私榜',
    body: '尋找同齡、同量級甚至跨性別的訓練同好，疊加雙人雷達正面 PK，在良性切磋中鎖定下一個突破目標。',
    highlight: '雙人雷達正面 PK',
    accent: 'energy',
    phoneLabel: '天梯競技場',
  },
  {
    sys: '04',
    tab: '戰力引擎',
    title: 'DYNO INTEL 戰力引擎',
    body: '重量推得上去，心肺或握力卻拖垮總分？精準揪出六軸弱項短板，給出下一步調校方向，讓每滴汗都有效。',
    highlight: '精準揪出六軸弱項',
    accent: 'amber',
    phoneLabel: 'DYNO INTEL',
  },
];

/** Shared cover crop for still + video — one place to retune subject framing. */
const PHONE_MEDIA_COVER =
  'absolute inset-0 h-full w-full object-cover object-[center_35%]';

const TAB_PANEL_ID = 'system-tab-panel';

function PhoneStill() {
  return (
    <img
      src={MARKETING_POSTER_SRC}
      alt=""
      className={`${PHONE_MEDIA_COVER} opacity-40`}
      decoding="async"
      loading="lazy"
    />
  );
}

/** Video branch is a separate component so still-only path carries zero video hooks. */
function PhoneVideo({ src }: { src: string }) {
  const [videoOk, setVideoOk] = useState(false);

  return (
    <>
      <img
        src={MARKETING_POSTER_SRC}
        alt=""
        className={`${PHONE_MEDIA_COVER} transition-opacity ${
          videoOk ? 'opacity-0' : 'opacity-40'
        }`}
        decoding="async"
        loading="lazy"
      />
      <OptionalLoopVideo
        src={src}
        poster={MARKETING_POSTER_SRC}
        onReadyChange={setVideoOk}
        className={`${PHONE_MEDIA_COVER} transition-opacity ${
          videoOk ? 'opacity-70' : 'opacity-0'
        }`}
      />
    </>
  );
}

function PhoneMediaLayer() {
  return SYSTEM_VIDEO_SRC ? <PhoneVideo src={SYSTEM_VIDEO_SRC} /> : <PhoneStill />;
}

function GlowIphoneFrame({ item }: { item: SystemTab }) {
  const tone = ACCENT[item.accent];
  const ringStyle = {
    '--sys-ring': tone.ring,
    '--sys-ring-soft': tone.ringSoft,
  } as CSSProperties;

  return (
    <div
      className="relative mx-auto w-full max-w-[240px] sm:max-w-[280px]"
      style={ringStyle}
    >
      <div
        className="pointer-events-none absolute -inset-3 rounded-[2.6rem] opacity-90 transition-all duration-500"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, var(--sys-ring-soft), transparent 65%)',
          boxShadow:
            '0 0 0 1px var(--sys-ring-soft), 0 0 42px var(--sys-ring-soft)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-[3px] rounded-[2.35rem] transition-colors duration-500"
        style={{
          background:
            'linear-gradient(160deg, var(--sys-ring), transparent 55%, var(--sys-ring-soft))',
        }}
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[2.1rem] border border-zinc-600/80 bg-zinc-950 shadow-2xl">
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5" aria-hidden>
          <div className="h-4 w-20 rounded-full bg-black/90" />
        </div>

        <div className="relative aspect-[9/19] w-full bg-void">
          <PhoneMediaLayer />
          {/* Shared wash above media — still or future <video> both sit under copy. */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/92"
            aria-hidden
          />

          <div className="relative z-[1] flex h-full flex-col justify-end p-3.5 pb-4 pt-10 sm:p-4 sm:pb-5">
            <p className="font-mono text-[9px] tracking-[0.14em] text-zinc-400 sm:text-[10px]">
              SYS // {item.sys}
              <span className="mx-1 opacity-50" aria-hidden>
                ·
              </span>
              {item.phoneLabel}
            </p>
            <h3 className="mt-1.5 text-pretty text-[12px] font-semibold leading-snug text-white sm:mt-2 sm:text-sm">
              {item.title}
            </h3>
            <p className="mt-1.5 line-clamp-4 text-pretty text-xs leading-relaxed text-zinc-300 sm:mt-2 sm:line-clamp-5 sm:text-sm">
              {item.body}
            </p>
            <span
              className={`mt-2.5 inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 font-mono text-[9px] tracking-wide sm:mt-3 sm:text-[10px] ${tone.highlight}`}
            >
              {item.highlight}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SystemsShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SYSTEMS[activeIndex];
  const activeGlow = ACCENT[active.accent].glow;

  const focusTab = (index: number) => {
    setActiveIndex(index);
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

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      <div
        className="grid grid-cols-2 gap-1.5 border-b border-white/5 p-2 sm:grid-cols-4 sm:gap-2 sm:p-2.5"
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
              aria-selected={selected}
              aria-controls={TAB_PANEL_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`min-h-11 rounded-xl border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 sm:px-3 ${tone.focus} ${
                selected
                  ? tone.tabSelected
                  : 'border-white/10 bg-void/40 text-zinc-300 hover:border-white/20 hover:text-zinc-100'
              }`}
            >
              <span className="font-mono text-[10px] tabular-nums tracking-wide opacity-80">
                {item.sys}
              </span>{' '}
              <span className="text-sm font-medium leading-snug">{item.tab}</span>
            </button>
          );
        })}
      </div>

      {/*
        Stable panel id: single live stage (not one hidden panel per tab).
        WHY: aria-controls must always resolve; swapping id with active.sys left
        inactive tabs pointing at missing DOM nodes.
      */}
      <div
        id={TAB_PANEL_ID}
        role="tabpanel"
        aria-labelledby={`system-tab-${active.sys}`}
        className="relative mt-6 px-4 pb-6 sm:mt-8 sm:px-6 sm:pb-8"
      >
        <div
          className={`pointer-events-none absolute inset-0 opacity-45 transition-colors [mask-image:radial-gradient(circle_at_50%_20%,black,transparent_60%)] ${activeGlow}`}
          aria-hidden
        />
        <div className="relative flex justify-center">
          <GlowIphoneFrame item={active} />
        </div>
      </div>
    </div>
  );
}
