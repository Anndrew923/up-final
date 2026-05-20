# UP Final — P1 初步測試報告

## 範圍

- Firestore SDK 初始化（`VITE_FIREBASE_*`）+ 匿名登入（戰場寫入／雲端同步需 `request.auth.uid`）。
- `leaderboardService`：Pro 閘門後才查詢／寫入；**先比對既有最佳分**，再套用 **每小時 3 次**上傳節流。
- Join Arena（Magitek 視覺）+ **裝置端訂閱快照**（`purchaseProSubscription` / `restorePurchasesFromDevice`）。
- Community / Tools 高質感占位頁；Tools 含 **雲端備份／還原**（Pro + Firebase）。
- i18n：`en` 完整、`zh-Hant` 覆蓋 P1 新增區塊（其餘 fallback 至 `en`）。

## 自動化驗證（本機）

| 指令            | 結果                                                |
| --------------- | --------------------------------------------------- |
| `npm run build` | 通過                                                |
| `npm test`      | 21 通過（含 `listLeaderboard` non-Pro gate 新測試） |
| `npm run lint`  | 通過                                                |

## Non-Pro「零 leaderboard 流量」說明

### 程式層（可重現）

1. **`shouldBlockFirebase(ent, 'leaderboard-read'|'leaderboard-write')`**  
   在 `leaderboardService` 中，凡 `listLeaderboard` / `submitLeaderboardScore` 皆 **先檢查**；未通過則立即回傳 `pro-required`，**不建立** Firestore `Query` / `DocumentReference`。
2. **路由層**  
   `LadderPage` 使用 `useLeaderboardAccess()`；非 Pro 在 `replace` 導向 `join-arena` 前，不掛載依賴 `listLeaderboard` 的資料流（通過閘門後才拉榜）。
3. **單元測試**  
   `leaderboardService.test.ts`：`listLeaderboard` + `ownedFreeEntitlement()` 預期 `ok: false` / `reason: 'pro-required'`（無快取、無遠端分支）。

### 瀏覽器「網路監測」建議流程

1. 勿設定 `VITE_FIREBASE_*`，或於 **Application → Local Storage** 將權益設為 **Core owned + Free**（無 Pro）。
2. 開啟 **DevTools → Network**，篩選 `firestore`、`googleapis`。
3. 操作路徑：`/ladder` → 應被導向 **`/join-arena`**；列表為 **Community / Tools / Home** 等非戰場頁。預期 **無 Firestore HTTPS 請求**。
4. （選用）開啟 **`/debug/leaderboard`**，維持 Free，點 **List Leaderboard**：應無 Firestore 活動（回傳 `pro-required`）。

### 設定完整 Firebase 時（Pro 帳號）

- 預期可見對 `firestore.googleapis.com` 的讀寫（依操作：拉榜、上傳最佳分、雲端備份）。
- 部署前請在 Firebase Console 啟用 **匿名登入**，並部署本倉 `firestore.rules`。

## 手動／暫未自動化

- Firestore **複合索引**：目前僅 `orderBy('scoreBest', 'desc')`；若後續加入雙欄排序需補 `firestore.indexes.json` 並 deploy。
- 真實 **App Store / Play 訂閱驗證**：Web 殼層以 **localStorage 持久化**模擬；上架前需接 IAP / Receipt 後端。

## 相關檔案索引

| 區域            | 路徑                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Firebase 客戶端 | `src/services/firebaseClient.ts`                                                                                    |
| 戰場            | `src/services/leaderboardService.ts`, `src/services/leaderboardCacheService.ts`, `src/services/rateLimitService.ts` |
| 權益持久化      | `src/services/entitlementPersistenceService.ts`, `src/stores/entitlementStore.ts`                                   |
| 訂閱／還原      | `src/services/subscriptionService.ts`                                                                               |
| 雲端同步        | `src/services/localCloudAdapter.ts`, `src/services/cloudSyncService.ts`                                             |
| UI              | `src/pages/LadderPage.tsx`, `JoinArenaPage.tsx`, `CommunityPage.tsx`, `ToolsPage.tsx`                               |
| 規則範例        | `firestore.rules`                                                                                                   |
| 環境範例        | `.env.example`                                                                                                      |

---

_產出日：2026-04-19 · 工作區：`up-final`。_
