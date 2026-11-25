import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AthletesShowcase } from '../components/AthletesShowcase';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { HeroStoreCta } from '../components/HeroStoreCta';
import { SystemsShowcase } from '../components/SystemsShowcase';

interface HomePageProps {
  onDownload: () => void;
}

/**
 * Slim conversion home: Hero → #systems → #athletes → compact download CTA.
 * Ladder / pricing / FAQ live on /science and /pricing — keep this page three-beat only.
 */
export function HomePage({ onDownload }: HomePageProps) {
  return (
    <div className="max-w-[100vw] overflow-x-hidden">
      {/*
        Ladder flagship hero: -mt under fixed chrome, 100svh stage, bottom-anchored
        copy via flex-1 spacer (not justify-end) so short phones never overlap the fixed nav.
      */}
      <section
        id="hero"
        className="relative flex min-h-[100svh] -mt-[var(--site-nav-offset)] flex-col overflow-x-hidden border-b border-white/5 bg-ink"
      >
        <HeroBackdrop />

        <div className="relative z-10 flex flex-1 flex-col items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-[var(--site-nav-offset)] text-center sm:px-6 sm:pb-10">
          <div className="min-h-8 w-full flex-1 sm:min-h-10" aria-hidden />
          <div className="mx-auto w-full max-w-2xl shrink-0">
            {/*
              WHY bare stage: Hero is backdrop + claim + store CTAs only —
              pills / free-tier footnotes dilute the first-viewport hit.
            */}
            <h1 className="ui-display">
              終結訓練內耗，
              <br />
              用數據定義真實戰力。
            </h1>

            <HeroStoreCta onDownload={onDownload} />
          </div>
        </div>
      </section>

      <section
        className="ui-section border-y border-violet-500/20 bg-night"
        id="systems"
      >
        <div className="ui-container">
          {/*
            WHY: Override ui-section-head mb on phone so title + 1×4 tabs + phone
            can share one viewport with the sticky download bar.
          */}
          <div className="ui-section-head mb-4 sm:mb-12">
            <p className="ui-kicker-zh">核心系統</p>
            <h2 className="ui-h2 mt-2 sm:mt-3">四大核心評測系統</h2>
          </div>
          <SystemsShowcase />
        </div>
      </section>

      {/*
        WHY: Skip `ui-section` (py-20) — mobile needs py-10 so title → card →
        dossier CTA clears one phone viewport under sticky download chrome.
        sm:py-28 matches the Ladder stage token without fighting @apply order.
      */}
      <section
        className="border-t border-white/10 bg-zinc-900/85 py-10 sm:py-28"
        id="athletes"
      >
        <div className="ui-container">
          <div className="ui-section-head mb-4 sm:mb-12">
            <p className="ui-kicker-zh">實測背書</p>
            <h2 className="ui-h2 mt-2 sm:mt-3">專項運動員實測</h2>
          </div>
          <AthletesShowcase />
        </div>
      </section>

      {/*
        WHY: Compact py (~½ of ui-section) so closing CTA hands off to Footer
        without a tall empty stage; pricing/science detail stay on subpages.
      */}
      <section
        className="relative overflow-x-hidden border-t border-amber-400/25 bg-gradient-to-b from-amber-500/[0.09] via-[#090B10] to-ink py-10 sm:py-14"
        id="download"
        aria-labelledby="home-cta-heading"
      >
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-[28rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl"
          aria-hidden
        />
        {/*
          WHY: Distinct CTA claim (not「永久免費」) + no gray lead — hand off
          straight to download / pricing buttons without repeating /pricing copy.
        */}
        <div className="ui-container relative text-center">
          <p className="ui-kicker-zh">開始行動</p>
          <h2 id="home-cta-heading" className="ui-h2 mt-2 sm:mt-3">
            現在就測出你的真實戰力
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={onDownload}
              className="btn-primary min-h-11 w-full sm:w-auto"
            >
              免費下載開測
            </button>
            <Link to="/pricing" className="btn-secondary min-h-11 w-full sm:w-auto">
              Pro 方案與常見問題
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/science" className="btn-secondary min-h-11 w-full sm:w-auto">
              科學評測與 14 階基準
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
