# Firebase：排行榜（天梯）設定

Repo 內已具備 **`firestore.rules`**、**`firebase.json`**、**`firestore.indexes.json`**（索引檔目前為空：本專案讀榜為 `orderBy('scoreBest')`，一般由 Firestore 自動單欄索引處理；若 Console 仍提示缺索引，請用錯誤訊息內的連結建立）。

路徑契約：`leaderboards/{metric}/entries/{uid}`（`metric` 如 `strength`、`gripStrength` 等）。

### `leaderboard_previews/{uid}`（天梯列點擊預覽，單一文件）

客戶端寫入時 **`radarScores` 必須是巢狀 map**（子鍵與程式內六軸一致：`strength`、`explosivePower`、`cardio`、`muscleMass`、`bodyFat`、`gripStrength`），值為數字（與首頁雷達相同 clamp，可為 `0`）。

在 **Firebase Console → Firestore → `leaderboard_previews` → 點選一筆文件** 時，預期應類似：

| 欄位                                    | 預期                                      |
| --------------------------------------- | ----------------------------------------- |
| `displayName`                           | string（規則必填）                        |
| `updatedAt`                             | string（規則必填）                        |
| `radarScores`                           | **map**；展開後為上列六個子欄位（number） |
| `schemaVersion`                         | number（選填，新客戶端為 `1`）            |
| `gender`、`ageBucket`、`jobCategory` 等 | 選填摘要欄位                              |

**請勿**在文件**根層級**出現「整段字當欄位名」的鍵（例如字面意義的 `radarScores.strength`）。`setDoc` + `merge` 若用扁平物件鍵名帶點號，Firestore 會當成根上的單一欄位，App 讀取 `data.radarScores` 會是空的，天梯預覽雷達會變成 **0/6**。若曾誤寫，可在 Console 手動刪除這類錯誤欄位後，再用新客戶端上傳一次即可。

**`firestore.rules`（本 repo）**：已與既有 **fitness-app 風格**規則合併，並加上 UP Final 專用路徑 **`leaderboards/{metric}/entries/{uid}`**，以及在 **`users/{userId}`** 下巢狀的 **`artifacts/{artifactId}`**（對應 `users/{uid}/artifacts/up_cloud_sync_v1` 雲端備份）。部署前請在 Firebase Console 用「規則 playground」或 CLI 再驗一次，避免與你線上已手動改過的規則衝突。

---

## 你必須在 Firebase Console 手動完成的部分

### 1. 建立或選定專案

1. 開啟 [Firebase Console](https://console.firebase.google.com/)。
2. 建立新專案或選既有專案（與其他 App 共用同一 project 亦可）。

### 2. 啟用 Authentication

1. **Build → Authentication → Get started**。
2. 啟用 **Google**（與本 App 目前登入方式一致）。
3. 設定 **Authorized domains**（本機開發加上 `localhost`；正式網域一併加入）。

本專案寫入榜單時會拒絕 **匿名帳號**；讀取規則為「已登入即可」，建議測試時用 **Google 登入**。

### 3. 啟用 Firestore

1. **Build → Firestore Database → Create database**。
2. 模式可選 **Production**（搭配下方規則部署）；區域選與主要使用者接近者。

### 4. 取得 Web App 設定 → 填入本機 `.env`

1. **Project settings（齒輪）→ Your apps → Web** 註冊應用程式。
2. 將 `firebaseConfig` 對應到專案根目錄 **`.env`**（勿提交 git；參考 `.env.example`）：

| Firebase SDK 欄位 | 本專案 env                  |
| ----------------- | --------------------------- |
| `apiKey`          | `VITE_FIREBASE_API_KEY`     |
| `authDomain`      | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId`       | `VITE_FIREBASE_PROJECT_ID`  |
| `appId`           | `VITE_FIREBASE_APP_ID`      |

**四個都要填**，存檔後 **重啟 `npm run dev`**（Vite 只會在啟動時讀 env）。

### 5. 部署 Security Rules（必須與 repo 一致或包含同等條款）

本倉庫規則檔為根目錄 **`firestore.rules`**（`leaderboards/.../entries` 讀寫條件已定義）。

**擇一即可：**

- **A. Firebase CLI（建議）**
  1. 安裝 CLI：`npm install -g firebase-tools`（或每次 `npx firebase-tools ...`）。
  2. `firebase login`
  3. 在專案根目錄：`firebase use <你的_projectId>`（若尚無 `.firebaserc` 會建立）。
  4. 部署：`firebase deploy --only firestore:rules`  
     （或 `firebase deploy --only firestore` 一併部署規則與 `firestore.indexes.json`。）

- **B. 只用手動貼上**
  1. Console → **Firestore → Rules**。
  2. 將本 repo **`firestore.rules` 全文** 合併進現有規則（若專案內已有其他 `match`，勿覆蓋刪除，應合併邏輯）。
  3. **Publish**。

### 6. 索引（多數情況不必手動）

若瀏覽器或 DevTools 出現 Firestore **`FAILED_PRECONDITION`** 並附 **建立索引的 URL**，直接點連結在 Console 建立即可。

本 repo 的 **`firestore.indexes.json`** 目前為空陣列；若未來查詢加上 `where` + `orderBy` 等組合，再把索引寫入此檔並執行 `firebase deploy --only firestore:indexes`。

---

## 本 repo 已替你準備好的部分（無需再改）

| 項目                                 | 說明                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| `firebase.json`                      | 指向 `firestore.rules` 與 `firestore.indexes.json`               |
| `firestore.rules`                    | `leaderboards/{metric}/entries/{uid}` 讀寫條件                   |
| `firestore.indexes.json`             | 佔位；可透過 CLI 部署                                            |
| `src/services/firestorePaths.ts`     | 路徑常數                                                         |
| `src/main.tsx`                       | 啟動時呼叫 `tryInitFirebaseFromEnv()`                            |
| `src/services/leaderboardService.ts` | DEV 下 Firestore 錯誤會 `console.warn`，便於對照規則／索引／權限 |

---

## 驗收建議

1. `.env` 四個變數齊全 → 重啟 dev server。
2. Google 登入後開 **天梯 `/ladder`**。
3. 若仍失敗：開 **DevTools → Console**，查看 `[leaderboard] listLeaderboard Firestore error` 的完整錯誤（權限 / 索引 / 網路）。
4. （選用）使用專案內 **Leaderboard Debug** 路由做 list / submit 煙霧測試（若路由已啟用）。

---

## `npm` 指令（可選）

若已全域安裝 `firebase-tools`，可在專案根目錄執行：

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore
```

未安裝時可用：

```bash
npx firebase-tools deploy --only firestore:rules
```

首次使用請先 `firebase login` 與 `firebase use <projectId>`。
