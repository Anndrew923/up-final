/**
 * Homepage「指標觀念升級」— twin equal-weight titanium cards on a steel-blue band.
 * WHY: WHOOP-style photo+HUD overlays raise visual density without changing the
 * locked eight-character contrast copy or `bg-steel` stage.
 */

interface ContrastCard {
  label: string;
  metric: string;
  body: string;
  axisCode: string;
  wash: string;
  spark: string;
  polyline: string;
  lineStroke: string;
  stroke: string;
  fill: string;
}

const CARDS: readonly ContrastCard[] = [
  {
    label: '瘦身指標',
    metric: '體脂率',
    body: '跳脫只看體重，科學解析身體組成',
    axisCode: 'COMP',
    wash: 'from-amber-500/20 via-transparent to-transparent',
    spark: 'border-amber-400/40 bg-amber-400/15 text-amber-300',
    polyline: '0,28 30,22 55,30 90,12 120,20 150,8 180,16 200,10',
    lineStroke: 'rgba(251,191,36,0.65)',
    stroke: 'rgba(251,191,36,0.55)',
    fill: 'rgba(251,191,36,0.12)',
  },
  {
    label: '訓練指標',
    metric: '最強肉體分數',
    body: '跳脫單一維度，六軸量化真實戰力',
    axisCode: 'HEX',
    wash: 'from-energy/25 via-transparent to-transparent',
    spark: 'border-energy/40 bg-energy/15 text-energy',
    polyline: '0,24 25,18 50,26 80,10 110,22 140,6 170,14 200,8',
    lineStroke: 'rgba(0,191,255,0.7)',
    stroke: 'rgba(0,191,255,0.55)',
    fill: 'rgba(0,191,255,0.12)',
  },
];

/** Mini hex radar decoration — presentational only. */
function MiniRadarHud({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 opacity-80" aria-hidden>
      <polygon
        points="32,6 54,19 54,45 32,58 10,45 10,19"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.45"
      />
      <polygon
        points="32,14 46,22 46,42 32,50 18,42 18,22"
        fill="none"
        stroke={stroke}
        strokeWidth="0.8"
        opacity="0.35"
      />
      <polygon
        points="32,18 44,25 42,40 32,46 20,38 22,24"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.1"
      />
      <circle cx="32" cy="32" r="1.6" fill={stroke} />
    </svg>
  );
}

export function MetricMindsetUpgrade() {
  return (
    <section
      className="border-y border-white/15 bg-steel py-6"
      aria-labelledby="metric-mindset-heading"
    >
      <div className="ui-container">
        <p className="ui-kicker-zh-amber">指標觀念升級</p>
        <h2
          id="metric-mindset-heading"
          className="mt-2 max-w-3xl text-balance font-serif text-xl leading-snug text-zinc-100 sm:mt-3 sm:text-3xl"
        >
          如同瘦身必須量體脂率，訓練也要導入精準指標。
        </h2>

        <ul className="mt-4 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2">
          {CARDS.map((card) => (
            <li
              key={card.label}
              className="relative overflow-hidden rounded-xl border border-white/30 bg-white/[0.06]"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.wash}`}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-6 -top-8 h-36 w-36 rounded-full bg-black/40 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-black/50 to-transparent"
                aria-hidden
              />
              <div className="hud-scanlines" aria-hidden />

              <div
                className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-white/35"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-white/35"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-white/35"
                aria-hidden
              />

              <div className="relative flex items-start justify-between gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] tracking-wide text-amber-300 sm:text-[11px]">
                    {card.label}
                    <span className="mx-1 opacity-50" aria-hidden>
                      ｜
                    </span>
                    {card.metric}
                  </p>
                  <p className="mt-1 text-pretty text-sm font-semibold leading-snug text-white">
                    {card.body}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wide ${card.spark}`}
                    >
                      HUD // LIVE
                    </span>
                    <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-zinc-400">
                      AXIS {card.axisCode}
                    </span>
                  </div>
                </div>
                <MiniRadarHud stroke={card.stroke} fill={card.fill} />
              </div>

              <svg
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full opacity-70"
                viewBox="0 0 200 40"
                preserveAspectRatio="none"
                aria-hidden
              >
                <polyline
                  points={card.polyline}
                  fill="none"
                  stroke={card.lineStroke}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
