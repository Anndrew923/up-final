import { Link } from 'react-router-dom';
import { ArrowRight, Cloud, Lock, Trophy } from 'lucide-react';
import { AthletesShowcase } from '../components/AthletesShowcase';
import { DeveloperHobbyBanner } from '../components/DeveloperHobbyBanner';
import { FaqAccordion } from '../components/FaqAccordion';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { MetricMindsetUpgrade } from '../components/MetricMindsetUpgrade';
import { OverallGradeLadderCard } from '../components/OverallGradeLadderCard';
import { RadarPreview } from '../components/RadarPreview';
import { SystemsShowcase } from '../components/SystemsShowcase';

interface HomePageProps {
  onDownload: () => void;
}

function LaurelBadge({ label }: { label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
      <svg
        viewBox="0 0 48 40"
        className="h-8 w-10 text-amber-300/90 sm:h-9 sm:w-11"
        fill="none"
        aria-hidden
      >
        <path
          d="M8 28c2-8 8-14 16-16 8 2 14 8 16 16"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M10 22c1.5-4 4.5-7 8-8M38 22c-1.5-4-4.5-7-8-8M12 30c2 2 5 3 8 3M36 30c-2 2-5 3-8 3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="24" cy="14" r="2.2" fill="currentColor" opacity="0.9" />
      </svg>
      <p className="max-w-[9.5rem] font-mono text-[10px] leading-snug tracking-wide text-zinc-300 sm:max-w-none sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

export function HomePage({ onDownload }: HomePageProps) {
  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      <section
        id="hero"
        className="relative overflow-x-hidden border-b border-white/5 bg-ink"
      >
        <HeroBackdrop />

        <div className="ui-container relative grid items-center gap-6 py-6 sm:gap-8 sm:py-14 lg:grid-cols-2 lg:gap-10 lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-[10px] tracking-wide text-amber-200/95 backdrop-blur-sm sm:text-[11px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" aria-hidden />
              肌力體能教練實測研發 · 六大運動生理學常模
            </p>

            <div className="mt-4 flex items-start justify-between gap-2 sm:mt-5 sm:gap-4">
              <LaurelBadge label="六軸常模量化引擎" />
              <div className="hidden h-10 w-px shrink-0 bg-white/10 sm:block" aria-hidden />
              <LaurelBadge label="14 階超跑級天梯" />
            </div>

            <h1 className="mt-4 max-w-[17.5rem] font-serif text-[1.65rem] leading-[1.28] text-white sm:mt-5 sm:max-w-none sm:text-4xl sm:leading-snug lg:text-[2.65rem]">
              終結訓練內耗，
              <br className="sm:hidden" />
              用數據定義真實戰力。
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:mt-5 sm:text-base">
              增肌怕胖、減脂怕掉力、練大卻跑不動？
              <br />
              把每次訓練當作精準改裝，用六軸常模看清真實戰力。
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <button
                id="hero-primary-cta"
                type="button"
                onClick={onDownload}
                className="btn-primary min-h-11 w-full sm:w-auto"
              >
                開始免費評測
              </button>
              <Link
                to="/science"
                className="btn-secondary min-h-11 w-full sm:w-auto"
              >
                科學評測白皮書
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* WHY: Price anchor mirrors #plans positioning — no invented dollar amounts. */}
            <a
              href="#plans"
              className="mt-3 inline-flex max-w-full items-center rounded-lg border border-white/20 bg-white/[0.07] px-3 py-2 font-mono text-[11px] leading-snug tracking-wide text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition hover:border-amber-400/50 hover:text-amber-200 sm:mt-4 sm:text-xs"
            >
              核心評測永久免費 · 創世早鳥席一次性買斷終身免訂閱
            </a>
          </div>
          <div id="radar" className="min-w-0 space-y-3">
            <RadarPreview />
            <DeveloperHobbyBanner />
          </div>
        </div>
      </section>

      {/* WHY: Sits after hobby tease, before systems — mindset bridge without bloating hero. */}
      <MetricMindsetUpgrade />

      <section
        className="ui-section border-y border-violet-500/20 bg-night"
        id="systems"
      >
        <div className="ui-container">
          <p className="ui-kicker-zh-violet">核心系統</p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
            四大核心評測系統
          </h2>
          <div className="mt-5 sm:mt-8">
            <SystemsShowcase />
          </div>
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
          <p className="ui-kicker-zh-orange">實測背書</p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
            專項運動員實測
          </h2>
          <div className="mt-5 sm:mt-8">
            <AthletesShowcase />
          </div>
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
          <p className="ui-kicker-zh-amber">權益方案</p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
            方案與早鳥權益
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:mt-3">
            核心評測零門檻永久免費；解鎖天梯與戰力引擎，挑戰更高維度。
          </p>

          {/* WHY: Mobile leads with GENESIS; desktop keeps CORE | GENESIS | PRO. Copy SSOT unchanged. */}
          <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-3 lg:items-stretch">
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

          <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:mt-10 sm:flex-row sm:items-center sm:gap-3">
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
