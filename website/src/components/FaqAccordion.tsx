import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Conversion FAQ — dependency-free accordion for /pricing.
 * Answers stay aligned with Privacy local-first + Science 100-score charter (no invented prices).
 */

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: '新手完全沒測過，入門門檻高嗎？需要先買器材嗎？',
    a: '不高。核心六軸評測永久免費、免註冊即可使用。可先從身高體重與場測軸（垂直跳、立定跳遠、庫珀跑、握力）開始；最大肌力軸有槓片再補測即可，不必一次備齊健身房設備。',
  },
  {
    q: '沒有去商業健身房，在家徒手訓練也能進行六軸評測嗎？',
    a: '可以先完成體組成與多項場測軸（如垂直跳、立定跳遠、庫珀跑、握力）。最大肌力軸建議以自由重量動作輸入以對齊常模；若暫無槓片，其餘軸仍可獨立評測並逐步補齊戰力圖。',
  },
  {
    q: '還沒測滿六項，綜合分數與雷達會怎麼算？',
    a: '已完成的軸會即時顯示分數與雷達輪廓；未測軸以空白／待測呈現，不會用假數據填補。綜合戰力會依已測軸彙整，補測後自動重算——建議逐步補齊六軸，圖形與段位才最具診斷意義。',
  },
  {
    q: '支援 iOS 與 Android 嗎？兩邊資料會同步嗎？',
    a: '支援 iPhone／iPad（App Store）與 Android（Google Play）。本機版資料預設留在裝置；跨裝置自動備份與還原屬 PRO（或創世早鳥席解鎖之雲端／天梯權益路徑）。同一帳號登入並開啟雲端後，才會在雙平台間同步。',
  },
  {
    q: '「創世早鳥席」真的是買斷制、未來不會再收月費嗎？',
    a: '是。創世早鳥席為限量 2,000 席的一次性解鎖，終身免訂閱並永久解鎖全球天梯讀取／上傳。額滿後永久絕版；與之後可選的月費 PRO 訂閱是不同權益路徑。',
  },
  {
    q: '未登入帳號時，我的身高體重與肌力數據會被上傳嗎？',
    a: '不會。核心評測採本機優先：未登入、未參與天梯、未開啟雲端同步時，身高體重與肌力等詳細紀錄僅留在裝置，不會產生雲端讀寫。',
  },
  {
    q: '評測分數超過 100 分是什麼概念？',
    a: '100 分是該生理性別與年齡常模下的頂尖精英基準線。突破 100 即進入「破百超頻」區間，系統以高階溢位曲線持續累計，單軸理論上限為 200 分——代表超越精英基準的超頻表現，而非錯誤分數。',
  },
];

export function FaqAccordion() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-t border-white/10 bg-ink ui-section"
      aria-labelledby="faq-heading"
    >
      <div className="ui-container">
        <div className="ui-section-head">
          <p className="ui-kicker-zh">常見問題</p>
          <h2
            id="faq-heading"
            className="ui-h2 mt-2 sm:mt-3"
          >
            評測前你可能想知道
          </h2>
        </div>

        {/* WHY: Accordion column narrower than stage; head stays on shared ui-section-head rhythm. */}
        <ul className="mx-auto max-w-3xl space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex min-h-11 w-full items-start justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.03] sm:px-4 sm:py-3.5"
                >
                  <span className="text-sm font-medium leading-snug text-fg sm:text-[15px]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-fg-muted transition-transform duration-300 ${
                      open ? 'rotate-180 text-energy' : ''
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="ui-body border-t border-white/5 px-3.5 pb-3.5 pt-2 text-sm sm:px-4 sm:pb-4">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
