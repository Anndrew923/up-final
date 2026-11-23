import { useEffect } from 'react';

const SITE = '最強肉體 Ultimate Physique';

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${SITE} — 科學體能評測系統`,
    description:
      '別再憑感覺訓練。輸入身體基線與訓練表現，以 100 分為人類精英基準量尺生成專屬六軸雷達；破百即超頻突破。',
  },
  '/science': {
    title: `科學評測白皮書 — ${SITE}`,
    description:
      '六軸評測方法論：以 100 分為精英基準、破百為超頻。Brzycki、BVDK/Konertz DOTS、McCulloch、Kouri 調整 FFMI、Cooper 與握力異速正規化。',
  },
  '/privacy': {
    title: `隱私權政策與健康免責 — ${SITE}`,
    description:
      '本機優先與上傳邊界、Firebase／RevenueCat／Gemini 用途、帳號刪除與本機清除步驟、客服信箱與訂閱自動續訂揭露。',
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
