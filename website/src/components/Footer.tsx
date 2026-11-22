import { Link } from 'react-router-dom';
import { storeLinks } from '../config/storeLinks';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-panel">
      <div className="ui-container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-serif text-lg text-zinc-100">最強肉體</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              Ultimate Physique · v{storeLinks.appVersion}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
              科學化、可解釋、可重現的體能評測工具。本工具僅供個人訓練紀錄與交流，不構成醫療診斷或處方。
            </p>
          </div>
          <div>
            <p className="ui-kicker mb-3">LINKS</p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link to="/science" className="hover:text-brand">
                  科學評測白皮書
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand">
                  隱私權政策與健康免責
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="ui-kicker mb-3">COMPLIANCE</p>
            <p className="text-sm leading-relaxed text-zinc-500">
              Local-First：詳細評測與日誌預設存於本機。全球天梯為自報成績經系統校驗，非實驗室認證。
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 font-mono text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} 最強肉體 Ultimate Physique. All rights reserved.
          </span>
          <span>zh-Hant / EN legal surfaces in-app</span>
        </div>
      </div>
    </footer>
  );
}
