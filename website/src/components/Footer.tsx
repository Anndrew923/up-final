import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-panel">
      <div className="ui-container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-serif text-lg text-zinc-100">最強肉體</p>
            <p className="mt-1 font-mono text-xs tracking-wider text-zinc-400">
              ULTIMATE PHYSIQUE
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-300">
              本工具提供運動生理學數據量化與訓練紀錄，不構成醫療診斷或處方；全球天梯為自願上傳之系統校驗成績。
            </p>
          </div>
          <div>
            <p className="ui-kicker mb-3">LINKS</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="text-zinc-300">
                <Link to="/science" className="text-zinc-300 hover:text-zinc-100">
                  科學評測白皮書
                </Link>
              </li>
              <li className="text-zinc-300">
                <Link to="/privacy" className="text-zinc-300 hover:text-zinc-100">
                  隱私權政策與健康免責
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="ui-kicker mb-3">COMPLIANCE</p>
            <p className="text-sm leading-relaxed text-zinc-300">
              詳細評測與日誌預設存於本機。全球天梯為自報成績經系統校驗。
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[11px] text-zinc-400">
            © {year} 最強肉體 Ultimate Physique. All rights reserved.
          </span>
          <div className="locale-pill" aria-label="目前語系：繁體中文；英文版於 App 內">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-200">繁中</span>
            <span className="text-zinc-400">EN（App 內）</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
