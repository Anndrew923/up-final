import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { storeLinks } from '../config/storeLinks';

export function PrivacyPage() {
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
          <p className="ui-kicker mt-6">LEGAL // PRIVACY & DISCLAIMER</p>
          <h1 className="mt-3 font-serif text-3xl text-zinc-50 sm:text-4xl">
            隱私權政策與健康免責聲明
          </h1>
          <p className="mt-3 font-mono text-xs text-zinc-500">
            最強肉體 Ultimate Physique · v{storeLinks.appVersion} · 最後更新：2026-11-22
          </p>
        </div>
      </section>

      <section className="ui-section">
        <div className="ui-container prose-invert max-w-3xl space-y-10 text-sm leading-relaxed text-zinc-300 sm:text-base">
          <Block title="1. 產品定位與健康免責">
            <p>
              最強肉體為健身自我追蹤工具，不提供醫療診斷、治療建議或緊急醫療指示。數據與評測僅供個人訓練紀錄與天梯交流，不作醫療診斷、處方或緊急醫療指示。
            </p>
            <p>
              高強度運動請評估自身狀況；若出現不適請立即停止並尋求專業醫療協助。運動風險由使用者自行承擔。
            </p>
          </Block>

          <Block title="2. Local-First 資料儲存原則">
            <p>
              詳細評測與歷史預設保存在您的裝置；Core
              本機功能（六軸評測、雷達、日誌、戰報導出、整備工具）無需訂閱即可完整使用。
            </p>
            <p>
              訂閱解鎖的是雲端同步、全球天梯與進階 AI 遙測（DYNO INTEL）等連線服務。
            </p>
          </Block>

          <Block title="3. 我們處理的資料類型">
            <ul className="list-disc space-y-2 pl-5 text-zinc-400">
              <li>
                <span className="text-zinc-200">身體基線（本機為主）：</span>
                性別、年齡、身高、體重；選填職業、訓練時數／年資、地區與天梯匿名偏好。
              </li>
              <li>
                <span className="text-zinc-200">評測輸入（本機；可進歷史）：</span>
                力量五項重量／次數、爆發垂直跳／立定跳遠、Cooper
                距離、骨骼肌量、握力峰值、臂圍與體脂、FFMI 相關輸入等。
              </li>
              <li>
                <span className="text-zinc-200">帳號與雲端：</span>
                Google／Apple 登入；天梯暱稱與頭像；訂閱／創世席等權益欄位。
              </li>
              <li>
                <span className="text-zinc-200">天梯公開摘要：</span>
                顯示名或匿名標記、最佳分數摘要、更新時間、供篩選的人口學投影欄；可選 Pro 標記。
              </li>
              <li>
                <span className="text-zinc-200">DYNO INTEL：</span>
                遙測上下文與問題經後端配額與安全閘控處理；本機保留有限則數日誌。
              </li>
            </ul>
          </Block>

          <Block title="4. Firebase 雲端帳號與天梯公開欄位">
            <p>
              使用 Firebase Authentication（Google／Apple）、Firestore（天梯
              shards、權益與俱樂部等摘要）、Storage（如天梯頭像）與 Cloud
              Functions（驗證、配額、訂閱 webhook、Dyno 等）。
            </p>
            <p>
              天梯分數為使用者自報並經系統校驗範圍與配額，不構成官方運動會或實驗室成績認證。非資格用戶不會產生天梯 Firestore 讀寫流量；寫入為摘要並受節流限制。
            </p>
          </Block>

          <Block title="5. 您的權利">
            <ul className="list-disc space-y-2 pl-5 text-zinc-400">
              <li>撤除全球天梯公開足跡（移除公開排行摘要）。</li>
              <li>刪除帳號與相關雲端資料（依產品內流程）。</li>
              <li>恢復購買（透過 App Store／Google Play）。</li>
              <li>App 內提供隱私／條款語系切換入口（zh-Hant／en）。</li>
            </ul>
          </Block>

          <Block title="6. 訂閱自動續訂揭露">
            <p>
              PRO 訂閱標價參考：月訂 <span className="font-mono text-brand">$1.99 USD</span>
              ；年訂 <span className="font-mono text-brand">$14.99 USD</span>
              。實際扣款以 App Store／Google Play 為準。
            </p>
            <p>
              訂閱可能自動續訂；費用通常在本期結束前於您的商店帳號扣款。您可隨時於商店訂閱管理頁取消，取消後本期結束前仍可使用已付費權益。創世早鳥席為終身免訂閱進入全球天梯之權益，不解鎖 Dyno／Cloud。
            </p>
          </Block>

          <Block title="7. 聯絡與政策更新">
            <p>
              我們可能更新本頁以反映產品或法規變化。重大變更將於官網或 App
              內揭示。繼續使用即表示您知悉更新後的條款。
            </p>
            <p className="font-mono text-xs text-zinc-500">
              Package：{storeLinks.packageId}
            </p>
          </Block>
        </div>
      </section>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-zinc-50 sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
