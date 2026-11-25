import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Gauge } from 'lucide-react';
import { OverallGradeLadderCard } from '../components/OverallGradeLadderCard';
import {
  academicReferences,
  doiDisplayLabel,
  scienceAxes,
  scoreCharter,
  specialtyMetrics,
  strengthLiftCatalog,
  telemetryMapping,
} from '../data/scienceData';

interface SciencePageProps {
  onDownload: () => void;
}

/** In-page TOC — compact pills; hash targets clear fixed navbar via scroll-margin. */
const SCIENCE_TOC = [
  { id: 'science-charter', label: '分數憲章' },
  { id: 'science-telemetry', label: '遙測映射' },
  { id: 'science-axes', label: '六軸方法論' },
  { id: 'science-ladder', label: '14 階探測' },
  { id: 'science-specialty', label: '專項榮譽' },
  { id: 'science-refs', label: '文獻索引' },
] as const;

export function SciencePage({ onDownload }: SciencePageProps) {
  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      <section className="border-b border-white/5 bg-panel/50">
        <div className="ui-container py-8 sm:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </Link>
          <p className="ui-kicker-zh mt-6">科學評測 · 14 階基準</p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            科學評測與 14 階基準
          </h1>
          <p className="ui-body mt-4 max-w-2xl">
            最強肉體 Ultimate Physique 將原始物理量映射至以 100
            分為人類精英基準的六軸量尺；破百即超頻突破。同一頁可閱讀方法論並互動體驗
            14 階綜合評級段位。
          </p>

          <nav
            className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            aria-label="科學評測章節導覽"
          >
            {SCIENCE_TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-lg border border-white/15 bg-steel/80 px-3 py-2 text-center font-mono text-xs tracking-wide text-fg-secondary transition hover:border-energy/40 hover:text-energy sm:text-left sm:text-xs"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="ui-section">
        <div className="ui-container space-y-6">
          <div id="science-charter" className="ui-card min-w-0 p-4 sm:p-8">
            <div className="flex min-w-0 items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-energy" />
              <div className="min-w-0 flex-1">
                <p className="ui-kicker-zh mb-2">方法論總綱</p>
                <h2 className="ui-h2-doc">
                  統一分數空間憲章
                </h2>
                <div className="formula-box-steel mt-4 space-y-2.5">
                  <p>
                    單軸理論上限：
                    <span className="tabular-nums text-energy">
                      {' '}
                      {scoreCharter.axisMax}
                    </span>
                    {' '}分
                  </p>
                  <p>100 分語意：{scoreCharter.eliteBenchmarkMeaning}</p>
                  <p>{scoreCharter.overclockBand}</p>
                  <p className="break-words">{scoreCharter.overall}</p>
                  <p>
                    不進六軸：
                    {scoreCharter.specialtiesExcluded.join('、')}（專項榮譽）
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div id="science-telemetry" className="ui-card min-w-0 p-4 sm:p-8">
            <div className="flex min-w-0 items-start gap-3">
              <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-energy" />
              <div className="min-w-0 flex-1">
                <p className="ui-kicker-zh mb-2">{telemetryMapping.kicker}</p>
                <h2 className="ui-h2-doc">
                  {telemetryMapping.title}
                </h2>
                <p className="ui-body mt-4">
                  {telemetryMapping.coreRule}
                </p>
                <p className="ui-label mt-4">{telemetryMapping.pairsLead}</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {telemetryMapping.pairs.map((pair) => (
                    <li
                      key={pair.id}
                      className="rounded-xl border border-white/10 bg-void/40 px-3 py-2.5 text-sm text-fg-secondary"
                    >
                      <span className="text-fg">{pair.physique}</span>
                      <span className="mx-2 font-mono text-xs text-fg-muted">→</span>
                      <span className="text-energy">{pair.spectrum}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="science-axes" className="pb-16 sm:pb-20">
        <div className="ui-container space-y-6">
          <div>
            <p className="ui-kicker-zh mb-2">六軸方法論</p>
            <h2 className="ui-h2-doc">六大維度詳細拆解</h2>
          </div>
          {scienceAxes.map((axis) => (
            <article key={axis.id} className="ui-card min-w-0 overflow-hidden">
              <div className="border-b border-white/5 bg-void/40 px-3 py-3 sm:px-6 sm:py-4">
                <p className="ui-kicker-zh">
                  {axis.titleZh} · {axis.carMetaphor}
                </p>
                <h3 className="ui-h3 mt-1">{axis.titleZh}</h3>
              </div>
              <div className="grid min-w-0 gap-5 p-3 sm:gap-6 sm:p-6 lg:grid-cols-2">
                <div className="min-w-0">
                  <p className="ui-kicker-zh mb-2">輸入參數</p>
                  <ul className="ui-body space-y-1.5 text-sm">
                    {axis.inputs.map((line, i) => (
                      <li key={`${axis.id}-in-${i}`}>· {line}</li>
                    ))}
                  </ul>
                  <p className="ui-kicker-zh mb-2 mt-5">常模基準與測量邊界</p>
                  <ul className="ui-body space-y-2 text-sm">
                    {axis.normNotes.map((line, i) => (
                      <li key={`${axis.id}-norm-${i}`}>· {line}</li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0">
                  <p className="ui-kicker-zh mb-2">核心公式與模型架構</p>
                  {/*
                    WHY formula-box (night + mono): elevates Brzycki / DOTS / FFMI / Cooper
                    model lines as telemetry frames without deleting a single sentence.
                  */}
                  <ul className="formula-box list-none space-y-3">
                    {axis.formulas.map((f, i) => (
                      <li key={`${axis.id}-fx-${i}`} className="break-words">
                        · {f}
                      </li>
                    ))}
                  </ul>
                  {axis.contrastNotes && axis.contrastNotes.length > 0 ? (
                    <>
                      <p className="ui-kicker-zh mb-2 mt-5">學理對照與適用範圍</p>
                      <ul className="ui-body space-y-2 text-sm text-fg-muted">
                        {axis.contrastNotes.map((line, i) => (
                          <li key={`${axis.id}-cx-${i}`}>· {line}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="ui-kicker-zh mb-2 mt-5">文獻與常模出處</p>
                  <ul className="ui-body space-y-1 text-sm">
                    {axis.literature.map((l, i) => (
                      <li key={`${axis.id}-lit-${i}`}>· {l}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {axis.id === 'strength' && (
                <div className="border-t border-white/5 px-3 py-3 sm:px-6 sm:py-4">
                  <p className="ui-kicker-zh mb-3">五項核心動作 · 生物力學與常模定位</p>
                  <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-white/10">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-void/80 font-mono text-xs text-fg-muted">
                        <tr>
                          <th className="px-3 py-2 font-medium">動作名稱</th>
                          <th className="px-3 py-2 font-medium">
                            主導肌群與生物力學模式
                          </th>
                          <th className="px-3 py-2 font-medium">常模定位說明</th>
                        </tr>
                      </thead>
                      <tbody className="text-fg-secondary">
                        {strengthLiftCatalog.map((lift) => (
                          <tr key={lift.key} className="border-t border-white/5">
                            <td className="px-3 py-2.5 align-top font-medium text-fg">
                              {lift.name}
                            </td>
                            <td className="px-3 py-2.5 align-top leading-relaxed">
                              {lift.biomechanics}
                            </td>
                            <td className="px-3 py-2.5 align-top leading-relaxed text-fg-muted">
                              {lift.normRole}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/*
        WHY: Ladder sits after six-axis methodology so visitors read the score charter
        first, then probe 14 tiers in the same scroll — no separate home section needed.
      */}
      <section
        id="science-ladder"
        className="ui-section border-t border-amber-500/25 bg-hall"
      >
        <div className="ui-container">
          <OverallGradeLadderCard />
        </div>
      </section>

      <section
        id="science-specialty"
        className="border-t border-white/5 bg-panel/40 ui-section"
      >
        <div className="ui-container">
          <p className="ui-kicker-zh mb-2">專項榮譽</p>
          <h2 className="ui-h2-doc">專項指標說明</h2>
          <p className="ui-body mt-2 max-w-2xl">
            以下為專項榮譽指標，用於名片／天梯細項，不稀釋六軸綜合戰力。
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {specialtyMetrics.map((m) => (
              <article key={m.id} className="ui-card p-5">
                <h3 className="font-semibold text-fg">{m.titleZh}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{m.summary}</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-muted">
                  {m.notes.map((n, i) => (
                    <li key={`${m.id}-n-${i}`}>· {n}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="science-refs" className="border-t border-white/5 ui-section">
        <div className="ui-container">
          <p className="ui-kicker-zh">文獻索引</p>
          <h2 className="ui-h2-doc mt-2">
            學術參考文獻（Academic References）
          </h2>
          <p className="ui-body mt-2 max-w-2xl text-fg-muted">
            同儕審查文獻依作者姓氏字母排序。有穩定 DOI
            者提供外部連結；其餘採標準 APA 卷期標註。公開白皮書說明評測原理與模型架構；實際分數計算以產品內建運動生理學常模為準，文獻支撐測量學信效度與學理邊界。
          </p>
          <ol className="mt-8 list-decimal space-y-5 pl-5 text-sm leading-relaxed text-fg-secondary marker:font-mono marker:text-fg-muted">
            {academicReferences.map((ref) => (
              <li key={ref.id} className="min-w-0 pl-1">
                <p className="text-fg-secondary">
                  {ref.lead}
                  <em>{ref.journal}</em>
                  {ref.trailing}
                </p>
                {ref.doiUrl ? (
                  <p className="mt-1.5">
                    <a
                      href={ref.doiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-mono text-xs tabular-nums text-energy underline-offset-2 hover:underline"
                      aria-label={`${ref.journal} DOI（另開分頁）`}
                    >
                      {doiDisplayLabel(ref.doiUrl)}
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="science-cta" className="border-t border-white/10 bg-steel ui-section">
        <div className="ui-container">
          <div className="rounded-2xl border border-energy/30 bg-night/80 p-5 sm:p-8">
            <p className="ui-kicker-zh">實測轉換</p>
            <h2 className="ui-h2-doc mt-2 max-w-2xl text-balance">
              看懂背後的運動生理學模型了嗎？立即輸入數據，生成你的六軸戰力雷達
            </h2>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={onDownload}
                className="btn-primary min-h-11 w-full sm:w-auto"
              >
                開始免費評測
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/pricing" className="btn-secondary min-h-11 w-full sm:w-auto">
                Pro 方案與常見問題
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
