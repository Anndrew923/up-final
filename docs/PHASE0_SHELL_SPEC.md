# Phase 0 — Shell & Navigation Fusion Spec

本文件為 **UI 殼層與底部導覽** 的融合規格（Phase 0），供 Phase 1 實作 `AppShell` / `BottomNav` 時對照，避免返工。

## 1. 目標與範圍

| 項目 | 說明 |
|------|------|
| **目標** | 定義可沿用的終端機式外框 + 底部導覽資訊架構 + 美術語言對齊方式 |
| **範圍** | 結構契約、導覽資料來源、`nav.config.ts` 草稿、i18n key、安全區約束 |
| **非範圍（Phase 1+）** | React Router 串接、實際頁面內容、動畫、素材圖層、Firebase |

## 2. 設計來源（Reference-only）

| 來源 | 取什麼 | 不搬什麼 |
|------|--------|----------|
| **reference-app-fitness** (`BottomNavBar.jsx`) | 底部導覽 **項目順序、path、guest 規則、SVG 語意（icon key）** | Firebase、inline style、Capacitor 鍵盤、`GeneralModal` 業務細節 |
| **reference-app** (`MagitekChassis.jsx` + Chassis CSS) | **三層架構**（Background / ScrollContent / Foreground）、HUD 頭像區與底部「底座」視覺層級概念 | Magitek 素材檔、`AvatarSection` 業務資料綁定、hash 路由細節 |
| **lbj-goat-meter** (`index.css` :root tokens) | **暗黑競技風**色彩與 safe-area 語意、`--safe-*`、`--color-king-gold` 等 | 頁面特有元件、對抗立場業務 |

**Workspace 規則**：reference 專案唯讀；所有實作只在 `up-final`。

## 3. Shell 結構契約（終端機外框）

與 reference-app 「三層」對齊，命名可簡化為 Phase 1 元件：

| Layer | ID / 類名（建議） | Z-index 語意 | pointer-events |
|-------|-------------------|----------------|----------------|
| Background | `#layer-shell-bg` | 最低；裝飾 / 粒子 / 星空 | `none`（除非明確開互動） |
| ScrollContent | `#layer-shell-scroll` | 主內容滾動區 | `auto` |
| Foreground | `#layer-shell-frame` | HUD 外框 + 頭像視窗 + 底部 Dock 外框 | 外框容器 `none`，按鈕/導覽 `auto` |

### 3.1 頭像與底部導覽「同一外框」

**意圖**：頭像 HUD 槽與底部導覽 **視覺上屬同一 Magitek / 終端機框架**（reference-app Crown + Pedestal 的拆分方式），而非「頭像漂浮 + nav 獨立條」。

**契約（Phase 1 實作時遵守）**

- Foreground **單一根節點**包 `HudRegion`（含頭像 portal）與 `DockRegion`（含底部 nav），共用邊框/切面/發光語言（token 來自 lbj + `tailwind.config.ts`）。
- ScrollContent **不得**直接 `position: fixed` 蓋住 Dock 命中區；底部預留 `padding-bottom` = **Dock 高度 + safe-area**（見 §5）。

### 3.2 與業務規則的邊界

- **Leaderboard**：僅 Pro 可走遠端；Shell **不發** Firestore，只做入口與 upgrade 引導（既有 entitlement 邏輯）。
- **Local-first**：評測/歷史/雷達等路由在無 Pro 時仍可進入 Shell 與本地頁（與 Phase 0 nav 中 `guestRestricted` 無衝突時）。

## 4. 底部導覽 — 資訊架構（對齊 fitness）

資料 **單一來源**：`src/config/nav.config.ts` 之 `NAV_ITEMS`。

順序與路由與 fitness 底部列一致（Phase 1 再接 `react-router`）：

| order | key | path（初稿） | guestRestricted（= fitness guestBlock） | 備註 |
|-------|-----|----------------|----------------------------------------|------|
| 1 | `community` | `/community` | ✅ | Phase 1：未登入可走 Join / 占位或擋 —
| 2 | `home` | `/user-info` | ❌ | fitness：`home` 有智慧首頁邏輯 → Phase 1 對照 `landing` vs `home` |
| 3 | `assessment` | `/skill-tree` | ❌ | fitness：key 為 assessment，路徑為 skill-tree |
| 4 | `ladder` | `/ladder` | ✅ | **Pro**：需 entitlement；Phase 1 只做路由 + gate |
| 5 | `history` | `/history` | ✅ | Phase 1：對應本地 history（Core 可得）時需調整規則 — **規格待定** |
| 6 | `tools` | `/training-tools` | ❌ |

**待定項（標記在 nav.config）：**

- **history**：產品規則為「個人詳細歷史不鎖 Pro」時，上架後應將 `guestRestricted` / 登入規則與 entitlement 對齊，而非沿用 fitness 之「訪客 modal」。
- **home**：若 `up-final` 首頁為 `/` 而非 `/user-info`，Phase 1 將 `path` 與預設 redirect 統一更新本表與 config。

## 5. Safe area 與底部間距（對齊 lbj）

沿用 `lbj-goat-meter` `index.css` 之語意（Phase 1 抽到 `styles.css` 或 `@layer base`）：

- `--safe-bottom`、`--safe-top`（或 Tailwind arbitrary + `pb-[calc(...)]`）。
- ScrollContent **底部留白** ≥ **固定 BottomNav/Dock 高度 + `env(safe-area-inset-bottom)`**，避免滾動內容被截切。

fitness BottomNavBar 參考高度：**64px + safe-area**（見該元件 inline 註解）。

## 6. 美術語言（Terminal + GOAT）

**底色**：`#050505` ~ 純黑（既有 `tailwind` `bg-bg-base`）。

**對齊 lbj**（可在 Phase 1 將下列映射進 `tailwind.config.ts` extend）：

| Token / 用途 | 參考值（lbj `:root`） |
|----------------|----------------------|
| 王者金（強調） | `#D4AF37` → `accent.primary` 可並存橘金 `#ff8c00` 於「競技按鈕」 |
| 霧銀文字 | `#E0E0E0` |
| 戰術綠（可選狀態） | `#00E676` |

**質感**：`backdrop-blur`、`border-zinc-800`、`shadow-panel`（已定義部分）；終端機外框可加 **細邊框發光**（Phase 1，不做誇張動效）。

## 7. i18n

導覽標籤 **禁止硬編碼**：使用 `common` namespace 下 `navbar.*`，與 `nav.config.ts` 之 `labelKey` 對齊。

## 8. Phase 1 接續檢查清單（由本文件衍生）

- [ ] 新增 `react-router-dom`，路由表與 `NAV_ITEMS.path` 一致。
- [ ] 實作 `AppShell`（三層 + HudRegion + DockRegion）。
- [ ] `BottomNav` 讀取 `NAV_ITEMS`，active 態依 `location.pathname`。
- [ ] `guestRestricted` → 對應 store/service（登入態）或訪客引導 modal（細節對齊產品）。
- [ ] Leaderboard route：`canAccessLeaderboard` 再走遠端；否則 JoinArena。

## 9. 文件與程式對照

| 產物 | 路徑 |
|------|------|
| Phase 0 規格（本文件） | `docs/PHASE0_SHELL_SPEC.md` |
| 導覽草稿（SSOT） | `src/config/nav.config.ts` |
| 全域路徑常數 | `src/config/routes.ts`（`react-router` 已接） |
| AppShell 骨架（三層 + HUD/Dock 占位） | `src/components/layout/AppShell.tsx` |
| 文案鍵（en） | `src/i18n/locales/en/common.json` → `navbar.*` |

---

**版本**：Phase 0 初稿；待定項於 Phase 1 開始前 review 一次即可凍結 v1。
