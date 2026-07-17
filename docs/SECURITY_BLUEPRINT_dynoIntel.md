# Security Blueprint — dynoIntelChat 核心防護

- **範圍**：P0-A（App Check 強制）+ P0-B（裝置指紋限流）
- **版本**：v1
- **狀態**：Backlog（未施工）
- **兜底**：Gemini 預付點數 + 關閉自動續值＝成本硬天花板已生效（最壞損失＝剩餘點數）
- **來源**：移植自 `lbj-goat-meter` 的投票防刷防線（App Check / 多維度限流 / 裝置指紋雜湊）

---

## 0. 目標與風險對應

| 風險 | 對策 |
|---|---|
| Risk A：繞過 App 直接呼叫 Callable | **P0-A** `enforceAppCheck` + 前端 App Check 初始化 |
| Risk B：同機切換多帳號重刷免費額度 | **P0-B** 裝置指紋（deviceId 雜湊）維度每日上限 |

**設計原則（遵 up-final `.cursorrules`）**

- 安全邏輯落在 `functions/` 服務層；UI 不得直呼 SDK。
- 金鑰一律走 Secret Manager（`defineSecret`），嚴禁明文。
- 指紋只存 `SHA-256(pepper ∥ deviceId)`，不存可還原原始值。
- 錯誤訊息走 i18n key，不硬編碼。
- 現有本地優先資料流不受影響；Gemini 兜底 fallback 不可破壞。

---

## 1. 前置作業（Console / Secrets / 環境變數）

**Console**

1. Firebase Console → App Check → 註冊 Web App，Provider 選 reCAPTCHA Enterprise。
2. 取得 reCAPTCHA Enterprise Site Key（公開，前端用）。
3. App Check → 先開「Monitor / 監控模式」（不強制），觀察 1~2 週再切 Enforce。
4. 本機開發：App Check → 管理 debug tokens，加入本機瀏覽器印出的 debug token。
5. 原生（Android/iOS）：Play Integrity / DeviceCheck provider（native 平台前端 skip reCAPTCHA）。

**Secrets（Secret Manager，非明文）**

6. 新增 pepper：`firebase functions:secrets:set DYNO_FINGERPRINT_PEPPER`（用隨機長字串，比照 `GEMINI_API_KEY`）。

**環境變數（前端 `.env`，`VITE_` 前綴，公開值）**

```
VITE_APP_CHECK_SITE_KEY=<reCAPTCHA Enterprise site key>
VITE_APP_CHECK_DEBUG_TOKEN=<本機 debug token，僅 .env.local，不進版控>
```

---

## 2. 檔案修改預算表 (File Diff Budget)

| 階段 | 類型 | 檔案 | 核心改動 |
|---|---|---|---|
| P0-A | 改 | `src/services/firebaseClient.ts` | 新增 App Check 初始化（reCaptcha Enterprise + native skip + localhost debug token + autoRefresh）|
| P0-A | 改 | `functions/dynoIntel/chatCallable.js` | onCall 選項加 `enforceAppCheck: true` |
| P0-A | 改 | `functions/shared/constants.js` | `CALLABLE_OPTS` 不動；加註解說明 App Check 為 per-callable 決策 |
| P0-A | 新（選配）| `src/services/appCheckClient.ts` | 封裝 `ensureFreshAppCheckToken()`，發 dynoIntelChat 前強制刷 token |
| P0-A | 改 | `.env` / `.env.example` | `VITE_APP_CHECK_SITE_KEY` 等 |
| P0-B | 新 | `functions/dynoIntel/dynoSecurity.js` | `hashDeviceMaterial()` + 裝置維度每日配額 Transaction（先讀後寫）|
| P0-B | 改 | `functions/dynoIntel/chatCallable.js` | 綁 `DYNO_FINGERPRINT_PEPPER` secret；在 `consumeDynoQuota` 前後併入裝置閘門 |
| P0-B | 改 | `functions/dynoIntel/rateLimits.js` | 抽出/複用「日曆日 dayKey + 歸零」邏輯給裝置維度共用 |
| P0-B | 改 | `functions/shared/constants.js` | `DYNO_INTEL_DEVICE_PER_DAY`（新，如 4）、`DYNO_INTEL_DEVICE_RATE_COLLECTION` |
| P0-B | 改 | `src/services/dynoIntelService.ts` | 送出 deviceId（Capacitor `Device.getId()`）+ 取不到時 fallback |
| P0-B | 改 | `functions/dynoIntel/validateContext.js` | 允許/驗證 `payload.deviceId`（選配、寬鬆）|
| P0-B | 新 | `functions/test/dynoSecurity.test.js` | 裝置雜湊 + 配額純函數單元測試 |
| P0-B | 改 | `src/i18n/locales/*/common/*.json` | 新增 device-quota 超限的錯誤文案 key |

---

## 3. 核心虛擬碼（設計意圖）

### P0-A.1 `src/services/firebaseClient.ts`（前端 App Check 初始化）

> 意圖：僅正版來源可取得 App Check token；native 平台交給 Play Integrity；localhost 走官方 debug token，避免 reCAPTCHA 在本機 400 迴圈。

```
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

function initAppCheck(app):
   if Capacitor.isNativePlatform():           # 原生：Play Integrity/DeviceCheck 處理，前端 skip
      return null
   siteKey = env.VITE_APP_CHECK_SITE_KEY
   if IS_LOCALHOST:
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = env.VITE_APP_CHECK_DEBUG_TOKEN || true
   if !siteKey and !IS_LOCALHOST:
      warn('site key missing — skip'); return null   # 降級：不阻斷，但記錄
   return initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
   })
# 必須在 initializeApp 之後、任何 getFunctions/httpsCallable 之前呼叫
```

### P0-A.2 `functions/dynoIntel/chatCallable.js`（後端強制）

> 意圖：無有效 App Check token 的請求，函式根本不執行 → 直接 401。

```
export const dynoIntelChat = onCall(
  { ...CALLABLE_OPTS,
    enforceAppCheck: true,                         # ← P0-A 唯一後端改動
    secrets: [geminiApiKey, fingerprintPepper],    # ← P0-B 追加 pepper
  },
  async (request) => { ...原邏輯不變... }
)
```

### P0-B.1 `functions/dynoIntel/dynoSecurity.js`（新增，裝置維度）

> 意圖：同機跨帳號共用「裝置每日配額」，堵住登出換帳號重刷；指紋只存雜湊，pepper 來自 Secret，取不到 deviceId 則降級略過（不阻擋）。

```
import crypto from 'node:crypto'

export function hashDeviceMaterial(deviceId, pepper):
   if !pepper or !deviceId?.trim(): return null          # 降級訊號：無法識別裝置
   return sha256( pepper ∥ '\0' ∥ deviceId.trim() ).hex  # 64-hex，比照 GOAT fingerprintHash

# 裝置維度每日配額（沿用 rateLimits.js 的日曆日 dayKey 重置語義）
export async function enforceDeviceDailyQuota(tx, deviceHash, now):
   if !deviceHash: return { allowed: true, skipped: true }   # 拿不到指紋 → 不擋（見 Case 3）
   ref  = db.collection(DYNO_INTEL_DEVICE_RATE_COLLECTION).doc(deviceHash)
   doc  = await tx.get(ref)                                   # 先讀（Transaction 規則）
   day  = dayKeyLocal(now)
   count = (doc.dayKey === day) ? doc.countToday : 0          # 跨日自動歸零
   if count >= DYNO_INTEL_DEVICE_PER_DAY:
      return { allowed: false, limit: DYNO_INTEL_DEVICE_PER_DAY }
   return { allowed: true, ref, nextCount: count + 1, day }

export function commitDeviceUsage(tx, gate):                  # 後寫
   if gate.skipped or !gate.ref: return
   tx.set(gate.ref, { dayKey: gate.day, countToday: gate.nextCount,
                      limit: DYNO_INTEL_DEVICE_PER_DAY }, { merge:false })
```

### P0-B.2 `functions/dynoIntel/chatCallable.js`（併入閘門）

> 意圖：裝置閘門與既有 uid 配額「同一個 Transaction」原子鎖步，避免併發穿透。順序＝先讀 uid rate doc + device rate doc → 判定 → 一起寫。

```
const pepper   = fingerprintPepper.value()
const devHash  = hashDeviceMaterial(request.data.deviceId, pepper)
await db.runTransaction(tx =>
   uidGate = checkDynoIntelDailyLimit(uidDoc, isPro, now)     # 既有邏輯
   devGate = await enforceDeviceDailyQuota(tx, devHash, now)  # 新：裝置維度
   if !uidGate.allowed:  return quota-exhausted (reason: 'quota-exhausted')
   if !devGate.allowed:  return quota-exhausted (reason: 'device-quota-exhausted')  # 新 reason
   recordDynoIntelUsage(...)                                  # 寫 uid
   commitDeviceUsage(tx, devGate)                             # 寫 device
)
# 註：Pro 用戶可考慮豁免裝置維度（isPro → skip devGate），避免付費用戶多裝置被誤傷
```

### P0-B.3 `src/services/dynoIntelService.ts`（前端送 deviceId + fallback）

> 意圖：優先用穩定的 Capacitor `Device.getId()`；Web/舊裝置/拒權時退到 localStorage 持久化 UUID；再不行就送空字串（後端降級為不擋）。

```
import { Device } from '@capacitor/device'
async function resolveDeviceId():
   try:
      id = (await Device.getId())?.identifier
      if id: return id
   catch: /* 拒權/舊裝置/Web 不支援 */
   # fallback：本地持久化隨機 UUID（跨啟動穩定，但清快取會重置 → 可接受）
   cached = localStorage.getItem('dynoDeviceId')
   if cached: return cached
   uuid = crypto.randomUUID(); localStorage.setItem('dynoDeviceId', uuid); return uuid
# 呼叫：dynoIntelChatFn({ context, userQuestion, deviceId: await resolveDeviceId() })
```

---

## 4. 核心防線測試邊界 (Test Scenarios)

### Case 1（防繞過 / P0-A）

- **前置**：dynoIntelChat 已設 `enforceAppCheck: true` 並部署。
- **步驟**：用 Postman/cURL 帶「有效 Google ID Token」但「不帶 `X-Firebase-AppCheck` 標頭」直接 POST 到 Callable endpoint。
- **預期**：函式不執行；回傳 error code = `unauthenticated`（HTTP 401）。
- **反例確認**：帶合法 App Check token 的正式 App 請求 → 200 正常回覆。
- **監控**：Cloud Logging 應見 App Check 拒絕紀錄；`route-telemetry` 不應產生。

### Case 2（防多帳 / P0-B）

- **設定**：`DYNO_INTEL_DEVICE_PER_DAY = 4`（示例；trial=2/帳號）。
- **前置**：同一台實機，App Check 正常，pepper 已設。
- **步驟**：
  1. 帳號 A 問 2 次（用完 A 的 trial）→ 登出。
  2. 帳號 B 問 2 次（用完 B 的 trial，裝置累計 4）→ 登出。
  3. 帳號 C 問第 1 次。
- **預期**：帳號 C 第 1 次即被擋，回 `{ ok:false, reason:'device-quota-exhausted' }`（裝置日累計已達 4，跨帳號共用）。
- **邊界**：跨過台灣 08:00（UTC 00:00）後裝置計數歸零 → C 可再問。
- **反例**：不同實機的帳號 C → 不同 deviceHash → 不受影響（避免誤傷真實新用戶）。
- **註**：Pro 用戶若設計為豁免，需另測 Pro 多裝置不被裝置閘門阻擋。

### Case 3（魯棒性 / Fallback 降級）

- **情境 a**：首次使用 / 使用者拒絕權限 / 舊型裝置 `Device.getId()` 取不到 identifier。
  - 前端：`resolveDeviceId()` 退到 localStorage UUID；仍取不到 → 送空字串。
  - 後端：`hashDeviceMaterial()` 回 null → `enforceDeviceDailyQuota` 回 `skipped:true`。
  - 預期：不阻擋，正常走 uid 配額發問（安全性降級但可用性優先）。
- **情境 b**：pepper secret 未設定（設定疏漏）。
  - 後端：`hashDeviceMaterial()` 回 null → 同上降級，不整體壞掉。
- **情境 c**：Web 平台（無 Capacitor）。
  - 前端：Device 於 Web 回退；用 localStorage UUID；功能正常。
- **驗收準則**：任何一種取不到 deviceId 的情況，「正常用戶都能照常發問」，絕不因防刷機制造成 false-block（可用性 > 防刷嚴格度）。

---

## 5. 灰度上線與回滾

- App Check 先在 Console 開「Monitor 監控」1~2 週，確認真實流量都帶得到 token，再切 Enforce；後端 `enforceAppCheck` 與 Console Enforce 需同步，避免真實用戶 401。
- 回滾：移除 `enforceAppCheck` / 提高 `DEVICE_PER_DAY` / `hashDeviceMaterial` 強制回 null，皆可單點快速停用，不影響 Gemini 主鏈路。
- 兜底提醒：即使全數延後，Gemini 預付點數 + 關閉自動續值已封死最壞成本（上限＝剩餘點數）；此 Blueprint 屬「降低被刷機率」，非「防爆帳單」。

---

## 6. 驗收 Checklist

- [ ] P0-A 前端 App Check 初始化（web reCAPTCHA / native skip / localhost debug）
- [ ] P0-A dynoIntelChat `enforceAppCheck: true` 已部署且 Console 同步 Enforce
- [ ] P0-A Case 1 通過（Postman 無 App Check → 401）
- [ ] P0-B `DYNO_FINGERPRINT_PEPPER` 已存 Secret Manager 並綁定 dynoIntelChat
- [ ] P0-B `dynoSecurity.js` 單元測試（雜湊 + 配額歸零 + 降級）全綠
- [ ] P0-B Case 2 通過（同機第 3 帳號被 device-quota 擋）
- [ ] P0-B Case 3 通過（取不到 deviceId 時正常用戶不受影響）
- [ ] i18n：device-quota 超限文案 zh-Hant / en 皆有 key，無硬編碼
- [ ] functions 測試 + 前端 vitest 全綠；`npm run lint` / `build` 0 錯誤
