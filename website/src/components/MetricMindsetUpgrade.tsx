/**
 * Homepage「指標觀念升級」— twin equal-weight titanium cards on a steel-blue band.
 * WHY: De-blue chrome + `steel` stage so this block reads apart from ink systems above/below.
 */

interface ContrastCard {
  label: string;
  metric: string;
  body: string;
}

const CARDS: readonly ContrastCard[] = [
  {
    label: '瘦身指標',
    metric: '體脂率',
    body: '跳脫只看體重，精準掌握體組成',
  },
  {
    label: '訓練指標',
    metric: '最強肉體分數',
    body: '跳脫單一維度，六軸量化真實戰力',
  },
];

const CARD_SHELL = 'border-white/30 bg-white/[0.06]';

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
              className={`rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 ${CARD_SHELL}`}
            >
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
