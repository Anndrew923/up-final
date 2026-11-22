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
    body: '依性別、年齡（McCulloch 係數）與體重（IPF DOTS／異速生長）消除體型紅利，讓不同量級訓練者站在同一基準線比較。',
  },
  {
    icon: Share2,
    title: 'Carbon 黑金戰報 & 單項葉節點名片',
    body: '支援六軸全能證書與單一強項（如自由重量平板臥推、握力、立定跳遠）獨立生成 9:16／4:5 高畫質戰報，免除弱項曝光包袱。',
  },
  {
    icon: Users,
    title: '全球多維天梯 & 俱樂部私榜',
    body: '依職業、年齡層、體重級距與城市行政區篩選同儕子榜，支援雙雷達「戰力切磋」與匿名隱私模式。',
  },
  {
    icon: Sparkles,
    title: 'DYNO INTEL 數據智庫',
    body: '專注於解碼你的六軸遙測數據與體重模擬推演，拒絕空泛的通用百科廢話。',
  },
] as const;

export function HomePage({ onDownload }: HomePageProps) {
  return (
    <div className="overflow-x-hidden pb-24 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div
          className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-30"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-energy/10 blur-3xl" />

        <div className="ui-container relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div className="min-w-0">
            <p className="ui-kicker">TELEMETRY // 人口學校準體能評測系統</p>
            <h1 className="mt-4 font-serif text-3xl leading-snug text-zinc-50 text-balance sm:text-4xl lg:text-[2.75rem]">
              別再憑感覺訓練，用運動生理學量化你的真實戰力。
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              輸入身體基線與訓練表現，將最大肌力、爆發力、心肺耐力、骨骼肌量、FFMI
              與握力映射至統一{' '}
              <span className="font-mono text-brand">0–200</span>{' '}
              分科學量尺，生成專屬六軸雷達與戰力認證。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={onDownload} className="btn-primary">
                立即下載 / 開始測功
              </button>
              <Link to="/science" className="btn-secondary">
                查閱科學評測白皮書
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] text-zinc-600">
              最強肉體 / Ultimate Physique · Local-First Core 永久可用
            </p>
          </div>
          <div className="min-w-0">
            <RadarPreview />
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="ui-section" id="features">
        <div className="ui-container">
          <p className="ui-kicker">DYNO MODULES</p>
          <h2 className="mt-3 font-serif text-2xl text-zinc-50 sm:text-3xl">
            核心亮點 · 測功機卡片
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {BENTO.map((item) => (
              <article key={item.title} className="ui-card p-5 sm:p-6">
                <item.icon className="h-5 w-5 text-brand" aria-hidden />
                <h3 className="mt-3 text-base font-semibold text-zinc-100 sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Athletes */}
      <section className="ui-section border-y border-white/5 bg-panel/40" id="athletes">
        <div className="ui-container">
          <p className="ui-kicker">ATHLETE ENDORSEMENT</p>
          <h2 className="mt-3 font-serif text-2xl text-zinc-50 sm:text-3xl">
            專項運動員實測背書牆
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            官方認證專項代表席位。後續只需更新資料源即可解鎖選手照片、賽事抬頭與實測數據。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {athletesData.map((athlete) => (
              <AthleteCardView key={athlete.id} athlete={athlete} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="ui-section" id="pricing">
        <div className="ui-container">
          <p className="ui-kicker">ACCESS · LOCAL-FIRST</p>
          <h2 className="mt-3 font-serif text-2xl text-zinc-50 sm:text-3xl">
            方案與早鳥權益
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Core 本機能力永遠免月費。訂閱解鎖的是雲端、全球天梯與高算力遙測解碼。
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
                '終身免訂閱進入全球天梯',
                '保留 Core 本機全能力',
                '不解鎖 Dyno／Cloud（與憲法一致）',
                '席次有限 · 先到先得',
              ]}
              icon={Trophy}
            />
            <PricingCard
              badge="PRO"
              title="訂閱"
              price="$1.99 / 月"
              priceSub="或 $14.99 USD／年"
              accent="brand"
              features={[
                '雲端備份與還原',
                '全球天梯（付費牆開啟後）',
                'DYNO INTEL 每日 30 次高算力',
                '體重模擬推演（Pro）',
              ]}
              icon={Cloud}
            />
          </div>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={onDownload} className="btn-primary">
              立即下載 / 開始測功
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
  return (
    <article
      className={`ui-card flex min-h-[220px] flex-col p-4 ${
        recruiting ? 'border-dashed border-white/15 opacity-90' : 'shadow-brand'
      }`}
    >
      <p className="font-mono text-[10px] tracking-wide text-energy">
        {athlete.specialtyTag}
      </p>
      <div className="mt-4 flex h-16 items-center justify-center rounded-xl border border-white/10 bg-base/60">
        {athlete.photoUrl ? (
          <img
            src={athlete.photoUrl}
            alt={athlete.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <span className="font-mono text-[10px] text-zinc-600">
            {recruiting ? 'SLOT LOCKED' : 'BENCHMARK'}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-100">{athlete.name}</h3>
      <p className="text-xs text-zinc-500">{athlete.title}</p>
      {athlete.eventHeadline && (
        <p className="mt-2 text-xs text-brand">{athlete.eventHeadline}</p>
      )}
      {athlete.metrics && (
        <ul className="mt-2 space-y-1 text-[11px] leading-snug text-zinc-400">
          {athlete.metrics.map((m) => (
            <li key={m}>· {m}</li>
          ))}
        </ul>
      )}
      {athlete.quote && (
        <p className="mt-auto pt-3 text-[11px] italic leading-relaxed text-zinc-500">
          「{athlete.quote}」
        </p>
      )}
      {recruiting && (
        <p className="mt-auto pt-3 font-mono text-[10px] text-zinc-600">
          官方認證專項代表招募／解鎖中
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
      <h3 className="mt-3 font-serif text-xl text-zinc-50">{title}</h3>
      <p className="mt-2 font-mono text-lg text-zinc-100">{price}</p>
      {priceSub && <p className="font-mono text-xs text-zinc-500">{priceSub}</p>}
      <ul className="mt-5 space-y-2 text-sm text-zinc-400">
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
