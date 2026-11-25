import { Link } from 'react-router-dom';

interface FooterLink {
  to: string;
  label: string;
  /** Quiet legal entry — same path as drawer footer, not a conversion card. */
  muted?: boolean;
}

const FOOTER_LINKS: readonly FooterLink[] = [
  { to: '/science', label: '科學評測與 14 階基準' },
  { to: '/pricing', label: 'Pro 方案與常見問題' },
  { to: '/privacy', label: '隱私權政策與健康免責', muted: true },
];

/**
 * Compact site footer — brand, one legal sentence, three links, copyright.
 * WHY: Drop duplicate compliance column + locale pill; sticky CTA clearance
 * stays on App `.site-sticky-cta-clearance` so footer pb stays lean.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-panel">
      <div className="ui-container space-y-4 py-8 sm:py-10">
        <div>
          <p className="text-base font-semibold text-fg sm:text-lg">最強肉體</p>
          <p className="ui-label mt-0.5 font-mono tracking-wider">
            ULTIMATE PHYSIQUE
          </p>
          <p className="ui-body mt-2 max-w-2xl text-xs sm:text-sm">
            本工具提供運動生理學數據量化與訓練紀錄，不構成醫療診斷或處方；全球天梯為自願上傳之系統校驗成績。
          </p>
        </div>

        <nav aria-label="頁尾連結">
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm sm:gap-x-5">
            {FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={
                    item.muted
                      ? 'text-fg-muted transition hover:text-fg-secondary'
                      : 'text-energy transition hover:text-fg'
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="ui-label font-mono tabular-nums">
          © {year} 最強肉體 Ultimate Physique.
        </p>
      </div>
    </footer>
  );
}
