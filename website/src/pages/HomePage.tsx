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
import { RadarPreview } from '../components/RadarPreview';
import { athletesData, type AthleteCard } from '../data/athletesData';

interface HomePageProps {
  onDownload: () => void;
}

const BENTO = [
  {
    icon: Gauge,
    title: '跨量級公平對標',
    body: '導入 IPF DOTS、McCulloch 年齡係數與異速生長模型，消除體重與年齡紅利，實現跨量級公平對標。',
  },
  {
    icon: Share2,
    title: 'Carbon 黑金戰報 & 單項成績卡',
    body: '一鍵匯出六軸全能戰報與單項（自由重量平板臥推、槓鈴深蹲、硬舉、握力）高質感分享卡，精準展現強項。',
  },
  {
    icon: Users,
    title: '全球多維天梯 & 俱樂部私榜',
    body: '依職業、年齡層、體重級距與城市行政區篩選同儕子榜，支援雙雷達「戰力切磋」與匿名隱私模式。',
  },
  {
    icon: Sparkles,
    title: 'DYNO INTEL 數據智庫',
    body: '拒絕空泛套話，基於你的六軸實測數據與體重模擬推演，提供精準弱項診斷與訓練方向。',
  },
] as const;

export function HomePage({ onDownload }: HomePageProps) {
  return (
    <div className="overflow-x-hidden pb-24 md:pb-0">
      <section className="relative overflow-hidden border-b border-white/5">
        <div
          className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-energy/10 blur-3xl"
          aria-hidden
        />

        <div className="ui-container relative grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:gap-10 lg:py-16">
          <div className="min-w-0">
            <p className="ui-kicker">SPORTS SCIENCE // 運動生理學量化評測系統</p>
            <h1 className="mt-4 font-serif text-3xl leading-snug text-zinc-100 text-balance sm:text-4xl lg:text-[2.65rem]">
              別再憑感覺訓練，用運動生理學量化你的真實戰力。
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              將最大肌力、爆發力、心肺、骨骼肌量、FFMI 與握力映射至{' '}
              <span className="font-mono text-brand">0–200</span>{' '}
              科學量尺，生成專屬六軸戰力雷達。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={onDownload} className="btn-primary">
                開始六軸評測
              </button>
              <Link to="/science" className="btn-secondary">
                查閱科學評測白皮書
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] text-zinc-400">
              支援 iOS &amp; Android · 核心評測永久免費
            </p>
          </div>
          <div className="min-w-0">
            <RadarPreview />
          </div>
        </div>
      </section>

      <section className="ui-section" id="features">
        <div className="ui-container">
          <p className="ui-kicker">CORE SYSTEMS</p>
          <h2 className="mt-3 font-serif text-2xl text-zinc-100 sm:text-3xl">
            四大核心評測系統
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {BENTO.map((item) => (
              <article key={item.title} className="ui-card p-5 sm:p-6">
                <item.icon className="h-5 w-5 text-brand" aria-hidden />
                <h3 className="mt-3 text-base font-semibold text-zinc-100 sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-section border-y border-white/5 bg-panel/40" id="athletes">
        <div className="ui-container">
          <p className="ui-kicker">ATHLETE ENDORSEMENT</p>
          <h2 className="mt-3 font-serif text-2xl text-zinc-100 sm:text-3xl">
            專項運動員實測背書牆
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300">
            嚴選各領域頂尖運動員與教練實測標竿，驗證跨專項體能表現。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {athletesData.map((athlete) => (
              <AthleteCardView key={athlete.id} athlete={athlete} />
            ))}
          </div>
        </div>
      </section>

      <section className="ui-section" id="pricing">
        <div className="ui-container">
          <p className="ui-kicker">ACCESS</p>
          <h2 className="mt-3 font-serif text-2xl text-zinc-100 sm:text-3xl">
            方案與早鳥權益
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300">
            核心六軸評測永久免費；升級解鎖雲端同步、全球天梯與 AI 深度分析。
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <PricingCard
              badge="CORE"
              title="本機版"
              price="永久免費"
              accent="energy"
              features={[
                '六軸評測與雷達全開',
                '本機日誌與整備工具',
                'Carbon／Selfie 戰報導出',
                '無需訂閱即可完整使用',
              ]}
              icon={Lock}
            />
            <PricingCard
              badge="GENESIS"
              title="創世早鳥席"
              price="前 2,000 席"
              accent="brand"
              highlight
              features={[
                '終身免訂閱解鎖全球天梯排行',
                '保留免費版全部核心功能',
                '限量前 2,000 名創世席次（額滿即止）',
              ]}
              icon={Trophy}
            />
            <PricingCard
              badge="PRO"
              title="訂閱 PRO"
              price="$1.99 / 月"
              priceSub="或 $14.99 USD／年"
              accent="brand"
              features={[
                '雲端備份與還原',
                '全球多維天梯完整通行權',
                'DYNO INTEL 每日 30 次高算力',
                '體重模擬推演',
              ]}
              icon={Cloud}
            />
          </div>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={onDownload} className="btn-primary">
              開始六軸評測
            </button>
            <a href="#features" className="btn-secondary">
              回到亮點
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function AthleteCardView({ athlete }: { athlete: AthleteCard }) {
  const recruiting = athlete.status === 'recruiting';

  if (recruiting) {
    return (
      <article className="ui-card flex min-h-[200px] flex-col border-dashed border-white/15 p-4">
        <p className="font-mono text-[10px] tracking-wide text-energy">
          {athlete.specialtyTag}
        </p>
        <span className="mt-4 inline-flex w-fit items-center rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 font-mono text-[10px] text-brand">
          席位招募中
        </span>
        <h3 className="mt-4 text-sm font-semibold text-zinc-100">{athlete.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          {athlete.positioning}
        </p>
      </article>
    );
  }

  return (
    <article className="ui-card flex min-h-[200px] flex-col p-4 shadow-brand">
      <p className="font-mono text-[10px] tracking-wide text-energy">
        {athlete.specialtyTag}
      </p>
      {athlete.eventHeadline && (
        <p className="mt-3 text-xs text-brand">{athlete.eventHeadline}</p>
      )}
      <h3 className="mt-2 text-sm font-semibold text-zinc-100">{athlete.name}</h3>
      <p className="text-xs text-zinc-400">{athlete.title}</p>
      {athlete.metrics && (
        <ul className="mt-3 space-y-1 text-[11px] leading-snug text-zinc-300">
          {athlete.metrics.map((m) => (
            <li key={m}>· {m}</li>
          ))}
        </ul>
      )}
      {athlete.quote && (
        <p className="mt-auto pt-3 text-[11px] italic leading-relaxed text-zinc-300">
          「{athlete.quote}」
        </p>
      )}
    </article>
  );
}

function PricingCard({
  badge,
  title,
  price,
  priceSub,
  features,
  accent,
  highlight,
  icon: Icon,
}: {
  badge: string;
  title: string;
  price: string;
  priceSub?: string;
  features: string[];
  accent: 'brand' | 'energy';
  highlight?: boolean;
  icon: typeof Lock;
}) {
  return (
    <article
      className={`ui-card relative flex flex-col p-5 sm:p-6 ${
        highlight ? 'ring-1 ring-brand/50 shadow-brand' : ''
      }`}
    >
      {highlight && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-brand px-2 py-0.5 font-mono text-[10px] font-semibold text-black">
          推薦
        </span>
      )}
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${accent === 'brand' ? 'text-brand' : 'text-energy'}`}
        />
        <span
          className={`font-mono text-[11px] tracking-wider ${
            accent === 'brand' ? 'text-brand' : 'text-energy'
          }`}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-xl text-zinc-100">{title}</h3>
      <p className="mt-2 font-mono text-lg text-zinc-100">{price}</p>
      {priceSub && <p className="font-mono text-xs text-zinc-400">{priceSub}</p>}
      <ul className="mt-5 space-y-2 text-sm text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-brand">▸</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
