import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

/** Official support inbox — SSOT aligned with app `contact.supportEmail`. */
const SUPPORT_EMAIL = 'topaj01@gmail.com';

/** Policy revision date (YYYY-MM-DD) — keep in sync with store listing disclosures. */
const EFFECTIVE_DATE = '2026-11-23';

const MAIL_LINK_CLASS =
  'font-mono text-energy underline-offset-2 hover:underline';

const PRIVACY_TOC = [
  { id: 'privacy-health', label: '健康免責' },
  { id: 'privacy-local', label: '本機優先' },
  { id: 'privacy-data', label: '資料類型' },
  { id: 'privacy-sdk', label: '第三方服務' },
  { id: 'privacy-rights', label: '刪除權利' },
  { id: 'privacy-billing', label: '訂閱揭露' },
  { id: 'privacy-contact', label: '聯絡方式' },
] as const;

export function PrivacyPage() {
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
          <p className="ui-kicker-zh mt-6">法務合規 · 隱私與免責</p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            隱私權政策與健康免責聲明
          </h1>
          <p className="ui-body mt-4 max-w-2xl">
            最強肉體 Ultimate Physique
            採本機優先架構。本頁說明資料邊界、第三方服務、帳號刪除權利與聯絡方式，以符合
            App Store 與 Google Play 審核要求。
          </p>
          <p className="ui-label mt-3 font-mono tabular-nums">
            生效／最後修訂：{EFFECTIVE_DATE}
          </p>

          <nav
            className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            aria-label="隱私政策章節導覽"
          >
            {PRIVACY_TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-lg border border-white/15 bg-steel/80 px-3 py-2 text-center font-mono text-xs tracking-wide text-fg-secondary transition hover:border-energy/40 hover:text-energy sm:text-left sm:text-xs"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="ui-section">
        <div className="ui-container max-w-3xl space-y-6">
          <PolicyCard
            id="privacy-health"
            kicker="健康與產品邊界"
            title="產品定位與健康免責"
          >
            <p>
              最強肉體為健身自我追蹤與體能量化工具，不提供醫療診斷、治療建議或緊急醫療指示。評測結果僅供個人訓練紀錄與天梯交流，不作醫療診斷、處方或臨床用途。
            </p>
            <p>
              高強度運動請先評估自身狀況；若出現不適請立即停止並尋求專業醫療協助。運動風險由使用者自行承擔。
            </p>
          </PolicyCard>

          <PolicyCard
            id="privacy-local"
            kicker="資料架構"
            title="Local-First 資料儲存與上傳邊界"
          >
            <p>
              核心評測採
              <Em>本機優先（Local-First）</Em>
              ：六軸評測、雷達、個人歷史、戰報導出與整備工具等詳細紀錄，預設僅保存在您的裝置，無需訂閱即可完整使用。
            </p>
            <p>
              <Em>僅在您主動登入</Em>
              ，並選擇參與全球／俱樂部天梯或啟用雲端同步時，才會上傳暱稱（或匿名標記）、可選頭像、俱樂部標籤，以及經校驗的六軸評測摘要等必要欄位。未登入、未參與天梯、未開啟同步時，不會產生上述雲端讀寫。
            </p>
            <p>
              訂閱（PRO）或創世早鳥席解鎖的是連線能力（雲端同步、天梯互動、進階
              AI 遙測等），不會改變「詳細個人日誌預設留在本機」的原則。
            </p>
          </PolicyCard>

          <PolicyCard
            id="privacy-data"
            kicker="資料清單"
            title="我們處理的資料類型"
          >
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-fg">身體基線（本機為主）：</span>
                生理性別、年齡、身高、體重；選填職業、訓練時數／年資、地區與天梯匿名偏好。
              </li>
              <li>
                <span className="text-fg">評測輸入（本機；可進歷史）：</span>
                力量五項重量／次數、爆發垂直跳／立定跳遠、Cooper
                距離、骨骼肌量、握力峰值、臂圍與體脂、FFMI 相關輸入等。
              </li>
              <li>
                <span className="text-fg">帳號與雲端（需您主動啟用）：</span>
                Google／Apple 登入識別；天梯暱稱與頭像；訂閱／創世席等權益狀態。
              </li>
              <li>
                <span className="text-fg">天梯公開摘要：</span>
                顯示名或匿名標記、最佳分數摘要、更新時間、供篩選的人口學投影欄；可選
                Pro 標記。分數為自報並經系統範圍與配額校驗，不構成官方賽事或實驗室認證。
              </li>
            </ul>
          </PolicyCard>

          <PolicyCard
            id="privacy-sdk"
            kicker="供應商揭露"
            title="第三方 SDK 與 AI 服務"
          >
            <p>
              為提供登入、購買驗證與戰力引擎分析，產品會在您啟用對應功能時使用下列服務：
            </p>
            <ul className="list-disc space-y-2.5 pl-5">
              <li>
                <span className="text-fg">Firebase（Google）：</span>
                身分驗證、雲端資料庫與雲端函式，用於帳號登入、天梯／俱樂部摘要、權益狀態與必要的後端閘控。僅在您登入並使用連線功能時處理相關資料。
              </li>
              <li>
                <span className="text-fg">RevenueCat：</span>
                訂閱與創世早鳥席等應用內購買的憑證驗證與權益狀態同步。付款由
                App Store／Google Play 處理；我們與 RevenueCat
                <Em>不經手信用卡號</Em>。
              </li>
              <li>
                <span className="text-fg">Google Gemini API：</span>
                用於 DYNO INTEL 戰力引擎之 AI
                分析。請求僅傳送去識別化的體能／評測上下文與問題內容，經後端配額與安全閘控處理；
                <Em>不傳送真實姓名或其他非必要個資</Em>
                。本機可保留有限則數分析日誌。
              </li>
            </ul>
          </PolicyCard>

          <PolicyCard
            id="privacy-rights"
            kicker="使用者權利"
            title="帳號與資料刪除"
          >
            <p>
              您可隨時行使下列權利（符合 App Store／Google Play 帳號刪除要求）：
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-fg">刪除帳號與雲端資料：</span>
                於 App 內帳號／設定相關流程執行「刪除帳號」，將移除帳號綁定之雲端同步資料與天梯公開摘要（實際選單名稱以產品版本為準）。
              </li>
              <li>
                <span className="text-fg">清除本機紀錄：</span>
                可於 App 內清除本機評測／歷史資料，或卸載 App
                並清除應用資料（依作業系統行為而定）。本機清除不會自動刪除已上傳之雲端帳號資料，兩者需分別處理。
              </li>
              <li>
                <span className="text-fg">撤除天梯公開足跡：</span>
                可請求移除全球天梯公開排行摘要。
              </li>
              <li>
                <span className="text-fg">恢復購買：</span>
                透過 App Store／Google Play 的恢復購買流程。
              </li>
            </ul>
            <p>
              若無法在 App 內完成刪除，請以註冊或登入所用信箱來信{' '}
              <SupportMail subject="帳號與資料刪除請求" />
              ，我們將人工協助處理帳號與雲端資料刪除請求。
            </p>
          </PolicyCard>

          <PolicyCard
            id="privacy-billing"
            kicker="商店訂閱"
            title="訂閱自動續訂揭露"
          >
            <p>
              PRO 訂閱標價參考：月訂{' '}
              <span className="font-mono text-fg">$1.99 USD</span>
              ；年訂 <span className="font-mono text-fg">$14.99 USD</span>
              。實際扣款以 App Store／Google Play 顯示為準。
            </p>
            <p>
              訂閱可能自動續訂；費用通常在本期結束前於您的商店帳號扣款。您可隨時於商店訂閱管理頁取消；取消後本期結束前仍可使用已付費權益。創世早鳥席為終身免訂閱進入全球天梯之權益，不解鎖
              AI 深度分析與雲端備份。
            </p>
          </PolicyCard>

          <PolicyCard
            id="privacy-contact"
            kicker="聯絡與修訂"
            title="聯絡方式與政策更新"
          >
            <p>
              開發者／客服聯絡信箱： <SupportMail />
            </p>
            <p>
              本政策生效與最後修訂日期為{' '}
              <span className="font-mono text-fg">{EFFECTIVE_DATE}</span>
              。我們可能更新本頁以反映產品或法規變化；重大變更將於官網或 App
              內揭示。繼續使用即表示您知悉更新後的條款。
            </p>
          </PolicyCard>
        </div>
      </section>
    </div>
  );
}

function Em({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-fg">{children}</strong>;
}

function SupportMail({ subject }: { subject?: string }) {
  const href = subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;

  return (
    <a href={href} className={MAIL_LINK_CLASS}>
      {SUPPORT_EMAIL}
    </a>
  );
}

function PolicyCard({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className="ui-card min-w-0 p-4 sm:p-8">
      <div className="flex min-w-0 items-start gap-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-energy" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="ui-kicker-zh mb-2">{kicker}</p>
          <h2 className="text-xl text-fg sm:text-2xl">{title}</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-fg-secondary">
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}
