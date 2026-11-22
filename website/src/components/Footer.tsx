import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-panel">
      {/*
        WHY compact pb (not pb-24): sticky CTA clearance is owned by App
        `.site-sticky-cta-clearance` when the bar is visible — avoid double pad.
      */}
      <div className="ui-container space-y-5 pt-8 pb-6 md:pb-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-serif text-lg text-zinc-100">最強肉體</p>
            <p className="mt-1 font-mono text-xs tracking-wider text-zinc-400">
              ULTIMATE PHYSIQUE
            </p>
            <p className="mt-2 max-w-sm text-sm leading-snug text-zinc-300">
              本工具提供運動生理學數據量化與訓練紀錄，不構成醫療診斷或處方；全球天梯為自願上傳之系統校驗成績。
            </p>
          </div>
          <div>
            <p className="ui-kicker-zh mb-2">連結</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-300">
              <li>
                <Link to="/science" className="text-zinc-300 hover:text-zinc-100">
                  科學評測白皮書
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-zinc-300 hover:text-zinc-100">
                  隱私權政策與健康免責
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="ui-kicker-zh mb-2">合規說明</p>
            <p className="text-sm leading-snug text-zinc-300">
              詳細評測與日誌預設存於本機。全球天梯為自報成績經系統校驗。
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="font-mono text-[11px] leading-snug text-zinc-400">
            © {year} 最強肉體 Ultimate Physique. All rights reserved.
          </span>
          <div
            className="locale-pill"
            aria-label="目前語系：繁體中文；英文版於 App 內"
          >
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-200">
              繁中
            </span>
            <span className="text-zinc-400">EN（App 內）</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
