# Firebase Emulator 本地開發

## 是什麼？

**Firebase Emulator Suite** 在本機跑一套「縮小版 Firebase」：Auth、Firestore、Cloud Functions 等服務在固定 port 上模擬，**不寫入正式 GCP 專案**（或寫入本機匯出的資料），方便開發天梯 Callable、Rules 而不消耗正式額度、也不影響線上資料。

與「連線正式 `fitness-app-69f08`」的差異：

| | 正式專案 | Emulator |
|---|---------|----------|
| 資料 | 雲端 Firestore | 本機 `~/.cache/firebase/emulators` 或匯出目錄 |
| Functions | 已部署的 `ladderSubmitShard` 等 | 本機執行 `functions/` 原始碼 |
| Rules | 已部署的 `firestore.rules` | 啟動時載入 repo 內 `firestore.rules` |
| 費用 | 依用量計費 | 本機免費 |

## 本專案預設埠（`firebase.json`）

| 服務 | Port |
|------|------|
| Emulator UI | http://127.0.0.1:4000 |
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |

## 啟動步驟

1. 安裝依賴（首次）  
   `cd functions && npm install && cd ..`

2. 啟動模擬器  
   `npm run firebase:emulators`

3. 前端 `.env`（與正式 Firebase 設定並存，用旗標切換）  

   ```env
   VITE_FIREBASE_USE_EMULATORS=true
   VITE_LADDER_CALLABLE_WRITES=true
   # 仍需要 VITE_FIREBASE_* 四項（projectId 等會對應 Emulator）
   ```

4. 重啟 `npm run dev` — App 會連到 `127.0.0.1` 的 Auth / Firestore / Functions。

5. 在 Emulator UI（:4000）可檢視 Firestore 文件、觸發 Callable、查看 Functions 日誌。

## 注意事項

- **P2 天梯寫入**：Rules 禁止客戶端直寫榜單；本地也應設 `VITE_LADDER_CALLABLE_WRITES=true`，讓上傳走本機 `ladderSubmitShard`。
- Emulator **不會**自動同步 RevenueCat / 正式 `users` 文件；Pro 驗證在 `LEADERBOARD_PAYWALL_ENABLED` 未開時與線上一樣不擋。
- 若要測「已部署線上行為」，關閉 `VITE_FIREBASE_USE_EMULATORS`，並確認已執行過 `npm run firebase:deploy:ladder-p2`。
- 資料可匯出／匯入：`firebase emulators:export ./emulator-data`（團隊共用時勿提交敏感資料）。

## 與剛完成的 deploy 的關係

- **已部署到 `fitness-app-69f08`**：`ladderSubmitShard`、`ladderSyncBatch`、`ladderSyncPreview` + 新版 Firestore Rules。  
- 正式 App 需 `VITE_LADDER_CALLABLE_WRITES=true` 才能上傳天梯。  
- Emulator 為**可選**本機路徑，不取代 deploy。
