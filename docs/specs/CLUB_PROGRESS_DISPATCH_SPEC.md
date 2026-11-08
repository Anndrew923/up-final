# 最強肉體（Ultimate Physique）— 俱樂部進步戰報廣播（Club Progress Dispatch）

- **產品**：最強肉體（Ultimate Physique）
- **工作區**：`up-final`
- **版本時間戳**：2026-11-08（Asia/Taipei）
- **狀態**：Phase 1 規格鎖定（尚未實作）
- **SSOT 層**：本文件為本功能唯一規格來源；實作須對齊現況 `guild*` 路徑與 Callable 模式
- **相關現況**：`docs/specs/UP_NON_ASSESSMENT_FEATURE_CODEX.md` §1.6（俱樂部）、`PerformanceBreakthroughModal`、`syncGuildLadderScore`

---

## 0. 產品精神

健身進步極難。任何真實正成長（即便 +0.2 分或多推 1 下）皆具備榮譽與社交價值。

機制採：

1. **發布者主動 opt-in**（結算彈窗勾選後才廣播）
2. **接收者可關閉**（`muteClubDispatches`）
3. **僅正成長**（`delta > 0`）才發推播

---

## 1. 核心決策（SSOT — 不可偏離）

| # | 決策 | 規則 |
|---|---|---|
| D1 | **無匿名** | 俱樂部內部不套用 `isAnonymousInLadder`。戰報一律具名顯示 `senderDisplayName`（成員暱稱）。全球天梯匿名與本功能無關。 |
| D2 | **嚴格正成長門禁** | Callable 校驗 `delta > 0`。下修或等分校正 → **靜默略過**（不寫有效推播、不發 FCM）。可選寫 skip 日誌；**不**對 client 彈錯誤。 |
| D3a | **觸發鉤點** | `PerformanceBreakthroughModal` 結算／同步彈窗；**不**掛 `HomeResonanceOverlay`。 |
| D3b | **後端觸發** | Callable 內直接 FCM Multicast。**禁止** Firestore `onCreate` / `onWrite` trigger。 |
| D3c | **偏好** | `users/{uid}.muteClubDispatches: boolean`，**預設 `false`（接收 ON）**。 |
| D3d | **會籍** | 維持單會籍（1 user = 1 guild）。廣播目標 = 發布者當前 `guildId`，無下拉選 club。 |

---

## 2. 範圍

### Phase 1（本規格鎖定）

- Push token 註冊與儲存
- `muteClubDispatches` 開關 UI
- Breakthrough 勾選 + 留言（≤25）+ 3 快捷 Tag
- Callable 正成長校驗 + FCM Multicast
- Deep Link：`/crew?focusUid={uid}` 開成員規格卡
- 可選：寫入 `guilds/{guildId}/dispatches/{dispatchId}` 供日後戰報牆（Phase 1 可不做讀取 UI）

### 明確不做（Phase 2+）

- 戰報時間線／Feed UI
- Firestore trigger 非同步 worker
- 多會籍選擇
- Web Push
- 每軸獨立 mute
- 全球天梯 sync 副作用自動廣播

---

## 3. UX Flow

### 3.1 發布端（Breakthrough）

前置：`membershipSurface === 'dual'`（已入會）且使用者選擇 **同步俱樂部** intent。

在 `PerformanceBreakthroughModal` 同步俱樂部 CTA 區域顯示輕量區塊：

1. Switch／Checkbox：`廣播戰報至俱樂部`（Phase 1 預設勾選；首次可附簡短說明）
2. 單行輸入：placeholder「說一句垃圾話或心得…（限 25 字）」
3. 三個一鍵 Tag（點擊覆寫或填入輸入框）：
   - `#剛性超限`
   - `#誰敢來戰`
   - `#今天差點升天`
4. 使用者按下「同步俱樂部／發布」：
   - 既有：`onPersistToDashboard` → `syncPageGuild`（或等價分數同步）
   - 若廣播勾選：呼叫 `dispatchClubProgress`（或擴充後的 guild sync payload）
5. 廣播失敗／被略過（`delta <= 0`）**不得**阻擋分數同步成功態

### 3.2 接收端偏好

位置：俱樂部設定區或設定／通知頁（實作時擇一，須 i18n）。

- Label：`接收隊友戰情報告` / `Team Telemetry Alerts`
- Switch：ON = `muteClubDispatches === false`；OFF = `true`
- 預設 ON

### 3.3 推播點擊

Deep Link → App 開 `/crew?focusUid={senderUid}` → `CrewPage` 自動開啟該成員 `CrewMemberRadarSheet`（若成員已離隊則僅進 `/crew`）。

---

## 4. 資料模型

### 4.1 廣播事件（可選持久化）

路徑：`guilds/{guildId}/dispatches/{dispatchId}`

> 命名鎖定 `guilds`（非 `clubs`），與現有 Firestore／Callable 一致。

```ts
interface ClubDispatch {
  id: string;
  guildId: string;
  senderUid: string;
  senderDisplayName: string; // 具名；禁止匿名遮罩
  metricType:
    | 'overall'
    | 'strength'
    | 'explosive'
    | 'cardio'
    | 'muscle'
    | 'bodyFat'
    | 'grip';
  previousScore: number;
  newScore: number;
  delta: number; // 必須 > 0 才允許建立「已發送」紀錄
  comment: string; // 已 sanitize，長度 0..25
  createdAt: string; // ISO，對齊 guild 其他欄位慣例；或 Firestore Timestamp（實作鎖定一種）
  /** Phase 1 可選 */
  fcmSentCount?: number;
  skippedReason?: 'non-positive-delta' | 'no-recipients' | 'muted-all';
}
```

**Security Rules：** client deny-all；僅 Admin SDK（Callable）讀寫。

### 4.2 使用者偏好與 Push Token

`users/{uid}`（Admin SDK 或受控 client patch — 實作時偏好建議 Callable／受規則保護的自有欄位寫入）：

```ts
interface UserClubDispatchFields {
  /** false = 接收戰報（預設）；true = 靜音 */
  muteClubDispatches?: boolean;
  /**
   * Phase 1 簡化：單裝置 token。
   * Phase 2 可升為 users/{uid}/devices/{deviceId}
   */
  fcmToken?: string | null;
  fcmTokenUpdatedAt?: string | null;
  fcmPlatform?: 'ios' | 'android' | 'web' | null;
}
```

缺省：`muteClubDispatches` 未設定視為 `false`（接收 ON）。

### 4.3 與既有 Guild 的關係

- 收件名單：`guilds/{guildId}.memberUids`
- 舊分來源：同文件 `members[]` 中對應 uid 的 `ladderScore` 或 `radarScores[metric]`
- 單會籍：`users.guildId`

---

## 5. Callable 契約

### 5.1 名稱

**首選（解耦）：** `dispatchClubProgress`  
**允許（Phase 1 折衷）：** 擴充 `syncGuildLadderScore` 增加 `broadcast?: boolean` + `comment?: string`；但仍須遵守本節校驗與 FCM 規則。

### 5.2 Request

```ts
interface DispatchClubProgressRequest {
  metricType:
    | 'overall'
    | 'strength'
    | 'explosive'
    | 'cardio'
    | 'muscle'
    | 'bodyFat'
    | 'grip';
  newScore: number; // finite, >= 0
  comment?: string; // 原始輸入；server 再 sanitize
  /** 可選：client 提示；server 仍必須重算 delta */
  previousScoreHint?: number;
}
```

### 5.3 Comment Sanitize（server 強制）

1. `typeof comment !== 'string'` → `''`
2. `trim()`；合併連續空白為單空白
3. 移除控制字元與 `<>`（對齊 guild name 防護精神）
4. 長度 > 25 → **截斷至 25**（或 `invalid-comment` 拒收；Phase 1 建議截斷以免打斷流程）
5. 空字串合法

### 5.4 Server 演算法（順序鎖定）

1. `requireSignedInUid`
2. 讀 `users/{uid}` → 取得 `guildId`；無會籍 → `{ ok: true, skipped: true, reason: 'no-guild' }`
3. 讀 `guilds/{guildId}`；驗證 `uid ∈ memberUids` 且非 disbanded
4. 解析 `previousScore`：
   - `metricType === 'overall'` → `members[i].ladderScore`
   - 否則 → `members[i].radarScores?.[metricType]`；缺省視為 `0`
5. `delta = newScore - previousScore`
6. **若 `!(delta > 0)`** → `{ ok: true, skipped: true, reason: 'non-positive-delta' }`（**不發 FCM**）
7. `senderDisplayName` = guild member snapshot `displayName`（具名；D1）
8. （可選）寫入 `dispatches/{id}`
9. 組收件人：`memberUids` 排除 `senderUid`；批次讀各 user：
   - 跳過 `muteClubDispatches === true`
   - 跳過無有效 `fcmToken`
10. `sendEachForMulticast`（或分批 ≤500）
11. Response：

```ts
interface DispatchClubProgressResponse {
  ok: boolean;
  skipped?: boolean;
  reason?:
    | 'no-guild'
    | 'not-member'
    | 'invalid-guild'
    | 'invalid-input'
    | 'non-positive-delta'
    | 'no-recipients';
  guildId?: string | null;
  dispatchId?: string | null;
  delta?: number;
  fcmSuccessCount?: number;
  fcmFailureCount?: number;
}
```

### 5.5 Throttle（Phase 1 建議）

- 每 uid 每小時最多 **5** 次成功廣播（獨立 collection 或 user 欄位 rolling window）
- 達限：`{ ok: true, skipped: true, reason: 'rate-limited' }`（不阻擋分數同步）

### 5.6 與分數同步的關係

- **分數同步成功 ≠ 自動廣播**
- 僅 Breakthrough 勾選後才呼叫 dispatch
- 全球 ladder `submitShardCore` 的 guild fan-out **禁止**觸發戰報

---

## 6. 推播文案模板

### 6.1 Payload

| 欄位 | 值 |
|---|---|
| title (zh-Hant) | `【戰隊快報 // {clubName}】` |
| title (en) | `[Squad Dispatch // {clubName}]` |
| body (zh-Hant) | `{userName} 戰鬥力推進至 {newScore}（+{delta}）！「{userComment}」今天要去改造一下自己嗎？` |
| body (en) | `{userName} powered up to {newScore} (+{delta})! "{userComment}" Time to upgrade yourself?` |
| data.route | `/crew?focusUid={senderUid}` |
| data.guildId | `{guildId}` |
| data.dispatchId | `{dispatchId}`（若有） |
| data.type | `club_progress_dispatch` |

### 6.2 Comment 空字串

- zh：省略「「{userComment}」」，改為：`{userName} 戰鬥力推進至 {newScore}（+{delta}）！今天要去改造一下自己嗎？`
- en：省略引號句，改為：`{userName} powered up to {newScore} (+{delta})! Time to upgrade yourself?`

### 6.3 數值格式

- `newScore` / `delta`：與該軸顯示精度一致（建議最多 2 位小數；去掉多餘尾 0）

### 6.4 i18n Keys（建議）

- `crew.dispatch.broadcastToggle`
- `crew.dispatch.commentPlaceholder`
- `crew.dispatch.tag.overlimit` / `challenge` / `nearDeath`
- `crew.dispatch.muteLabel`
- `crew.dispatch.muteHint`

推播 title/body 由 **Functions 依使用者 locale（若有）或預設 zh-Hant** 組裝；Phase 1 可固定雙語選一（建議先 zh-Hant，locale 欄位 Phase 2）。

---

## 7. Deep Link 規範

| 項目 | 規範 |
|---|---|
| Path | `/crew?focusUid={uid}` |
| 常數 | 沿用 `ROUTES.crew`；query key 鎖定 `focusUid` |
| 行為 | `CrewPage` mount／search 變更時若 `focusUid` 落在當前 `members[]`，開啟 `CrewMemberRadarSheet` |
| 無效 uid | 忽略 query，正常顯示私榜 |
| 未入會 | 既有 empty state；不開 sheet |
| 原生冷啟動 | Capacitor App `appUrlOpen` / push notification action → 導向同一 route |

---

## 8. 客戶端分層（Architecture）

| 層 | 職責 |
|---|---|
| `src/logic/core/` | comment sanitize、delta 純函數、文案組裝測試用 helper |
| `src/services/` | Push token 註冊、Callable 包裝、偏好寫入 |
| `src/hooks/` | Breakthrough 廣播狀態、mute switch、deep link focus |
| `src/components/` | 僅 presentational：checkbox、輸入、tags、switch |
| `functions/guild/` | Callable + FCM fan-out |

禁止：component 直呼 Firebase Messaging／Admin 邏輯。

### Entitlement

- 入會成員即可發／收（對齊 club sync Free 可用）
- **不**另開 Pro gate

---

## 9. 安全與成本 Guardrails

1. Non-member 不可對任意 guild 廣播
2. Client 不可直寫 `dispatches` / 他人 `muteClubDispatches`
3. Comment 長度與字元消毒
4. 排除 self / mute / 無 token
5. 成功廣播 throttle
6. `delta > 0` 硬門禁
7. 不因廣播產生全球 leaderboard Firestore 流量

---

## 10. 驗收標準（Phase 1 DoD）

- [ ] 入會用戶於 Breakthrough 勾選廣播後，隊友（未 mute、有 token）收到推播
- [ ] `delta <= 0` 時無推播、分數同步仍可成功
- [ ] 戰報顯示真實暱稱（無匿名）
- [ ] mute ON 後不再收到隊友戰報
- [ ] 點推播進入 `/crew?focusUid=` 並開對應規格卡
- [ ] comment ≤25 且經 sanitize
- [ ] 無 Firestore trigger
- [ ] i18n 無硬編碼 UI 字串
- [ ] 單元測試覆蓋：sanitize、delta guard、recipient filter

---

## 11. Phase 1 Ticket 清單與實作順序

建議泳道：`T0 → (T1 ∥ T2 ∥ T5) → T3 → T4 → T6`

| # | Ticket | 內容 | 依賴 |
|---|---|---|---|
| **T0** | Spec 落檔 | 建立本文件於 `docs/specs/CLUB_PROGRESS_DISPATCH_SPEC.md` | — |
| **T1** | Push Plugin 接入 | 加 `@capacitor/push-notifications`；iOS APNs／Android FCM 權限；`pushTokenService` 註冊／refresh／登出清除；寫入 `users.fcmToken*` | T0 |
| **T2** | 後端 Callable | `dispatchClubProgress`：delta>0、sanitize、mute/self/token 過濾、FCM multicast、throttle；rules deny-all `dispatches`；純函數單測 | T0（可與 T1 平行，但端對端需 T1） |
| **T3** | 偏好開關 | Crew／設定頁 Switch ↔ `muteClubDispatches`；預設接收 ON；i18n | T0 |
| **T4** | Breakthrough UI | 勾選＋25 字＋3 Tag；僅 `dual` + guild intent；成功後呼叫 dispatch；略過不擋 sync | T2（契約）、T1（真機推播） |
| **T5** | Deep Link | `/crew?focusUid=` 解析並開 `CrewMemberRadarSheet`；push `data.route` 導航 | T4 前可先做 |
| **T6** | 測試與原生驗證 | logic／Callable 單測；iOS+Android 真機：授權→發報→mute→點推播落地 | T1–T5 |

### Ticket 細節 checklist

#### T1 — Push Plugin 接入

- [ ] 安裝並設定 `@capacitor/push-notifications`
- [ ] iOS APNs entitlement／Android FCM 設定對齊現有 Firebase 專案
- [ ] `src/services/pushTokenService.ts`：註冊、refresh、登出清除
- [ ] 寫入 `users/{uid}.fcmToken` / `fcmTokenUpdatedAt` / `fcmPlatform`

#### T2 — 後端 Callable

- [ ] `functions/guild/dispatchClubProgressCallable.js`（或等價）
- [ ] 純函數：sanitize、delta guard、recipient filter（含單測）
- [ ] FCM Multicast；無 `onCreate` trigger
- [ ] `firestore.rules`：`guilds/{guildId}/dispatches/{dispatchId}` deny-all
- [ ] 成功廣播 throttle（建議每 uid 每小時 5 次）

#### T3 — 偏好開關

- [ ] UI Switch：`接收隊友戰情報告` / `Team Telemetry Alerts`
- [ ] 綁定 `users.muteClubDispatches`（預設 false = 接收 ON）
- [ ] i18n keys：`crew.dispatch.muteLabel` / `muteHint`

#### T4 — Breakthrough UI

- [ ] `PerformanceBreakthroughModal`：廣播勾選（預設勾選）+ 留言 ≤25 + 3 Tag
- [ ] 僅 `membershipSurface === 'dual'` 且 guild intent 顯示
- [ ] 分數同步成功後才呼叫 `dispatchClubProgress`；skip 不擋成功態
- [ ] i18n：`broadcastToggle` / `commentPlaceholder` / tag keys

#### T5 — Deep Link

- [ ] Query key 鎖定 `focusUid`
- [ ] `CrewPage` 自動開對應 `CrewMemberRadarSheet`
- [ ] 無效／離隊 uid → 僅進 `/crew`
- [ ] Push action / 冷啟動導向同一 route

#### T6 — 測試與原生驗證

- [ ] Unit：sanitize、`delta > 0`、recipient filter
- [ ] iOS 真機：授權 → 發報 → mute → 點推播落地
- [ ] Android 真機：同上
- [ ] 對照 §10 DoD 全數勾選

---

## 12. 關鍵檔案索引（實作錨點）

| 區域 | 路徑 |
|---|---|
| Breakthrough UI | `src/components/assessment/PerformanceBreakthroughModal.tsx` |
| Guild sync hook | `src/hooks/useLeaderboardSyncAssessmentPage.ts` |
| Guild callables (client) | `src/services/guildCallableService.ts` |
| Guild types | `src/types/guild.ts` |
| Crew page / sheet | `src/pages/CrewPage.tsx`, `src/components/crew/*` |
| Sync callable (server) | `functions/guild/syncGuildScoreCallable.js` |
| Fan-out | `functions/guild/guildScoreFanOut.js` |
| Functions export | `functions/index.js` |
| Rules | `firestore.rules` |
