import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DocPageHeroAtmosphere } from '../components/DocPageHeroAtmosphere';
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
      <DocPageHeroAtmosphere tone="amber">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>
        <p className="ui-kicker-zh mt-6">權益方案 · FAQ</p>
        {/*
          WHY bare H1: drop gray lead + in-page TOC pills so GENESIS cards
          rise into the first phone viewport under the page chrome.
        */}
        <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Pro 方案與常見問題
        </h1>
      </DocPageHeroAtmosphere>

      <section
        className="relative overflow-x-hidden border-b border-amber-400/25 bg-gradient-to-b from-amber-500/[0.09] via-[#090B10] to-ink ui-section"
        id="plans"
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl"
          aria-hidden
        />
        <div className="ui-container relative">
          {/*
            WHY: No gray lead under the H2 — cards must rise into the first
            phone viewport so more GENESIS entitlement rows stay visible.
          */}
          <div className="ui-section-head">
            <p className="ui-kicker-zh">權益方案</p>
            <h2 className="ui-h2 mt-2 sm:mt-3">
              核心六軸評測永久免費
            </h2>
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
