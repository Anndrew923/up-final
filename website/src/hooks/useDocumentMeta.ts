import { useEffect } from 'react';

const SITE = '最強肉體 Ultimate Physique';

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${SITE} — 科學體能評測系統`,
    description:
      '別再憑感覺訓練。輸入身體基線與訓練表現，映射至統一 0–200 分科學量尺，生成專屬六軸雷達與戰力認證。',
  },
  '/science': {
    title: `科學評測白皮書 — ${SITE}`,
    description:
      '六軸 0–200 分尺方法論：Brzycki、IPF DOTS、McCulloch、Kouri 調整 FFMI、Cooper 距離常模與異速生長握力因子。',
  },
  '/privacy': {
    title: `隱私權政策與健康免責 — ${SITE}`,
    description:
      'Local-First 資料原則、天梯公開欄位、訂閱自動續訂揭露，以及非醫療免責聲明。',
  },
};

/** Sync document title + description on SPA navigations (crawlers still see index.html defaults). */
export function useDocumentMeta(pathname: string): void {
  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? ROUTE_META['/']!;
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);
  }, [pathname]);
}
