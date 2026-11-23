import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cloud,
  Gauge,
  Lock,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { AthleteEndorsementCard } from '../components/AthleteEndorsementCard';
import { DeveloperHobbyBanner } from '../components/DeveloperHobbyBanner';
import { MetricMindsetUpgrade } from '../components/MetricMindsetUpgrade';
import { OverallGradeLadderCard } from '../components/OverallGradeLadderCard';
import { RadarPreview } from '../components/RadarPreview';
import { athletes } from '../data/athletes';

interface HomePageProps {
  onDownload: () => void;
}

type FeatureAccent = 'sky' | 'cyan' | 'teal' | 'indigo';

/**
 * Four-step cool telemetry spectrum (sky → cyan → teal → indigo).
 * WHY: Mobile stacks vertically — progressive hues avoid adjacent same-color cards.
 */
const FEATURE_ACCENT: Record<
  FeatureAccent,
  { badge: string; glow: string }
> = {
  sky: {
    badge: 'border border-sky-500/20 bg-sky-500/10 text-sky-400',
    glow: 'bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_55%)]',
  },
  cyan: {
    badge: 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    glow: 'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_55%)]',
  },
  teal: {
    badge: 'border border-teal-500/20 bg-teal-500/10 text-teal-400',
    glow: 'bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_55%)]',
  },
  indigo: {
    badge: 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    glow: 'bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.14),transparent_55%)]',
  },
};

const BENTO = [
  {
    sys: '01',
    accent: 'sky',
    icon: Gauge,
    title: '打破量級與性別紅利，實力客觀說話',
    body: '體重降 3 kg、臥推少 5 kg，是退步還是變強？整合六大體能與體組成常模，消除量級與性別差異，算出真實戰力。',
  },
  {
    sys: '02',
    accent: 'cyan',
    icon: Share2,
    title: '專屬戰力戰報 & 訓練自拍卡',
    body: '記錄每次身體改裝軌跡。無論六邊形全能戰力、單項破 PR 或健身房自拍，一鍵生成高質感戰報卡片。',
  },
  {
    sys: '03',
    accent: 'teal',
    icon: Users,
    title: '全球天梯 & 俱樂部私榜',
    body: '尋找同齡、同量級甚至跨性別的訓練同好，疊加雙人雷達正面 PK，在良性切磋中鎖定下一個突破目標。',
  },
  {
    sys: '04',
    accent: 'indigo',
    icon: Sparkles,
    title: 'DYNO INTEL 戰力引擎',
    body: '重量推得上去，心肺或握力卻拖垮總分？精準揪出六軸弱項短板，給出下一步調校方向，讓每滴汗都有效。',
  },
] as const;

export function HomePage({ onDownload }: HomePageProps) {
  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      <section
        id="hero"
        className="relative overflow-x-hidden border-b border-white/5"
      >
        {/* WHY: Isolate decorative overflow so radar labels are not clipped. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" />
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-energy/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-zinc-500/10 blur-3xl" />
        </div>

        <div className="ui-container relative grid items-center gap-6 py-6 sm:gap-8 sm:py-14 lg:grid-cols-2 lg:gap-10 lg:py-16">
          <div className="min-w-0">
            <p className="ui-kicker-zh">六軸體能量化系統</p>
            <h1 className="mt-2 max-w-[17.5rem] font-serif text-[1.65rem] leading-[1.28] text-zinc-100 sm:mt-4 sm:max-w-none sm:text-4xl sm:leading-snug lg:text-[2.65rem]">
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
          </div>
          <div id="radar" className="min-w-0 space-y-3">
            <RadarPreview />
            <DeveloperHobbyBanner />
          </div>
        </div>
      </section>

      {/* WHY: Sits after hobby tease, before systems — mindset bridge without bloating hero. */}
      <MetricMindsetUpgrade />

      <section className="ui-section" id="systems">
        <div className="ui-container">
          <p className="ui-kicker-zh">核心系統</p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
            四大核心評測系統
          </h2>
          <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
            {BENTO.map((item) => (
              <FeatureSystemCard key={item.sys} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="ui-section border-y border-white/5 bg-panel/30"
        id="ladder"
      >
        <div className="ui-container">
          <OverallGradeLadderCard />
        </div>
      </section>

      {/* WHY border-b (not border-y): #ladder already draws the shared top hairline. */}
      <section className="ui-section border-b border-white/5 bg-panel/40" id="athletes">
        <div className="ui-container">
          <p className="ui-kicker-zh">實測背書</p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
            專項運動員實測
          </h2>
          <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {athletes.map((athlete) => (
              <AthleteEndorsementCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-x-hidden border-y border-zinc-900 bg-zinc-950/80 ui-section"
        id="plans"
      >
        {/* Champagne ambient — separates 權益方案 from cool telemetry sections above. */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12),transparent_70%)] blur-2xl"
          aria-hidden
        />
        <div className="ui-container relative">
          <p className="ui-kicker-zh">權益方案</p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:mt-3 sm:text-3xl">
            方案與早鳥權益
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:mt-3">
            核心評測零門檻永久免費；解鎖天梯與戰力引擎，挑戰更高維度。
          </p>

          <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-3">
            <PricingCard
              badge="CORE"
              title="本機版"
              price="免費開放"
              priceSub="免註冊即用"
              tier="core"
              features={[
                '六軸戰力評測與雷達全開',
                '訓練日誌、1RM計算器與槓片計算器',
                '專屬戰力圖卡與自拍浮水印匯出',
                '全站零廣告干擾，純粹專注訓練',
              ]}
              icon={Lock}
            />
            <PricingCard
              badge="GENESIS"
              title="創世早鳥席"
              price="限量 2,000 席"
              priceSub="額滿永久絕版"
              tier="genesis"
              features={[
                '終身免訂閱，永久解鎖全球天梯（讀取／上傳）',
                '專屬創世先鋒席次編號（限量 2,000 席）',
                '完整保留免費版全部核心功能',
              ]}
              icon={Trophy}
            />
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

          {/* WHY: Primary orange CTA lives in StickyDownloadBar — avoid double orange at fold end. */}
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
    </div>
  );
}

function FeatureSystemCard({ item }: { item: (typeof BENTO)[number] }) {
  const accent = FEATURE_ACCENT[item.accent];

  return (
    <article className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:p-6">
      <div
        className={`pointer-events-none absolute inset-0 ${accent.glow}`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.badge}`}
        >
          <item.icon className="h-5 w-5" aria-hidden />
        </div>
        <span className="font-mono text-[11px] tracking-widest text-zinc-500">
          SYS // {item.sys}
        </span>
      </div>
      <h3 className="relative mt-3 text-base font-semibold text-zinc-100 sm:mt-4 sm:text-lg">
        {item.title}
      </h3>
      <p className="relative mt-1.5 text-sm leading-snug text-zinc-300 sm:mt-2 sm:leading-relaxed">
        {item.body}
      </p>
    </article>
  );
}

type PricingTier = 'core' | 'genesis' | 'pro';

const PRICING_TIER_SHELL: Record<PricingTier, string> = {
  core: 'bg-zinc-900/60 border-zinc-800',
  genesis:
    'bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-950 border-amber-400/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]',
  pro: 'bg-gradient-to-b from-indigo-500/10 to-zinc-950 border-indigo-400/35',
};

const PRICING_TIER_ACCENT: Record<PricingTier, string> = {
  core: 'text-zinc-300',
  genesis: 'text-amber-400',
  pro: 'text-indigo-400',
};

function PricingCard({
  badge,
  title,
  price,
  priceSub,
  features,
  tier,
  icon: Icon,
}: {
  badge: string;
  title: string;
  price: string;
  priceSub?: string;
  features: string[];
  tier: PricingTier;
  icon: typeof Lock;
}) {
  const accentClass = PRICING_TIER_ACCENT[tier];

  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-4 sm:p-6 ${PRICING_TIER_SHELL[tier]}`}
    >
      {tier === 'genesis' ? (
        <span className="absolute -top-2.5 right-4 rounded-full bg-amber-400 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-950">
          首發限量 · 推薦
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accentClass}`} />
        <span className={`font-mono text-[11px] tracking-wider ${accentClass}`}>
          {badge}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-xl text-zinc-100">{title}</h3>
      <p className="mt-2 font-mono text-lg text-zinc-100">{price}</p>
      {priceSub ? (
        <p className="font-mono text-xs text-zinc-400">{priceSub}</p>
      ) : null}
      <ul className="mt-5 space-y-2 text-sm text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="shrink-0 text-zinc-500" aria-hidden>
              ▸
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
