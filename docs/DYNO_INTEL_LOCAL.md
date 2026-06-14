# DYNO INTEL 本地通電手冊

本文件說明如何在本地**完整**跑通 DYNO INTEL（跨軸診斷 + Gemini 推理），而非僅解鎖 UI。

## 通電鏈路（四層）

| 層 | 檢查點 | 本地預設 |
|----|--------|----------|
| ① Google 登入 | 非匿名 | 需手動登入 |
| ② Client Pro bypass | Vite `DEV` | `npm run dev` 自動通 |
| ③ Server Pro bypass | `DYNO_INTEL_DEV_BYPASS` | `npm run dev:dyno` 自動注入 |
| ④ Gemini 推理 | `GEMINI_API_KEY` | 需填入 `functions/.env.local` |

> Client bypass **無法**代替 Server bypass。Callable 仍會回 `pro-required`，除非 Emulator / Functions 環境已放行。

---

## 一鍵啟動（推薦）

### 1. 準備前端 `.env`

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...

VITE_FIREBASE_USE_EMULATORS=true
VITE_LADDER_CALLABLE_WRITES=true
```

### 2. 準備 Functions 密鑰

```bash
cp functions/.env.example functions/.env.local
```

編輯 `functions/.env.local`：

```env
DYNO_INTEL_DEV_BYPASS=true
GEMINI_API_KEY=你的_Google_AI_Studio_Key
```

Key 取得：[Google AI Studio](https://aistudio.google.com/apikey)

> **常見誤放**：若 Key 貼在**根目錄** `.env`，Callable **讀不到**。`npm run dev:dyno` 會自動遷移一次到 `functions/.env.local` 並提示 WARNING。

### 3. 一鍵拉起全棧

```bash
npm run dev:dyno
```

同時啟動：

- Firebase Emulator（Auth / Functions / Firestore / Storage）
- Vite 前端（`npm run dev`）

終端會印出 `[dev:dyno]` 診斷，包含 `GEMINI_API_KEY` 是否已載入。

### 4. 登入與驗收

1. App 內 **Google 登入**（匿名不可用）
2. Home 確認雷達 / 身體資料已有
3. 開啟 DYNO INTEL → 跨軸 tab 無鎖
4. 輸入問題 → **發送** → 應見 AI 打字回覆

Debug 面板（Home → 開啟 Debug Panel）底部 **DYNO INTEL TELEMETRY** 可一眼看 Client / Emulator / Auth 燈號。

---

## 30 秒自檢清單

| # | 項目 | 預期 |
|---|------|------|
| 1 | Console `[ENV_CHECK] dynoIntelProBypass: true` | ✅ |
| 2 | Console `[firebase] Connected to local emulators` | ✅ |
| 3 | `[dev:dyno] GEMINI_API_KEY: loaded…` | ✅ |
| 4 | 已 Google 登入 | ✅ |
| 5 | Telemetry 五燈全黃（通電） | ✅ |

任一 ❌ → 見下方故障排除。

---

## 故障排除

| 現象 | 可能原因 | 處理 |
|------|----------|------|
| 跨軸 Paywall | Server 未 bypass | 用 `npm run dev:dyno`，確認 `functions/.env.local` |
| `遙測鏈路中斷` | Emulator 未跑 / 前端未連 emulator | `VITE_FIREBASE_USE_EMULATORS=true` 後重啟 dev |
| Functions `gemini-not-configured` | 缺 API Key | 填 `GEMINI_API_KEY` 到 `functions/.env.local` |
| `Gemini API 預付額度已耗盡` / HTTP 429 | AI Studio 餘額用盡 | 至 [AI Studio](https://aistudio.google.com/) 充值或換有效 Key |
| `[dynoIntelChat] gemini failure gemini-invalid-json` | Gemini 回傳非標準 JSON | 重試發送；若仍失敗重啟 `dev:dyno` |
| 天梯榜單空白 | Emulator Firestore 重啟後資料清空 | 重新上傳分數，或關閉 `VITE_FIREBASE_USE_EMULATORS` 連正式榜 |
| Auth `accounts:lookup` 400 | Emulator Auth 重啟後 token 失效 | 登出後重新 Google 登入 |
| Auth 被擋 | 匿名登入 | 改 Google 登入 |
| 體重模擬報錯 | Home 缺身體資料 | 先完成 Home  profile |

Emulator UI：<http://127.0.0.1:4000> — 查看 Functions 日誌。

---

## 腳本說明

| 指令 | 用途 |
|------|------|
| `npm run dev` | 僅前端；Client bypass 開，**不含** Emulator |
| `npm run firebase:emulators` | 僅 Emulator；需自行 export env |
| `npm run dev:dyno` | **全棧一鍵**：Emulator + Vite + `DYNO_INTEL_DEV_BYPASS` |

`scripts/dev-dyno.mjs` 會合併 `functions/.env.local` 並強制 `DYNO_INTEL_DEV_BYPASS=true`。

---

## 相關文件

- [FIREBASE_EMULATOR.md](./FIREBASE_EMULATOR.md) — Emulator 埠號與通用設定
- 根目錄 `.env.example` — 前端 Vite 變數
- `functions/.env.example` — Functions / Gemini 變數

## 安全紅線

- **勿**在正式 Cloud Functions 長期開啟 `DYNO_INTEL_DEV_BYPASS`
- **勿** commit `functions/.env.local` 或任何含 `GEMINI_API_KEY` 的檔案
- Production App 預設 bypass **關閉**；Beta 需明確 build-time 注入 `VITE_DYNO_INTEL_BETA_FREE=true`
