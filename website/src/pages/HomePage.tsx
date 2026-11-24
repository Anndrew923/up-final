import { Link } from 'react-router-dom';
import { ArrowRight, Cloud, Lock, Trophy } from 'lucide-react';
import { AthletesShowcase } from '../components/AthletesShowcase';
import { DeveloperHobbyBanner } from '../components/DeveloperHobbyBanner';
import { FaqAccordion } from '../components/FaqAccordion';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { HeroStoreCta } from '../components/HeroStoreCta';
import { MetricMindsetUpgrade } from '../components/MetricMindsetUpgrade';
import { OverallGradeLadderCard } from '../components/OverallGradeLadderCard';
import { RadarPreview } from '../components/RadarPreview';
import { SystemsShowcase } from '../components/SystemsShowcase';

interface HomePageProps {
  onDownload: () => void;
}

export function HomePage({ onDownload }: HomePageProps) {
  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      {/*
        Ladder flagship hero: -mt under fixed chrome, 100svh stage, bottom-anchored
        copy via flex-1 spacer (not justify-end) so short phones never overlap the fixed nav.
      */}
      <section
        id="hero"
        className="relative flex min-h-[100svh] -mt-[var(--site-nav-offset)] flex-col overflow-x-hidden border-b border-white/5 bg-ink"
      >
        <HeroBackdrop />

        <div className="relative z-10 flex flex-1 flex-col items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-[var(--site-nav-offset)] text-center sm:px-6 sm:pb-10">
          <div className="min-h-8 w-full flex-1 sm:min-h-10" aria-hidden />
          <div className="mx-auto w-full max-w-2xl shrink-0">
            <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 font-mono text-[10px] tracking-wide text-amber-200/95 backdrop-blur-sm sm:text-[11px]">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                aria-hidden
              />
              肌力體能教練實測研發 · 六大運動生理學常模
            </p>

            <h1 className="mt-5 font-serif text-[1.85rem] font-bold leading-[1.25] text-white sm:mt-6 sm:text-5xl sm:leading-tight lg:text-[3.15rem]">
              終結訓練內耗，
              <br />
              用數據定義真實戰力。
            </h1>

            <HeroStoreCta onDownload={onDownload} />

            <p className="mt-4 text-[11px] leading-snug text-zinc-300 sm:mt-5 sm:text-xs">
              核心評測永久免費 · 創世早鳥席終身免訂閱
            </p>
          </div>
        </div>
      </section>

      {/* Screen 2 — pain → solution bridge → live radar demo. */}
      <section
        id="radar"
        className="border-b border-white/5 bg-ink ui-section"
      >
        <div className="ui-container">
          {/*
            WHY: Vertical beam + badge break the flat ink void after Hero scroll,
            pulling the eye into the pain headline before the radar instrument.
            Beam/LED are decorative; badge copy stays in the a11y tree.
          */}
          <div className="mb-6 flex flex-col items-center sm:mb-8">
            <div
              className="h-10 w-px bg-gradient-to-b from-transparent via-energy/70 to-energy/20 sm:h-12"
              aria-hidden
            />
            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-energy/35 bg-energy/10 px-3 py-1 font-mono text-[10px] tracking-wide text-energy sm:text-[11px]">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-energy shadow-[0_0_8px_rgba(0,191,255,0.85)] animate-energy-breathe"
                aria-hidden
              />
              CORE ENGINE · 六軸戰力診斷
            </span>
          </div>

          <div className="ui-section-head">
            <h2 className="text-pretty font-serif text-3xl font-black leading-[1.22] tracking-tight text-zinc-100 sm:text-5xl sm:leading-[1.15]">
              增肌怕胖、減脂怕掉力、
              <br className="sm:hidden" />
              <span className="text-white [text-shadow:0_0_24px_rgba(255,255,255,0.22)]">
                練大卻跑不動？
              </span>
            </h2>
            {/* WHY: 起→承 bridge before the instrument — keeps radar card as the 「轉」 beat. */}
            <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-300 sm:mt-5 sm:text-lg">
              問題不在你不夠努力，而是缺乏全局視角。
              <br />
              <span className="text-white">《最強肉體》</span>
              用<span className="text-energy">六軸基準</span>
              即時診斷，一眼揪出你的短板與強項。
            </p>
          </div>
          <RadarPreview />
          {/* WHY: Tighter gap — radar mode switch now sits at card bottom and
              should read as one beat into the「遙測頻譜」hobby CTA. */}
          <div className="mt-4 sm:mt-5">
            <DeveloperHobbyBanner />
          </div>
        </div>
      </section>

      {/* WHY: Sits after radar demo, before systems — mindset bridge. */}
      <MetricMindsetUpgrade />

      <section
        className="ui-section border-y border-violet-500/20 bg-night"
        id="systems"
      >
        <div className="ui-container">
          {/*
            WHY: Override ui-section-head mb on phone so title + 1×4 tabs + phone
            can share one viewport with the sticky download bar.
          */}
          <div className="ui-section-head mb-4 sm:mb-12">
            <p className="ui-kicker-zh-violet">核心系統</p>
            <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
              四大核心評測系統
            </h2>
          </div>
          <SystemsShowcase />
        </div>
      </section>

      <section
        className="ui-section border-t border-amber-500/25 bg-hall"
        id="ladder"
      >
        <div className="ui-container">
          <OverallGradeLadderCard />
        </div>
      </section>

      <section
        className="ui-section border-y border-white/10 bg-zinc-900/85"
        id="athletes"
      >
        <div className="ui-container">
          <div className="ui-section-head">
            <p className="ui-kicker-zh-orange">實測背書</p>
            <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
              專項運動員實測
            </h2>
          </div>
          <AthletesShowcase />
        </div>
      </section>

      <section
        className="relative overflow-x-hidden border-t border-amber-400/25 bg-gradient-to-b from-amber-500/[0.09] via-[#090B10] to-ink ui-section"
        id="plans"
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl"
          aria-hidden
        />
        <div className="ui-container relative">
          <div className="ui-section-head">
            <p className="ui-kicker-zh-amber">權益方案</p>
            <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
              方案與早鳥權益
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:mt-4">
              核心評測零門檻永久免費；解鎖天梯與戰力引擎，挑戰更高維度。
            </p>
          </div>

          {/* WHY: Mobile leads with GENESIS; desktop keeps CORE | GENESIS | PRO. Copy SSOT unchanged. */}
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 lg:items-stretch">
            <div className="order-2 h-full lg:order-1">
              <PricingCard
                badge="CORE"
                title="本機版"
                price="免費開放"
                priceSub="免註冊即用"
                tier="core"
                cardNo="UP-CORE-0001"
                features={[
                  '六軸戰力評測與雷達全開',
                  '訓練日誌、1RM計算器與槓片計算器',
                  '專屬戰力圖卡與自拍浮水印匯出',
                  '全站零廣告干擾，純粹專注訓練',
                ]}
                icon={Lock}
                ctaLabel="免費下載開測"
                ctaVariant="ghost"
                onCta={onDownload}
              />
            </div>
            <div className="order-1 h-full lg:order-2">
              <PricingCard
                badge="GENESIS"
                title="創世早鳥席"
                price="限量 2,000 席"
                priceSub="額滿永久絕版"
                priceTag="一次解鎖 · 終身免訂閱"
                tier="genesis"
                cardNo="UP-GEN-0001"
                features={[
                  '終身免訂閱，永久解鎖全球天梯（讀取／上傳）',
                  '專屬創世先鋒席次編號（限量 2,000 席）',
                  '完整保留免費版全部核心功能',
                ]}
                icon={Trophy}
                ctaLabel="下載 App 搶占早鳥席"
                ctaVariant="primary"
                onCta={onDownload}
              />
            </div>
            <div className="order-3 h-full">
              <PricingCard
                badge="PRO"
                title="訂閱 PRO"
                price="$1.99 / 月"
                priceSub="年繳 $14.99 USD（現省 37%）"
                tier="pro"
                features={[
                  '跨裝置雲端數據自動備份與還原',
                  '全球多維天梯完整參賽與篩選權',
                  '俱樂部私榜建立與專屬對決排行',
                  'DYNO INTEL 戰力引擎每日 30 次深度分析',
                ]}
                icon={Cloud}
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-2.5 sm:mt-12 sm:flex-row sm:gap-3">
            <Link to="/science" className="btn-secondary min-h-11 w-full sm:w-auto">
              查閱科學評測白皮書
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#hero" className="btn-secondary min-h-11 w-full sm:w-auto">
              回到頂部 ↑
            </a>
          </div>
        </div>
      </section>

      <FaqAccordion />
    </div>
  );
}

type PricingTier = 'core' | 'genesis' | 'pro';
type PricingCtaVariant = 'primary' | 'ghost';

/**
 * Ladder-inspired metal membership shells.
 * CORE = brushed titanium · GENESIS = dark gold · PRO keeps subscription panel chrome.
 */
const PRICING_TIER_SHELL: Record<PricingTier, string> = {
  core:
    'metal-card-titanium border-zinc-400/35 bg-gradient-to-br from-zinc-300/15 via-zinc-800/90 to-zinc-950 p-3.5 sm:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_12px_40px_-16px_rgba(0,0,0,0.65)]',
  genesis:
    'metal-card-gold border-amber-400/55 bg-gradient-to-br from-amber-500/20 via-[#1a1408] to-zinc-950 p-4 sm:p-6 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.28),0_0_36px_-8px_rgba(245,158,11,0.32)]',
  pro: 'bg-gradient-to-b from-indigo-500/10 to-zinc-950 border-indigo-400/35 p-3.5 sm:p-4',
};

const PRICING_TIER_ACCENT: Record<PricingTier, string> = {
  core: 'text-zinc-200',
  genesis: 'text-amber-400',
  pro: 'text-indigo-400',
};

function PricingCard({
  badge,
  title,
  price,
  priceSub,
  priceTag,
  features,
  tier,
  icon: Icon,
  cardNo,
  ctaLabel,
  ctaVariant,
  onCta,
}: {
  badge: string;
  title: string;
  price: string;
  priceSub?: string;
  priceTag?: string;
  features: string[];
  tier: PricingTier;
  icon: typeof Lock;
  cardNo?: string;
  ctaLabel?: string;
  ctaVariant?: PricingCtaVariant;
  onCta?: () => void;
}) {
  const accentClass = PRICING_TIER_ACCENT[tier];
  const featureGap = tier === 'genesis' ? 'mt-5 space-y-2' : 'mt-3.5 space-y-1.5';

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border ${PRICING_TIER_SHELL[tier]}`}
    >
      {tier === 'genesis' ? (
        <span className="absolute -top-2.5 right-4 rounded-full bg-amber-400 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-950">
          首發限量 · 推薦
        </span>
      ) : null}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accentClass}`} />
          <span className={`font-mono text-[11px] tracking-wider ${accentClass}`}>
            {badge}
          </span>
        </div>
        {cardNo ? (
          <span className="font-mono text-[9px] tracking-[0.14em] text-zinc-500">
            {cardNo}
          </span>
        ) : null}
      </div>
      <h3
        className={`relative font-serif text-zinc-100 ${
          tier === 'genesis' ? 'mt-3 text-xl' : 'mt-2.5 text-lg'
        }`}
      >
        {title}
      </h3>
      <div
        className={`relative flex flex-wrap items-center gap-2 ${
          tier === 'genesis' ? 'mt-2' : 'mt-1.5'
        }`}
      >
        <p className="font-mono text-lg text-zinc-100">{price}</p>
        {priceTag ? (
          <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-amber-300">
            {priceTag}
          </span>
        ) : null}
      </div>
      {priceSub ? (
        <p className="relative font-mono text-xs text-zinc-400">{priceSub}</p>
      ) : null}
      <ul className={`relative ${featureGap} flex-1 text-sm text-zinc-300`}>
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="shrink-0 text-zinc-500" aria-hidden>
              ▸
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {ctaLabel && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className={
            ctaVariant === 'primary'
              ? 'btn-primary relative mt-5 w-full min-h-11'
              : 'btn-secondary relative mt-4 w-full min-h-10 !py-2.5 text-sm'
          }
        >
          {ctaLabel}
        </button>
      ) : null}
    </article>
  );
}
