import { Cloud, Lock, Trophy } from 'lucide-react';

type PricingTier = 'core' | 'genesis' | 'pro';
type PricingCtaVariant = 'primary' | 'ghost';

/**
 * Ladder-inspired metal membership shells.
 * Border on the outer article (no overflow clip) so GENESIS badge can ride the edge;
 * fill/brush live on an inner overflow-hidden layer.
 */
const PRICING_TIER_BORDER: Record<PricingTier, string> = {
  core: 'border-zinc-400/35',
  genesis: 'border-amber-400/55',
  pro: 'border-indigo-400/35',
};

const PRICING_TIER_FILL: Record<PricingTier, string> = {
  core:
    'metal-card-titanium bg-gradient-to-br from-zinc-300/15 via-zinc-800/90 to-zinc-950 p-3.5 sm:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_12px_40px_-16px_rgba(0,0,0,0.65)]',
  genesis:
    'metal-card-gold bg-gradient-to-br from-amber-500/20 via-[#1a1408] to-zinc-950 p-4 sm:p-6 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.28),0_0_36px_-8px_rgba(245,158,11,0.32)]',
  pro: 'bg-gradient-to-b from-indigo-500/10 to-zinc-950 p-3.5 sm:p-4',
};

/** Badge / icon chrome only — not used for titles or body copy. */
const PRICING_BADGE_CHROME: Record<PricingTier, string> = {
  core: 'text-fg-secondary',
  genesis: 'text-amber-300',
  pro: 'text-indigo-300',
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
  const badgeChrome = PRICING_BADGE_CHROME[tier];
  const featureGap = tier === 'genesis' ? 'mt-5 space-y-2' : 'mt-3.5 space-y-1.5';

  return (
    /*
      WHY outer has no overflow-hidden: GENESIS pill uses -top so it can ride the
      border; fill/brush clip on the inner shell. Parent cell adds pt for genesis
      so page-level overflow-x-hidden does not eat the protruding badge.
    */
    <article
      className={`relative flex h-full flex-col rounded-2xl border ${PRICING_TIER_BORDER[tier]}`}
    >
      {tier === 'genesis' ? (
        <span className="pointer-events-none absolute -top-2.5 right-3 z-10 rounded-full bg-amber-400 px-2.5 py-0.5 font-mono text-xs font-bold text-zinc-950 sm:right-4">
          首發限量 · 推薦
        </span>
      ) : null}
      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl ${PRICING_TIER_FILL[tier]}`}
      >
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${badgeChrome}`} />
            <span className={`font-mono text-xs tracking-wider ${badgeChrome}`}>
              {badge}
            </span>
          </div>
          {cardNo ? (
            <span className="ui-label shrink-0 font-mono tracking-[0.14em] tabular-nums">
              {cardNo}
            </span>
          ) : null}
        </div>
        <h3
          className={`relative text-fg ${
            tier === 'genesis' ? 'mt-3 text-xl font-semibold' : 'mt-2.5 text-lg font-semibold'
          }`}
        >
          {title}
        </h3>
        <div
          className={`relative flex flex-wrap items-center gap-2 ${
            tier === 'genesis' ? 'mt-2' : 'mt-1.5'
          }`}
        >
          <p className="font-mono text-lg tabular-nums text-fg">{price}</p>
          {priceTag ? (
            <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-xs tracking-wide text-amber-200">
              {priceTag}
            </span>
          ) : null}
        </div>
        {priceSub ? (
          <p className="ui-label relative font-mono tabular-nums">{priceSub}</p>
        ) : null}
        <ul className={`relative ${featureGap} ui-body flex-1 text-sm`}>
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="shrink-0 text-fg-muted" aria-hidden>
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
      </div>
    </article>
  );
}

interface PricingCardsProps {
  onDownload: () => void;
}

/** CORE | GENESIS | PRO comparison grid — SSOT for /pricing (and any future surfaces). */
export function PricingCards({ onDownload }: PricingCardsProps) {
  return (
    /*
      WHY: Mobile leads with GENESIS; desktop keeps CORE | GENESIS | PRO.
      pt-3 on every cell: GENESIS -top badge clearance under overflow-x-hidden
      ancestors; equal pad keeps lg:items-stretch heights aligned.
    */
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 lg:items-stretch">
      <div className="order-2 h-full pt-3 lg:order-1">
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
      <div className="order-1 h-full pt-3 lg:order-2">
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
      <div className="order-3 h-full pt-3">
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
  );
}
