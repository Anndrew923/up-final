import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FaqAccordion } from '../components/FaqAccordion';
import { PricingCards } from '../components/PricingCards';

interface PricingPageProps {
  onDownload: () => void;
}

/**
 * Second-layer hub: CORE / GENESIS / PRO comparison + conversion FAQ accordion.
 * Moved off the slim home so pricing detail never competes with Hero → systems → athletes.
 */
export function PricingPage({ onDownload }: PricingPageProps) {
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
          <p className="ui-kicker-zh mt-6">權益方案 · FAQ</p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Pro 方案與常見問題
          </h1>
          <p className="ui-body mt-4 max-w-2xl">
            核心六軸評測永久免費；解鎖全球天梯與雲端同步時再升級創世早鳥席或
            PRO。下方整理新手入門、未測滿六項與雙平台支援等常見疑問。
          </p>

          <nav
            className="mt-6 flex flex-wrap gap-2"
            aria-label="方案與常見問題章節導覽"
          >
            <a
              href="#plans"
              className="rounded-lg border border-white/15 bg-steel/80 px-3 py-2 font-mono text-xs tracking-wide text-fg-secondary transition hover:border-energy/40 hover:text-energy sm:text-xs"
            >
              方案對照
            </a>
            <a
              href="#faq"
              className="rounded-lg border border-white/15 bg-steel/80 px-3 py-2 font-mono text-xs tracking-wide text-fg-secondary transition hover:border-energy/40 hover:text-energy sm:text-xs"
            >
              常見問題
            </a>
          </nav>
        </div>
      </section>

      <section
        className="relative overflow-x-hidden border-b border-amber-400/25 bg-gradient-to-b from-amber-500/[0.09] via-[#090B10] to-ink ui-section"
        id="plans"
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl"
          aria-hidden
        />
        <div className="ui-container relative">
          <div className="ui-section-head">
            <p className="ui-kicker-zh">權益方案</p>
            <h2 className="ui-h2 mt-2 sm:mt-3">
              核心六軸評測永久免費
            </h2>
            <p className="ui-body mt-3 sm:mt-4">
              零門檻開測；需要天梯、雲端與戰力引擎時再對照早鳥與 PRO 權益。
            </p>
          </div>

          <PricingCards onDownload={onDownload} />

          <div className="mt-10 flex flex-col items-center justify-center gap-2.5 sm:mt-12 sm:flex-row sm:gap-3">
            <Link to="/science" className="btn-secondary min-h-11 w-full sm:w-auto">
              科學評測與 14 階基準
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#faq" className="btn-secondary min-h-11 w-full sm:w-auto">
              查看常見問題 ↓
            </a>
          </div>
        </div>
      </section>

      <FaqAccordion />
    </div>
  );
}
