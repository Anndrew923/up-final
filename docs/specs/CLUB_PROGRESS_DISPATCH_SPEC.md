# 最強肉體（Ultimate Physique）— 俱樂部進步戰報廣播（Club Progress Dispatch）

- **產品**：最強肉體（Ultimate Physique）
- **工作區**：`up-final`
- **版本時間戳**：2026-11-08（Asia/Taipei）；**修訂**：2026-11-08 — 鎖死 metric 命名、sync／broadcast 原子時序、users 寫入路徑
- **狀態**：Phase 1 規格鎖定（尚未實作）
- **SSOT 層**：本文件為本功能唯一規格來源；實作須對齊現況 `guild*` 路徑與 Callable 模式
- **相關現況**：`docs/specs/UP_NON_ASSESSMENT_FEATURE_CODEX.md` §1.6（俱樂部）、`PerformanceBreakthroughModal`、`syncGuildLadderScore`
- **對齊型別**：`ClubLadderDimension` / `SixAxisMetric`（`src/logic/core/guildRadarScores.ts`、`src/types/scoring.ts`）

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
2. 單行輸入：placeholder 走 i18n（繁中例：「說一句垃圾話或心得…（限 25 字）」）
3. 三個一鍵 Tag（點擊覆寫或填入輸入框；**字面值走 i18n，禁止元件硬編碼**）：
   - `crew.dispatch.tag.overlimit` → 繁中 `#剛性超限`
   - `crew.dispatch.tag.challenge` → 繁中 `#誰敢來戰`
   - `crew.dispatch.tag.nearDeath` → 繁中 `#今天差點升天`
4. 使用者按下「同步俱樂部／發布」：
   - `onPersistToDashboard`（本機）
   - **單次** Callable：`syncGuildLadderScore`（含可選 `broadcast` + `comment`）——分數 fan-out 與戰報在 **同一 transaction 語意** 內完成（見 §5.1）
5. 廣播被略過（`delta <= 0` / mute-all / rate-limit）**不得**阻擋分數同步成功態

### 3.2 接收端偏好

位置：俱樂部設定區或設定／通知頁（實作時擇一，須 i18n）。

- Label：`接收隊友戰情報告` / `Team Telemetry Alerts`
- Switch：ON = `muteClubDispatches === false`；OFF = `true`
- 預設 ON
- **寫入路徑**：必須經 Callable 或擴充後的 owner allowlist（見 §4.2）；禁止假設 client 可任意 `updateDoc(users/{uid})`

### 3.3 推播點擊

Deep Link → App 開 `/crew?focusUid={senderUid}` → `CrewPage` 自動開啟該成員 `CrewMemberRadarSheet`（若成員已離隊則僅進 `/crew`）。

---

## 4. 資料模型

### 4.1 廣播事件（可選持久化）

路徑：`guilds/{guildId}/dispatches/{dispatchId}`

> 命名鎖定 `guilds`（非 `clubs`），與現有 Firestore／Callable 一致。

```ts
/** metricType 必須與 ClubLadderDimension 鎖死，禁止自造簡寫（explosive/muscle/grip）。 */
type ClubDispatchMetric = ClubLadderDimension; // 'overall' | SixAxisMetric

interface ClubDispatch {
  id: string;
  guildId: string;
  senderUid: string;
  senderDisplayName: string; // 具名；禁止匿名遮罩
  metricType: ClubDispatchMetric;
  /**
   * overall → ladderScore
   * 其餘 → SixAxisMetric 鍵名：
   * strength | explosivePower | cardio | muscleMass | bodyFat | gripStrength
   */
  previousScore: number;
  newScore: number;
  delta: number; // 必須 > 0 才允許建立「已發送」紀錄
  comment: string; // 已 sanitize，長度 0..25
  /** 鎖定 ISO 字串，對齊 guilds.members[].updatedAt／guildDoc 慣例（禁止 Timestamp 混用） */
  createdAt: string;
  /** Phase 1 可選 */
  fcmSentCount?: number;
  skippedReason?: 'non-positive-delta' | 'no-recipients' | 'muted-all' | 'rate-limited';
}
```

**Security Rules：** client deny-all；僅 Admin SDK（Callable）讀寫。

### 4.2 使用者偏好與 Push Token

**現況债警示：** `firestore.rules` 對 `users/{uid}` 的 owner update **僅允許** `termsAcceptedVersion` / `termsAcceptedAt`。  
因此 Phase 1 **禁止**假設 client 可直接寫 `muteClubDispatches` / `fcmToken*`。

**鎖定寫入策略（二選一，T1/T3 開工前必須擇一實作）：**

1. **首選（對齊 guild）：** Callable `upsertPushToken` / `setClubDispatchMute`（Admin SDK patch）
2. **次選：** 擴充 `firestore.rules` owner `onlyMutate` allowlist，嚴格限定上述欄位型別

```ts
interface UserClubDispatchFields {
  /** false = 接收戰報（預設）；true = 靜音 */
  muteClubDispatches?: boolean;
  /**
   * Phase 1 簡化：單裝置 token（last-writer-wins）。
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
- 舊分來源：同文件 `members[]` 中對應 uid 的 `ladderScore` 或 `radarScores[metric]`（鍵名必須為 `SixAxisMetric`）
- 缺軸（radar key 不存在）：`previousScore` 視為 `0`（首次上榜可廣播）
- 單會籍：`users.guildId`
- **D1 補充：** 即便 sync payload 帶 `isAnonymousInLadder`（僅影響全球／avatar 清除），戰報 `senderDisplayName` 一律取 guild `members[].displayName`，禁止換成「匿名用戶」

---

## 5. Callable 契約

### 5.1 名稱與原子性（Phase 1 鎖定 — 防時序債）

**禁止（Phase 1）：** 先 `syncPageGuild` 再另呼獨立 `dispatchClubProgress`。  
原因：fan-out 已把 `members[]` 寫成 `newScore` 後，後續讀舊分會得到 `delta ≈ 0`，戰報全數被 D2 靜默略過。

**Phase 1 鎖定實作：** 擴充既有 `syncGuildLadderScore`：

```ts
// 既有欄位 + 可選廣播
{
  ladderScore: number;
  displayName: string;
  avatarUrl?: string | null;
  isAnonymous?: boolean;
  radarScores?: GuildRadarScores;
  /** opt-in 戰報；缺省 false */
  broadcast?: boolean;
  comment?: string;
  /**
   * 用於文案／delta 的主軸。缺省 'overall'（對 ladderScore）。
   * 若為單軸頁 Breakthrough，傳該頁 SixAxisMetric。
   */
  broadcastMetricType?: ClubLadderDimension;
}
```

Server 在 **寫入 members[] 之前** 讀取 previousScore → 算 delta → 寫入新分 → 若 `broadcast === true && delta > 0` 再 FCM／可選寫 `dispatches`。

**Phase 2 可選拆分：** 獨立 `dispatchClubProgress` 僅在能保證「讀舊分與寫新分同 TX」或明確接收 server 權威 previousScore 時才允許。

### 5.2 Request（廣播相關欄位）

```ts
type ClubDispatchMetric = ClubLadderDimension;
// 'overall' | 'strength' | 'explosivePower' | 'cardio' | 'muscleMass' | 'bodyFat' | 'gripStrength'

interface SyncGuildLadderScoreBroadcastFields {
  broadcast?: boolean;
  comment?: string; // 原始輸入；server 再 sanitize
  broadcastMetricType?: ClubDispatchMetric; // 缺省 'overall'
}
```

`newScore` 權威來源：

- `broadcastMetricType === 'overall'` → `ladderScore`
- 否則 → `radarScores[broadcastMetricType]`（必須 finite；否則視為 invalid／skip broadcast，**不**擋分數寫入）

### 5.3 Comment Sanitize（server 強制）

1. `typeof comment !== 'string'` → `''`
2. `trim()`；合併連續空白為單空白
3. 移除控制字元與 `<>`（對齊 guild name 防護精神）
4. 長度 > 25 → **截斷至 25**（Phase 1 鎖定截斷，不拒收）
5. 空字串合法

### 5.4 Server 演算法（順序鎖定）

在既有 `syncGuildLadderScore` / `fanOutLadderScoreToGuild` 路徑上插入：

1. `requireSignedInUid`
2. 讀 `users/{uid}` → 取得 `guildId`；無會籍 → 既有 skip（分數亦不寫）
3. 開 transaction 讀 `guilds/{guildId}`；驗證成員且非 disbanded
4. **先**解析 `previousScore`（寫入前）：
   - `broadcastMetricType === 'overall'`（或缺省）→ `members[i].ladderScore`
   - 否則 → `members[i].radarScores?.[metric]`；缺軸視為 `0`
5. 套用既有 member score / radar / identity patch（寫新分）
6. 若 `broadcast !== true` → 結束（不發 FCM）
7. `delta = newScore - previousScore`
8. **若 `!(delta > 0)`** → 分數已寫入；回傳 `broadcastSkipped: 'non-positive-delta'`（**不發 FCM**）
9. throttle 檢查；達限 → `broadcastSkipped: 'rate-limited'`
10. `senderDisplayName` = 寫入後（或寫入前）guild member `displayName`（具名；D1）
11. （可選）寫入 `dispatches/{id}`
12. 組收件人：`memberUids` 排除 `senderUid`；讀各 user：
    - 跳過 `muteClubDispatches === true`
    - 跳過無有效 `fcmToken`
13. Transaction commit 後 `sendEachForMulticast`（或分批 ≤500）  
    WHY：FCM 不應拖住 TX；分數一致性優先於推播送達。
14. Response 擴充：

```ts
interface SyncGuildLadderScoreResponse {
  ok: boolean;
  skipped?: boolean; // 分數路徑 skip（no-guild 等）
  reason?: string;
  guildId?: string | null;
  /** 戰報專用；與分數 ok 解耦 */
  broadcastSkipped?:
    | 'not-requested'
    | 'non-positive-delta'
    | 'no-recipients'
    | 'rate-limited'
    | 'invalid-metric-score';
  dispatchId?: string | null;
  delta?: number;
  fcmSuccessCount?: number;
  fcmFailureCount?: number;
}
```

### 5.5 Throttle（Phase 1 鎖定）

- 每 uid 每小時最多 **5** 次 **成功發出** 的廣播（獨立 collection 或 user rolling window）
- 達限：分數仍成功；`broadcastSkipped: 'rate-limited'`

### 5.6 與分數同步的關係

- **分數同步成功 ≠ 自動廣播**（必須 `broadcast: true`）
- 僅 Breakthrough 勾選後 client 才傳 `broadcast: true`
- 全球 ladder `submitShardCore` 的 guild fan-out **禁止**帶 broadcast／觸發戰報
- Home「🛡️ 同步俱樂部」預設 **不**帶 broadcast（非 Breakthrough 語境）

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
- [ ] i18n 無硬編碼 UI 字串（含 3 個 Tag）
- [ ] `metricType` / `broadcastMetricType` 使用 `ClubLadderDimension` 真名（非 explosive/muscle/grip 簡寫）
- [ ] previousScore 於 **members[] 寫入前** 讀取（回歸測試：sync+broadcast 同呼不會因 delta=0 誤 skip）
- [ ] `fcmToken` / `muteClubDispatches` 寫入不違反現行 `users` rules（Callable 或 allowlist）
- [ ] 單元測試覆蓋：sanitize、delta guard、recipient filter、atomic previousScore

---

## 11. Phase 1 Ticket 清單與實作順序

建議泳道：`T0 → (T1 ∥ T2 ∥ T5) → T3 → T4 → T6`

| # | Ticket | 內容 | 依賴 |
|---|---|---|---|
| **T0** | Spec 落檔 | 本文件（含修訂鎖死項） | — |
| **T1** | Push Plugin 接入 | `@capacitor/push-notifications`；APNs／FCM；`pushTokenService`；經 Callable／rules allowlist 寫入 `fcmToken*` | T0 |
| **T2** | 後端同步＋廣播 | 擴充 `syncGuildLadderScore`：TX 內讀舊分→寫新分→可選 FCM；sanitize／throttle／dispatches rules；純函數單測 | T0 |
| **T3** | 偏好開關 | Crew／設定 Switch ↔ `muteClubDispatches`（Callable 或 allowlist）；預設接收 ON；i18n | T0／T1 寫入策略 |
| **T4** | Breakthrough UI | 勾選＋25 字＋3 Tag；`dual` + guild intent；`broadcast` 併入 `syncPageGuild` payload；skip 不擋 sync | T2、T1 |
| **T5** | Deep Link | `/crew?focusUid=` → `CrewMemberRadarSheet`；push `data.route` | 可與 T2 平行 |
| **T6** | 測試與原生驗證 | 單測 + iOS／Android 真機；對照 §10 | T1–T5 |

### Ticket 細節 checklist

#### T1 — Push Plugin 接入

- [x] 安裝並設定 `@capacitor/push-notifications`
- [x] iOS APNs entitlement／Android FCM 設定對齊現有 Firebase 專案（`aps-environment` + `POST_NOTIFICATIONS`；真機 APNs key 仍須在 Apple/Firebase Console 完成）
- [x] `src/services/pushNotificationService.ts`：註冊、refresh、登出清除（Crew joined 掛載；sign-out clear）
- [x] **不得**直接 `updateDoc` 撞上現行 terms-only rules；走 Callable `upsertPushToken`
- [x] 寫入 `users/{uid}.fcmToken` / `fcmTokenUpdatedAt` / `fcmPlatform`（單裝置 last-writer-wins）

#### T2 — 後端同步＋廣播

- [ ] 擴充 `functions/guild/syncGuildScoreCallable.js` + `guildScoreFanOut.js`（或同目錄純函數模組）
- [ ] **寫入前**讀 previousScore；`broadcast && delta > 0` 才 FCM
- [ ] `broadcastMetricType` 驗證屬於 `ClubLadderDimension`
- [ ] 純函數單測：sanitize、delta guard、recipient filter、atomic previousScore
- [ ] FCM 在 TX commit 後發送；無 `onCreate` trigger
- [ ] `firestore.rules`：`guilds/{guildId}/dispatches/{dispatchId}` deny-all
- [ ] 成功廣播 throttle：每 uid 每小時 5 次

#### T3 — 偏好開關

- [ ] UI Switch：`接收隊友戰情報告` / `Team Telemetry Alerts`
- [ ] 綁定 `users.muteClubDispatches`（預設 false = 接收 ON）
- [ ] 寫入策略與 T1 一致（Callable 或 allowlist）
- [ ] i18n keys：`crew.dispatch.muteLabel` / `muteHint`

#### T4 — Breakthrough UI

- [x] `ClubDispatchModal`：獨立宣告彈窗（分數 + 留言 ≤25 + 3 Tag + 廣播／默默同步）
- [x] 僅 `membershipSurface === 'dual'` 且點俱樂部相關同步時拉起
- [x] `syncPageGuild` 傳 `broadcast` / `comment` / `broadcastMetricType`（**禁止**另行二次 dispatch call）
- [x] Home「同步俱樂部」不傳 `broadcast: true`
- [x] i18n：`broadcastAndSync` / `silentSync` / `commentPlaceholder` / tag keys

#### T5 — Deep Link

- [ ] Query key 鎖定 `focusUid`
- [ ] `CrewPage` 自動開對應 `CrewMemberRadarSheet`
- [ ] 無效／離隊 uid → 僅進 `/crew`
- [ ] Push action / 冷啟動導向同一 route

#### T6 — 測試與原生驗證

- [ ] Unit：sanitize、`delta > 0`、recipient filter、寫入前 previousScore
- [ ] 回歸：先寫分再讀舊分的錯誤順序必須被測試擋下
- [ ] iOS 真機：授權 → 發報 → mute → 點推播落地
- [ ] Android 真機：同上
- [ ] 對照 §10 DoD 全數勾選

---

## 12. 規格自檢 — 已消除的技術債風險

| 風險 | 狀態 | 鎖定方式 |
|---|---|---|
| `metricType` 簡寫與 `SixAxisMetric` 不一致 | 已鎖定 | 僅允許 `ClubLadderDimension` 真名 |
| sync 後再 dispatch → delta 恒為 0 | 已鎖定 | 單次 Callable；寫入前讀舊分 |
| 雙路徑（獨立 Callable vs 擴充 sync）分叉 | 已鎖定 | Phase 1 只擴充 `syncGuildLadderScore` |
| client 直寫 `users` 撞 rules | 已標註 | Callable 首選／allowlist 次選 |
| `createdAt` ISO vs Timestamp 混用 | 已鎖定 | ISO string |
| Tag／文案硬編碼 | 已鎖定 | 全走 i18n |
| `rate-limited` 未進 response union | 已補齊 | `broadcastSkipped` |
| 全球 fan-out／Home sync 誤觸廣播 | 已鎖定 | 僅 Breakthrough 傳 `broadcast: true` |

---

## 13. 原生推播設定備註（T1）

| 平台 | 必要設定 |
|---|---|
| **npm** | `@capacitor/push-notifications` + `npx cap sync` |
| **Android** | `POST_NOTIFICATIONS` in `AndroidManifest.xml`；Firebase `google-services.json` 已存在於專案時 FCM 可用 |
| **iOS** | `App.entitlements` → `aps-environment`；`Info.plist` → `UIBackgroundModes` 含 `remote-notification`；Xcode Signing 開啟 Push Notifications capability；Apple Developer 開 APNs key 並接到 Firebase |
| **掛載** | `main.tsx` 早期 `attachListeners`（冷啟動）+ `usePushNavigateBridge`（AppShell navigate + re-attach）+ `useGuildPushRegistration`（Crew joined 才 permission/`register`） |
| **Deep link** | Client allowlist pathname === `/crew` only；cold-start tap queues pending route until navigate handler mounts |
| **登出** | `signOutFirebase` → `pushNotificationService.clearOnSignOut`（await in-flight register → clear token Callable → detach → Auth signOut） |

---

## 14. 關鍵檔案索引（實作錨點）

| 區域 | 路徑 |
|---|---|
| Breakthrough UI | `src/components/assessment/PerformanceBreakthroughModal.tsx` |
| Guild sync hook | `src/hooks/useLeaderboardSyncAssessmentPage.ts` |
| Guild callables (client) | `src/services/guildCallableService.ts` |
| Guild types / axes | `src/types/guild.ts`, `src/types/scoring.ts`, `src/logic/core/guildRadarScores.ts` |
| Crew page / sheet | `src/pages/CrewPage.tsx`, `src/components/crew/*` |
| Sync callable (server) | `functions/guild/syncGuildScoreCallable.js` |
| Fan-out | `functions/guild/guildScoreFanOut.js` |
| Functions export | `functions/index.js` |
| Rules | `firestore.rules`（注意 `users` owner update 現僅 terms 欄位） |
