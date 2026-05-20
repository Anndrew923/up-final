# P0 封版測試報告 (Definition of Done)

**專案:** up-final  
**日期:** 2026-04-19  
**範圍:** 天梯閘門、本地歷史、Widget 快照、非 Pro 零遠端流量驗證

---

## 1. 執行摘要

| 需求                                   | 狀態 | 說明                                                                                          |
| -------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| `/ladder` 正式頁 + 權限閘門            | 通過 | 非 `canEnter` 即 `replace` 導向 `join-arena`；頁面不 import 任何 leaderboard / Firestore 服務 |
| `/history` 讀 localStorage             | 通過 | 使用既有 `loadHistory` + `useHistoryStore`；純裝置端                                          |
| Assessment 儲存快照                    | 通過 | 「Save snapshot to history」寫入 `LocalHistoryRecord`（日期、六維/全分 map、總分）            |
| `scoreStore` → `widgetSnapshotService` | 通過 | 每次分數變更、reset、recompute 及啟動時同步寫入 `up.widget.snapshot`                          |
| Community / Tools                      | N/A  | 維持 Placeholder（P1/P2）                                                                     |

---

## 2. 天梯閘門（Ladder Gate）

### 實作

- **檔案:** `src/pages/LadderPage.tsx`
- **邏輯:** `useLeaderboardAccess().canEnter === false` → `navigate(ROUTES.joinArena, { replace: true })`
- ** entitlement 來源:** `logic/core/entitlement.ts` → `canAccessLeaderboard`（需 Core owned + Pro）

### 流量與依賴檢查（靜態）

- `LadderPage` **未**引用 `leaderboardService`、`firebaseClient`、`initFirebase`
- eligible 使用者僅見靜態複本說明，**不觸發**列表 API / 模擬 DB（避免誤開熱路）

---

## 3. 本地歷史（Core）

### 實作

- **列表:** `src/pages/HistoryPage.tsx` — `loadLocalHistory()` on mount
- **儲存鍵:** `localStorageService` → `up.history`
- **寫入:** `AssessmentPage` 按鈕呼叫 `useHistoryStore.addHistoryRecord` → `appendHistory`
- **權益:** 無訂閱檢查 — 符合「個人詳細歷史不鎖 Pro」之產品規則

---

## 4. Widget 技術準備

### 實作

- **檔案:** `src/stores/scoreStore.ts`
- **行為:** `persistWidgetSnapshot(scores, overall)` 於 `setScore`、`setScores`、`resetScores`、`recomputeOverall` 及 **store 模組初始化**（對齊已載入之 `loadScores()`）
- **儲存鍵:** `widgetSnapshotService` → `up.widget.snapshot`（僅 localStorage）

---

## 5. 非 Pro / Guest — Zero Firebase Traffic（複測）

### 5.1 程式面依據

- **入口:** `main.tsx` **未**呼叫 `initFirebase`；`firebaseClient` 僅持有占位，無 SDK 網路層
- **排行榜:** `leaderboardService` 於 `shouldBlockFirebase === true` 時 **提早 return**，不觸達記憶體 mock 以外的邏輯（本專尚無真實 Firestore SDK 連線）
- **P0 新增頁:** `LadderPage`、`HistoryPage`、`AssessmentPage` **無** Firebase / Firestore import

### 5.2 建議手動烟測（瀏覽器）

1. DevTools → Network：篩選 **Firebase / googleapis / firestore** → 應為 **0** 請求
2. Application → Local Storage：確認僅 `up.*` 鍵寫入
3. 身分：`Set Free`（Home）→ 開啟 `/ladder` → 應立即到 Join Arena，無額外請求
4. Assessment → Save snapshot → History 頁面出現一筆

---

## 6. DoD 結論

完成 **§1 表格** 前三項工程交付與 **§5** 防線複核後，**Phase 0（本迭代範圍）視為達成 DoD**。未包含之 Tab（Community、Tools）依規格留待 P1/P2。

---

## 7. 後續建議（非 P0）

- 真實 Firestore 上線前：為 `initFirebase` 加環境閘門與 E2E 監聽
- `LadderPage` Phase 1：在安全 `canEnter` 下再接 `leaderboardService.listLeaderboard`（仍須先過 entitlement）
