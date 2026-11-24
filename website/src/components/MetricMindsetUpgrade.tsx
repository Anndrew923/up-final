/**
 * Homepage「指標觀念升級」— twin equal-weight contrast cards on a steel-blue band.
 * WHY: Strip HUD chrome (scanlines / sparks / polylines / corner brackets) so the
 * locked eight-character contrast copy breathes on a clean dark stage.
 */

interface ContrastCard {
  label: string;
  metric: string;
  body: string;
  wash: string;
  border: string;
  labelTone: string;
  stroke: string;
  fill: string;
}

const CARDS: readonly ContrastCard[] = [
  {
    label: '瘦身指標',
    metric: '體脂率',
    body: '跳脫只看體重，科學解析身體組成',
    wash: 'from-amber-500/15 via-transparent to-transparent',
    border: 'border-amber-400/35',
    labelTone: 'text-amber-300/90',
    stroke: 'rgba(251,191,36,0.45)',
    fill: 'rgba(251,191,36,0.08)',
  },
  {
    label: '訓練指標',
    metric: '最強肉體分數',
    body: '跳脫單一維度，六軸量化真實戰力',
    wash: 'from-energy/18 via-transparent to-transparent',
    border: 'border-energy/35',
    labelTone: 'text-energy/90',
    stroke: 'rgba(0,191,255,0.45)',
    fill: 'rgba(0,191,255,0.08)',
  },
];

/** Quiet hex watermark — presentational accent only. */
function MiniHexMark({ stroke, fill }: { stroke: string; fill: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-14 w-14 shrink-0 opacity-35 sm:h-16 sm:w-16"
      aria-hidden
    >
      <polygon
        points="32,6 54,19 54,45 32,58 10,45 10,19"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.5"
      />
      <polygon
        points="32,14 46,22 46,42 32,50 18,42 18,22"
        fill="none"
        stroke={stroke}
        strokeWidth="0.8"
        opacity="0.4"
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
      className="border-y border-white/15 bg-steel ui-section"
      aria-labelledby="metric-mindset-heading"
    >
      <div className="ui-container">
        <div className="ui-section-head">
          <p className="ui-kicker-zh-amber">指標觀念升級</p>
          <h2
            id="metric-mindset-heading"
            className="mt-2 text-balance font-serif text-xl leading-snug text-zinc-100 sm:mt-3 sm:text-3xl"
          >
            如同瘦身必須量體脂率，訓練也要導入精準指標。
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 md:items-stretch">
          {CARDS.map((card) => (
            <li
              key={card.label}
              className={`relative h-full overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-black p-6 sm:p-7 ${card.border}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.wash}`}
                aria-hidden
              />

              <div className="relative flex h-full items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-mono text-[10px] tracking-wide sm:text-[11px] ${card.labelTone}`}
                  >
                    {card.label}
                    <span className="mx-1.5 opacity-50" aria-hidden>
                      ·
                    </span>
                    {card.metric}
                  </p>
                  <p className="mt-3 text-pretty text-base font-semibold leading-relaxed text-white">
                    {card.body}
                  </p>
                </div>
                <MiniHexMark stroke={card.stroke} fill={card.fill} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
