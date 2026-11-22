import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ShieldAlert } from 'lucide-react';
import {
  scienceAxes,
  scoreCharter,
  specialtyMetrics,
  strengthLiftAnchors,
} from '../data/scienceData';

export function SciencePage() {
  return (
    <div className="overflow-x-hidden pb-24 md:pb-0">
      <section className="border-b border-white/5 bg-panel/50">
        <div className="ui-container py-12 sm:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </Link>
          <p className="ui-kicker mt-6">SCIENCE WHITEPAPER // METHODOLOGY</p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl text-zinc-50 text-balance sm:text-4xl">
            科學評測方法論與文獻白皮書
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            最強肉體 Ultimate Physique 將原始物理量映射至統一 0–200
            分尺。本頁僅引用程式實際使用的公式與常模——不做誇大宣稱。
          </p>
        </div>
      </section>

      {/* Charter */}
      <section className="ui-section">
        <div className="ui-container">
          <div className="ui-card p-5 sm:p-8">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div className="min-w-0">
                <h2 className="font-serif text-xl text-zinc-50 sm:text-2xl">
                  統一分數空間憲章
                </h2>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-300">
                  <li>
                    單軸上限：
                    <span className="font-mono text-brand"> {scoreCharter.axisMax}</span>
                  </li>
                  <li>
                    100 分語意：{scoreCharter.centuryMeaning}
                  </li>
                  <li>{scoreCharter.overclockBand}</li>
                  <li className="break-words">{scoreCharter.overall}</li>
                  <li>
                    不進六軸：
                    {scoreCharter.specialtiesExcluded.join('、')}（專項榮譽）
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
            <p>
              誠實邊界：本產品<strong className="font-semibold">未實作</strong> Sayers
              功瓦進分數；<strong className="font-semibold">未將</strong> VO₂max
              解析式算進分數；常模為程式內建或具名公式（Brzycki／IPF DOTS／McCulloch／Kouri／Cooper／WR），
              <strong className="font-semibold">非</strong> ACSM／NSCA 函式庫常數來源。
            </p>
          </div>
        </div>
      </section>

      {/* Axes */}
      <section className="pb-16 sm:pb-20">
        <div className="ui-container space-y-6">
          <h2 className="font-serif text-2xl text-zinc-50">六大維度詳細拆解</h2>
          {scienceAxes.map((axis) => (
            <article key={axis.id} className="ui-card overflow-hidden">
              <div className="border-b border-white/5 bg-base/40 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-energy">
                    {axis.telemetryCode} · {axis.carMetaphor}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600">
                    {axis.code}
                  </span>
                </div>
                <h3 className="mt-1 font-serif text-xl text-zinc-50">{axis.titleZh}</h3>
              </div>
              <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2">
                <div>
                  <p className="ui-kicker mb-2">INPUTS</p>
                  <ul className="space-y-1.5 text-sm text-zinc-400">
                    {axis.inputs.map((line) => (
                      <li key={line}>· {line}</li>
                    ))}
                  </ul>
                  <p className="ui-kicker mb-2 mt-5">NORM / NOTES</p>
                  <ul className="space-y-1.5 text-sm text-zinc-400">
                    {axis.normNotes.map((line) => (
                      <li key={line}>· {line}</li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0">
                  <p className="ui-kicker mb-2">FORMULAS</p>
                  <div className="formula-box space-y-3">
                    {axis.formulas.map((f) => (
                      <p key={f} className="whitespace-pre-wrap break-words">
                        {f}
                      </p>
                    ))}
                  </div>
                  <p className="ui-kicker mb-2 mt-5">LITERATURE / SOURCE</p>
                  <ul className="space-y-1 text-sm text-zinc-400">
                    {axis.literature.map((l) => (
                      <li key={l}>· {l}</li>
                    ))}
                  </ul>
                  {axis.notClaimed && (
                    <ul className="mt-3 space-y-1 text-sm text-amber-200/80">
                      {axis.notClaimed.map((n) => (
                        <li key={n}>⚠ {n}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {axis.id === 'strength' && (
                <div className="border-t border-white/5 px-4 py-4 sm:px-6">
                  <p className="ui-kicker mb-3">五項動作 · 100 分錨點 DOTS</p>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="bg-base/80 font-mono text-[11px] text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">動作</th>
                          <th className="px-3 py-2 font-medium">錨點 DOTS</th>
                          <th className="px-3 py-2 font-medium">重量上限</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-300">
                        {strengthLiftAnchors.map((lift) => (
                          <tr key={lift.key} className="border-t border-white/5">
                            <td className="px-3 py-2.5">{lift.name}</td>
                            <td className="px-3 py-2.5 font-mono text-brand">
                              {lift.anchorDots}
                            </td>
                            <td className="px-3 py-2.5 font-mono">{lift.capKg} kg</td>
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

      {/* Specialty */}
      <section className="border-t border-white/5 bg-panel/40 ui-section">
        <div className="ui-container">
          <h2 className="font-serif text-2xl text-zinc-50">專項指標說明</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            以下為專項榮譽指標，用於名片／天梯細項，不稀釋六軸綜合戰力。
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {specialtyMetrics.map((m) => (
              <article key={m.id} className="ui-card p-5">
                <h3 className="font-semibold text-zinc-100">{m.titleZh}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{m.summary}</p>
                <ul className="mt-3 space-y-1 font-mono text-[11px] text-zinc-500">
                  {m.notes.map((n) => (
                    <li key={n}>· {n}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
