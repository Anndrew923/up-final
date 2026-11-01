# 最強肉體（Ultimate Physique）— 評測以外功能圖鑑（Non-Assessment Feature Codex）

- **產品**：最強肉體（Ultimate Physique）
- **工作區**：`up-final`
- **版本時間戳**：2026-10-26（Asia/Taipei）
- **SSOT 層**：本文件對齊現況代碼（`src/config/routes.ts`、`src/config/nav.config.ts`、`src/logic/core/ladderShards.ts`、`src/i18n/locales/zh-Hant/common/*`）
- **聲明**：**本文件僅包含評測以外現況已上線功能。** 不展開六軸評測演算法、常模矩陣、DOTS／Cooper／FFMI／SMM／握力公式（該層見 `docs/UP_CORE_SPEC_SSOT.md`）。評測頁本身（力量／爆發／Cooper／FFMI／SMM／握力）不作為功能主體；但掛在評測頁上的 **名人堂光譜、突破儀式入口、Dyno Intel CTA** 屬玩法層，仍收入本圖鑑。

---

## 0. 導航骨架（全 App 入口）

底部五 Tab 為產品主航線。標籤來自 `navbar.*`（`src/i18n/locales/zh-Hant/common/core.json`）。

| Tab key | 官方中文 | HUD code | 路由 | `guestRestricted` | 本圖鑑角色 |
|---|---|---|---|---|---|
| `home` | 主控 | `CONSOLE` | `/user-info` | false | 雷達艙、Homologation 診斷、身體資料、天梯身份、PRO 卡 |
| `tools` | 整備 | `GARAGE` | `/training-tools` | false | 俱樂部入口、計算器、圖鑑、雲端同步 |
| `assessment` | 測功 | `DYNO` | `/skill-tree` | false | **評測大廳（本文件不展開測項）**；名人堂／Dyno CTA 例外收入 |
| `ladder` | 天梯 | `RANK` | `/ladder` | true（需登入／Pro 或創世席） | 全球天梯、篩選、PK、同步 |
| `history` | 日誌 | `LOGS` | `/history` | false | 測功日誌、節奏熱圖、機體銘牌 |

**非 Tab 但屬評測以外系統面的路由：**

| 功能 | 路由常數 | 路徑 |
|---|---|---|
| 身份選擇 | `ROUTES.authChoice` | `/auth-choice` |
| 設定／控制中心 | `ROUTES.settings` | `/settings` |
| 關於 | `ROUTES.about` | `/about` |
| 聯絡我們 | `ROUTES.contact` | `/contact` |
| 隱私權政策 | `ROUTES.privacyPolicy` | `/privacy-policy` |
| 加入戰場（Pro 漏斗） | `ROUTES.joinArena` | `/join-arena` |
| 俱樂部 HQ | `ROUTES.crew` | `/crew` |
| 1RM 計算機 | `ROUTES.oneRmCalculator` | `/tools/one-rm` |
| 槓片計算器 | `ROUTES.plateCalculator` | `/tools/plates` |
| 人體幾何星圖 | `ROUTES.somatotypeLab` | `/tools/somatotype-lab` |
| 管理員平台 | `ROUTES.admin` | `/admin` |
| 天梯除錯 | `ROUTES.leaderboardDebug` | `/debug/leaderboard` |

**HUD 行為（`isHudBackRoutePath`）：** 五個主 Tab 不顯示左上返回；`/crew`、`/settings`、`/join-arena`、`/tools/one-rm`、`/tools/plates`、`/tools/somatotype-lab` 等子頁顯示 HUD 返回。Dyno Intel **不是獨立路由**，是全域 HUD 準星 overlay。

---

## 1. 天梯與榜單機制（Leaderboard / Shards）

### 1.1 全球天梯（即時天梯）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 全球天梯／即時天梯 |
| **i18n** | `ladder.kicker` = 「全球天梯」；`ladder.title` = 「即時天梯」；`ladder.liveSubtitle` = 「全球排名」 |
| **UI 位置** | 底部 Tab「天梯」 |
| **路由** | `/ladder`（`isLadderRoutePath` 亦涵蓋 `/ladder/*`） |
| **權限** | `useLeaderboardAccess`：未登入或無資格者 **在任何 Firestore 讀寫前** redirect 至 `/join-arena`。創世早鳥席可免 Pro 進天梯，仍不開 Dyno／Cloud。 |
| **核心互動** | 瀏覽全球排名 → 切戰場分區／細項 → 開細項篩選 → 點列開對手檔案 → 底部「⚡ 同步全球天梯」批次上傳。每分片每小時最多 **3** 次寫入（滾動一小時）。全量同步另有冷卻與 **每日 3 次** 上限。 |
| **影片亮點** | 暗色排行列表 + Pro 頭像環；浮動「子榜 #N／點擊跳到我的那一列」；同步閃電鈕；名次晉升橫幅「名次晉升 +Δ」。 |

**空態／錯誤文案：**

| key | 繁中 |
|---|---|
| `ladder.empty` | 此維度尚無資料 — 成為首位上傳者。 |
| `ladder.loadError` | 無法載入天梯榜單。請檢查網路連線或稍後再試。 |
| `ladder.anonymousName` | 匿名用戶 |
| `ladder.anonymousIdLabel` | 身份已隱藏 |
| `ladder.redirecting` | 正在導向加入戰場… |

**同步按鈕文案（`ladder.syncAll`）：**

| key | 繁中 |
|---|---|
| `button` | ⚡ 同步全球天梯 |
| `buttonGlobal` | ⚡ 同步全球 |
| `buttonGuild` | 🛡️ 同步俱樂部 |
| `buttonSetupIdentity` | ⚡ 設定天梯身份以登榜 |
| `busy` | 同步中… |
| `busyGuild` | 同步俱樂部中… |

**上傳限流文案（`ladder.upload`）：** 每個榜單分片每小時最多可上傳 `{{limit}}` 次；達限顯示重置時間。分數與雲端相同則不消耗次數（`resultUnchanged`）。

---

### 1.2 戰場分區、細項與 Firestore Shard

分區常數：`LADDER_DIVISION_IDS` = `FITNESS_LADDER_DIVISION_IDS` + `stats_grip`。

`FITNESS_LADDER_DIVISION_IDS` 順序：`ladderScore` → `stats_sbdTotal` → `stats_bodyFat` → `stats_cooper` → `stats_vertical` → `stats_ffmi` → `armSize`。

無細項下拉的分區使用 sentinel `LADDER_PROJECT_NONE = '__none__'`。

Firestore 路徑語意：`leaderboards/{shardId}/entries/{uid}`。寫入允許的 shard 集合為 `KNOWN_LEADERBOARD_SHARD_IDS`。

#### 1.2.1 分區 ↔ 細項 ↔ shard 對照表

| 分區 id | 官方 UI 標籤 | 官方 desc | 細項 value | 細項 UI（`ladder.project.*`） | Firestore `shardId` |
|---|---|---|---|---|---|
| `ladderScore` | 總戰力 | 綜合天梯分 | （無；`__none__`） | — | `ladderScore` |
| `stats_sbdTotal` | 力量 | 三項／五項／單項 — 選細項 | `total_five` | 五項均分（分數） | `strength_totalFive` |
| `stats_sbdTotal` | 力量 | （同上） | `total`（預設） | 三項 1RM 總和（公斤） | `strength` |
| `stats_sbdTotal` | 力量 | （同上） | `squat` | 槓鈴深蹲 | `strength_squat` |
| `stats_sbdTotal` | 力量 | （同上） | `bench` | 自由重量平板臥推 | `strength_bench` |
| `stats_sbdTotal` | 力量 | （同上） | `deadlift` | 硬舉 (傳統／相撲) | `strength_deadlift` |
| `stats_sbdTotal` | 力量 | （同上） | `ohp` | 肩推 | `strength_ohp` |
| `stats_sbdTotal` | 力量 | （同上） | `latPull` | 滑輪下拉 | `strength_latPull` |
| `stats_bodyFat` | FFMI | FFMI 榜（依天梯分排序） | `ffmi`（預設） | FFMI | `bodyFat_ffmi` |
| `stats_cooper` | 心肺 | Cooper／5 公里 | `cooper`（預設） | Cooper 12 分鐘 | `cardio` |
| `stats_cooper` | 心肺 | （同上） | `5km` | 5 公里 | `cardio_5km` |
| `stats_vertical` | 爆發力 | 綜合榜與垂直跳、立定跳遠、短跑細項（皆依天梯分） | `composite`（預設） | 爆發綜合 | `explosive_composite` |
| `stats_vertical` | 爆發力 | （同上） | `vertical` | 垂直跳 | `explosive_vertical` |
| `stats_vertical` | 爆發力 | （同上） | `broad` | 立定跳遠 | `explosive_broad` |
| `stats_vertical` | 爆發力 | （同上） | `sprint` | 短跑 | `explosive_sprint` |
| `stats_ffmi` | 肌肉量 | SMM 分數／kg／占比 | `score`（預設） | 骨骼肌分數 | `muscleMass` |
| `stats_ffmi` | 肌肉量 | （同上） | `weight` | 骨骼肌重量（kg） | `muscleMass_weightKg` |
| `stats_ffmi` | 肌肉量 | （同上） | `ratio` | 骨骼肌率（體重占比） | `muscleMass_ratio` |
| `armSize` | 臂圍 | PAS 臂圍榜 | （無；`__none__`） | — | `armSize` |
| `stats_grip` | 握力 | 握力榜（本 App 擴充） | `grip`（預設） | 握力 | `gripStrength` |

#### 1.2.2 `KNOWN_LEADERBOARD_SHARD_IDS` 完整枚舉

```
ladderScore
strength
strength_totalFive
strength_squat
strength_bench
strength_deadlift
strength_ohp
strength_latPull
cardio
cardio_5km
explosivePower
explosive_composite
explosive_vertical
explosive_broad
explosive_sprint
bodyFat
bodyFat_ffmi
muscleMass
muscleMass_weightKg
muscleMass_ratio
gripStrength
armSize
```

說明：

- `explosivePower`、`bodyFat` 為 **legacy shard id**（仍在允許寫入集合）；現況 UI 爆發綜合走 `explosive_composite`，FFMI 走 `bodyFat_ffmi`。
- `strength` shard 排序單位是 **深蹲＋臥推＋硬舉估計 1RM 公斤總和**（UI：`ladder.rowScoreStrengthKg` = `{{kg}} 公斤`），不是雷達分數。
- `strength_totalFive` 為五項均分（分數，兩位小數）。
- 跨群體 PK 使用 **人口學校準後分數**（SBD 公斤總和那條除外）。
- 臂圍／5 km／百米為 **專項榜**，不進六軸雷達與 `calculateSixAxisOverall`。

**列分數格式（`formatLeaderboardRowScore`）：** `strength` → 公斤一位小數；`strength_totalFive` → 兩位小數；其餘 → `String(scoreBest)`。

---

### 1.3 細項篩選桶（Ladder Filter Sheet）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 細項篩選 |
| **i18n** | `ladder.filters.title`；開啟 `ladder.moreFilters`「更多篩選」；收合 `ladder.hideFilters`「收合篩選」 |
| **UI 位置** | `/ladder` 浮動篩選膠囊 `LadderFloatingFilterPill` → `LadderFilterSheet` |
| **核心互動** | 疊加篩選後看「同儕子榜」。未選國家時，城市／行政區過濾被忽略（`normalizeLocationFiltersForLadderDataset` 強制 `all`）。標籤來自主控「天梯細分標籤」；未雲端同步時 sheet 提示先同步。套用後膠囊顯示「已選 {{count}} 項」（`ladder.activeFilterCount`）。 |
| **影片亮點** | 多層 sheet 滾輪；套用後膠囊計數；浮動排名從全球 # 切成「子榜 #」。 |

#### 1.3.1 篩選欄位與枚舉

| UI 標籤 | 型別／id | 選項（官方文案） |
|---|---|---|
| 性別 | `gender`：`male` \| `female` \| `all` | 男／女／全部（身體資料：`home.profile.male`／`female`） |
| 年齡區間 | `LadderAgeBucket` | `under-20` 未滿 20 歲；`20-29` 20～29 歲；`30-39` 30～39 歲；`40-49` 40～49 歲；`50-59` 50～59 歲；`60-69` 60～69 歲；`70+` 70 歲以上 |
| 身高區間 | `LadderHeightBucket` | `<160` 160 cm 以下；`160-170` 160～170 cm；`170-180` 170～180 cm；`180-190` 180～190 cm；`>190` 190 cm 以上 |
| 體重級距 | `LadderWeightBucket` | `under-50kg` 50 kg 以下；`50-60kg`；`60-70kg`；`70-80kg`；`80-90kg`；`90-100kg`；`100-110kg`；`110kg+` 110 kg 以上 |
| 職業分類 | `LadderJobCategory` | `engineering` 工程；`medical` 醫療；`coach` 教練；`student` 學生；`police_military` 警察 / 軍職；`business` 商務；`freelance` 自由業；`service` 服務業；`professional_athlete` 職業運動員；`artist_performer` 藝文 / 表演；`other` 其他 |
| 國家／地區 | `LadderCountryCode` | `TW` 台灣；`CN` 中國；`US` 美國；`JP` 日本；`KR` 韓國；`SG` 新加坡；`MY` 馬來西亞；`HK` 香港；`MO` 澳門；`TH` 泰國；`VN` 越南；`PH` 菲律賓；`ID` 印尼；`AU` 澳洲；`NZ` 紐西蘭；`CA` 加拿大；`GB` 英國；`DE` 德國；`FR` 法國；`OTHER` 其他 |
| 城市 | `city` | 依所選國家從當前榜單列衍生；`all` = 全部 |
| 行政區 | `district` | 依國家＋城市衍生；台灣需對應有效城市／區 |

Sheet 標題：`ladder.filters.filterSheetTitles.*`（選擇性別／年齡區間／身高區間／體重級距／職業分類／國家／地區／城市／行政區）。

套用／清除：`ladder.filters.apply`「套用篩選」；`ladder.filters.clear`「清除篩選」；`ladder.filters.all`「全部」。

浮動自己列：`ladder.floatingRank.filteredRankShort`「子榜 #{{rank}}」；`notRankedUnderFilters`「目前篩選條件下未入榜」；`cta`「點擊跳到我的那一列」。

---

### 1.4 匿名、天梯身份名片、對手預覽與戰力切磋

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 天梯身份（暱稱與頭像）；匿名「在天梯中隱藏身份（匿名）」；用戶資訊／戰力切磋 |
| **設定位置** | 身份：`/user-info` 區塊 `home.ladderIdentity`（kicker「天梯身份」、title「暱稱與頭像」）。匿名：`/user-info` 身體資料 → 天梯細分標籤，`home.profile.isAnonymousInLadder`。 |
| **預覽位置** | `/ladder` 點列 → `LadderUserPreviewModal` |
| **核心互動** | 顯示名稱必填（最多 20 字）、頭像選填（無圖用姓名首字母）。勾匿名後榜上顯示「匿名用戶」，對方預覽 **不顯示六軸雷達**（`radarHiddenAnonymous`）。點對手開用戶檔案：六軸雷達、有資料軸數、六軸平均、榜單登記分／本榜登記分。可開「戰力切磋」疊自己的雷達。可封鎖／檢舉（不當暱稱、頭像、兩者）。 |
| **影片亮點** | Pro 金環頭像；匿名遮罩；雙雷達掃描「DIAGNOSING MODELS」；VS 橫幅與戰報數字。 |

**身份表單（`home.ladderIdentity`）：**

| key | 繁中 |
|---|---|
| `displayName` | 顯示名稱 |
| `displayNameHint` | 最多 {{max}} 字。 |
| `pickAvatar` | 選擇圖片 |
| `removeAvatar` | 移除圖片 |
| `save` | 儲存天梯身份 |
| `errorEmptyName` | 請輸入顯示名稱。 |
| `errorProfanity` | 此暱稱違反戰場守則，請更換後再儲存。 |
| `collapsedEmpty` | 尚未設定顯示名稱 |

同步身份 sheet：`ladder.syncAll.identitySheetTitle`「設定天梯身份」；body「這是你在全球天梯上的戰場分身。顯示名稱必填；大頭照可稍後再補。」

**用戶預覽（`ladder.userPreview`）：**

| key | 繁中 |
|---|---|
| `kicker` | 用戶檔案 |
| `title` | 用戶資訊 |
| `radarAria` | 用戶六軸雷達圖 |
| `radarHiddenAnonymous` | 此用戶在天梯選擇隱藏身分，不顯示雷達分數。 |
| `radarCompletion` | 有資料的軸：{{count}} / {{total}} |
| `overallAverage` | 六軸平均 |
| `listedOverallScore` | 榜單登記分 |
| `listedShardScore` | 本榜登記分 |
| `pkToggle.enable` | 戰力切磋 |
| `pkToggle.disable` | 結束切磋 |
| `pkToggle.scanning` | 提取戰力中... |
| `pkScan.kicker` | DIAGNOSING MODELS |
| `pkScan.status` | 比對六軸幾何模型… |
| `battleBanner.vs` | VS |

戰報（`battleReport`）：

| id | 文案 |
|---|---|
| `dominance` | {{wins}} 勝 {{losses}} 敗 · 戰力壓制 ({{delta}}) |
| `lead` | {{wins}} 勝 {{losses}} 敗 · 略佔上風 ({{delta}}) |
| `even` | {{wins}} 勝 {{losses}} 敗 · 旗鼓相當 |
| `trailing` | {{wins}} 勝 {{losses}} 敗 · 奮力追趕 ({{delta}}) |

檢舉類型 enum：`nickname` 不當暱稱；`avatar` 不當頭像；`both` 暱稱與頭像。

---

### 1.5 創世早鳥席位（Genesis Early Bird）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 創世天梯專案：早鳥席位 |
| **i18n kicker** | 創世專案 · 早鳥席位 |
| **UI 位置** | 進入 `/ladder` 時 `LadderGenesisEarlyBirdModal`；主控 `HomeProFeatureCard` 提醒早鳥 **不解鎖** Dyno／Cloud |
| **核心互動** | 前 **2000** 席（`genesisSeatNumber` 1–2000）終身免 Pro 進入全球天梯。Dyno Intel 與雲端備份仍要 Pro。`isGenesisEarlyBird` 與 Pro billing 獨立。 |
| **影片亮點** | 閃電早鳥卡；席次 `NO. {{seat}}`；額滿倒數文案。 |

| key | 繁中 |
|---|---|
| `title` | ⚡ 創世天梯專案：早鳥席位卡位中 |
| `pioneerBadge` | ✦ 創始先鋒 · 終身天梯免費 |
| `pioneerBadgeWithSeat` | ✦ 創始先鋒 · NO. {{seat}} · 終身天梯免費 |
| `enterCta` | 進入天梯（開始參戰） |
| `proNote` | 註：DYNO INTEL 智慧分析等 Pro 功能仍需訂閱。 |
| `stageEnded` | 創始席位已額滿 · 天梯恢復為 PRO 專屬（先鋒終身通行仍有效） |

主控 PRO 卡：`home.proFeatureCard.body`「天梯早鳥席位不解鎖以下功能 — 升級 PRO 即可全開。」

---

### 1.6 俱樂部私榜（Club / Crew HQ）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 俱樂部（CLUB） |
| **UI 位置** | 整備 `/training-tools` 最上張 `CrewHqCard` → `/crew`（非 compact shell；HUD 返回整備） |
| **儲存** | Firestore `guilds/{guildId}`；成員上限 `GUILD_MAX_MEMBERS = 30`；角色 `GuildRole = 'coach' \| 'member'` |
| **核心互動** | 建立（名稱 2–24 字 + tag 2–4 碼）或輸入邀請碼加入。私榜依總分或六軸排序；點成員看雷達、可戰力切磋（文案與全球 PK 同構）。教練開 `CoachManageDrawer`。同步用天梯列「🛡️ 同步俱樂部」，與全球批次分開。退出需重新輸入邀請碼。 |
| **影片亮點** | 邀請碼複製；成員排行「你」浮動條；私榜 PK。 |

| key | 繁中 |
|---|---|
| `crew.hq.title` | 俱樂部 |
| `crew.hq.code` | CLUB |
| `crew.page.kicker` | CLUB |
| `crew.page.title` | 俱樂部 |
| `crew.empty.joinTitle` | 加入俱樂部 |
| `crew.empty.createTitle` | 建立俱樂部 |
| `crew.ladder.title` | 成員排行 |
| `crew.ladder.you` | 你 |
| `crew.ladder.dimOverall` | 總分 |

Club 維度 enum（`ClubLadderDimension`）：`'overall' | SixAxisMetric`（`strength`／`explosivePower`／`cardio`／`muscleMass`／`bodyFat`／`gripStrength`）。缺軸排序置底、UI 顯示「—」，不coerce 為 0。

私榜分數來源：`GuildMemberSnapshot.ladderScore`（總分）與可選 `radarScores?: Partial<Record<SixAxisMetric, number>>`。

---

### 1.7 天梯列資料契約（LeaderboardEntry）

```ts
export interface LeaderboardEntry extends Partial<LadderProfileProjection> {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  scoreBest: number;
  updatedAt: string;
  rank?: number;
  isPro?: boolean;
}
```

快取：session + disk `up:leaderboard-cache:v2:`；列表 TTL 120s；篩選 catalog TTL 12 分鐘 + SWR。非 Pro／訪客 **零 Firestore 天梯流量**。

---

## 2. 賽車認證與原型系統（Homologation & Vehicle Class）

### 2.1 賽會認證評等（14 階 Homologation Grade）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | HOMOLOGATION GRADE // 賽會認證評等 |
| **i18n** | `home.overallGrade.kicker`；指數名體能視圖「綜合戰力指數」、遙測視圖「整車性能指數」 |
| **UI 位置** | `/user-info` 雷達卡「執行全規格診斷」→ `HomeResonanceOverlay`；報告含認證名、結構代號、參考身價 |
| **分數來源** | `calculateSixAxisOverall`：六軸等權平均，缺軸當 0，`armSize` 不進。帶判定 `OVERALL_GRADE_TIERS`／`resolveOverallGradeBand`。 |
| **核心互動** | 點診斷 CTA → 四段儀式 → 揭示 14 階之一。點認證可展開敘事（`viewDetailHint`「點擊查看賽會認證詳情描述」）。 |
| **影片亮點** | 通電四段：底盤通電中… → 六軸充能中… → 性能指數校準中… → 賽會認證輸出；滾分如 `95.78`；結構代號＋身價兩行。 |

**儀式 phase enum（`HomeResonancePhase`）：** `'idle' | 'boot' | 'charge' | 'count' | 'reveal' | 'report'`。

對應文案 `home.resonance.phase`：

| phase | 繁中 |
|---|---|
| `boot` | 底盤通電中… |
| `charge` | 六軸充能中… |
| `count` | 性能指數校準中… |
| `reveal` | 賽會認證輸出 |

覆蓋層 kicker：`性能儀表同步 / SPEC READOUT`；報告標題：`全域性能規格報告`。

**沒有**名為「黃金認證」的獨立 enum。14 階即 Homologation。

#### 2.1.1 14 階完整表（`OVERALL_GRADE_BAND_IDS`）

| `OverallGradeBandId` | 分數區間 | 官方 name | 結構代號 `representativeCar` | 參考身價 `carPrice` |
|---|---|---|---|---|
| `BASE` | 0–39.99 | STOCK COMMUTER 原廠常規街車 | STOCK ‧ 原廠初始素車 | 100 萬內代步級 |
| `TIER_40` | 40–49.99 | STREET MODIFIED 街道初階改裝 | STOCK ‧ 原廠初始素車 (街道精調) | 200 萬級街道鋼砲 |
| `TIER_50` | 50–59.99 | STAGE 1 TUNE 進階一階調校 | Inline-4 Turbo ‧ 街道前驅鋼砲 (原廠態) | 250 萬級進階一階 |
| `TIER_60` | 60–69.99 | CLUB TRACK SPEC 俱樂部賽道版 | Inline-4 Turbo ‧ 街道前驅鋼砲 (Stage 1) | 300 萬級四驅底盤 |
| `TIER_70` | 70–79.99 | TRACKDAY ENTHUSIAST 週末熱道挑戰 | Mid-Engine ‧ 幾何流線完全體 (街道態) | 400 萬級後驅跑車 |
| `TIER_80` | 80–89.99 | AMATEUR TIME ATTACK 業餘挑戰組 | Mid-Engine ‧ 幾何流線完全體 (賽道態) | 450 萬級雙門轎跑 |
| `TIER_90` | 90–99.99 | UNLIMITED ATTACK 極限計時賽規 | **Flat-6 NA ‧ 賽道高轉剛性軸 (Club)** | 600 萬級中置運動旗艦 |
| `TIER_100` | 100–109.99 | REGIONAL CHAMPIONSHIP 地區錦標賽規 | **Flat-6 NA ‧ 賽道高轉剛性軸 (Championship)** | 1,500 萬級自然進氣天花板 |
| `TIER_110` | 110–119.99 | STAGE 2 COMPETITION 精銳國際錦標 | V8-TwinTurbo ‧ Stage 2 重裝超壓 | 2,500 萬級精銳賽車缸體 |
| `TIER_120` | 120–129.99 | PRO ENDURANCE SPEC 職業耐力賽規 | V8-TwinTurbo ‧ Stage 2 重裝超壓 (Endurance) | 4,500 萬級職業殿堂 |
| `TIER_130` | 130–139.99 | FACTORY PROTOTYPE 原型工廠賽車 | V8-TwinTurbo ‧ Stage 3 賽道魔王 | 億級工廠尖端科技 |
| `TIER_140` | 140–149.99 | STAGE 3 APEX 頂級超驗載具 | V8-TwinTurbo ‧ Stage 3 賽道魔王 (Apex) | 1.5 億級頂級神獸 |
| `LEGEND` | 150–179.99 | LEGENDARY MONSTER 傳奇改裝怪獸 | PANTHEON ‧ 終極星艦概念體 (Legend) | 3 億以上傳奇不朽結晶 |
| `PANTHEON` | ≥180 | PANTHEON EXPERIMENTAL 萬神殿實驗車 | PANTHEON ‧ 終極星艦概念體 | 無價 // 萬神殿歸檔 |

欄位標籤：`carSpecLabel`「結構代號」；`priceLabel`「參考身價」。

hp／Nm／Bar／排量 **不是**由分數線性換算的物理量，而是 **帶文案對照表**（`scoreMeaning.bands.*`）。

---

### 2.2 車系原型（Vehicle Class / 適格者相性代號）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 適格者相性代號；區塊 kicker `Racing Spec Identity` |
| **判定函式** | `resolveVehicleClass`（`src/logic/core/vehicleResolver.ts`） |
| **UI 位置** | 同上診斷覆蓋層；文案 `identity.archetypes.*` |
| **核心互動** | 系統讀六軸形狀，**不改變 overall 分數**。σ&lt;10 且平均&gt;50 → `GT_CRUISER`；否則取最高軸對應原型。性別插入 `identity.genderGroup.male`「男性適格者」／`female`「女性適格者」。 |
| **影片亮點** | 「序列代號：鋼鐵底盤 (G-Platform)」標題＋適格者一句話。 |

**`VehicleClassId` 枚舉與規則：**

| `VehicleClassId` | 觸發 | 官方 title | 官方 summary 要旨 |
|---|---|---|---|
| `GT_CRUISER` | σ&lt;10 且 μ&gt;50 | 序列代號：全域巡航 (Grand Tourer) | 六項均衡，全頻譜解鎖 |
| `G_PLATFORM` | 最高軸 `strength` | 序列代號：鋼鐵底盤 (G-Platform) | 力量突出，重型載具馬力 |
| `HIGH_OUTPUT` | 最高軸 `explosivePower` | 序列代號：強力後燃 (High-Output) | 爆發突出，彈射起步 |
| `ENDURANCE_PROTO` | 最高軸 `cardio` | 序列代號：耐力原案 (Endurance-P) | 心肺突出，24h 耐力賽穩定 |
| `WIDE_BODY` | 最高軸 `muscleMass` | 序列代號：寬體架構 (Wide-Body) | 肌肉量突出，下壓力／密度 |
| `AERO_SPEC` | 最高軸 `bodyFat`（FFMI） | 序列代號：氣動優化 (Aero-Spec) | FFMI 突出，推重比／低阻 |
| `MR_SPEC` | 最高軸 `gripStrength`（fallback） | 序列代號：中置重心 (MR-Spec) | 握力突出，抓地／轉向 |

診斷 CTA：`home.diagnostics.kicker`「適格者相性代號」；`panelTitle`「執行全規格診斷」；`cta`「執行全規格診斷」；`archetypeHint`「依六維性能圖譜推算的載具適格檔案。」

---

### 2.3 分軸 Telemetry 映射（體能／遙測雙視圖）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 主控台切換「體能／遙測」 |
| **UI 位置** | `/user-info` `HomeRadarBoard` → `ConsoleAxisViewToggle`；單軸分數意義在評測頁級距徽章與圖鑑 |
| **核心互動** | 同一顆雷達切標籤。體能＝力量／爆發／心肺／肌肉量／FFMI／握力。遙測＝馬力／扭矩／續航／車體外觀／引擎排量／抓地。overall 標籤：體能「綜合戰力指數」、遙測「整車性能指數」。 |
| **影片亮點** | 切換瞬間頂點文字與兩欄 HUD 改寫；S 湧浪 sheen（`ConsoleSheenLayer`）。 |

**軸標籤對照（`home.radar`）：**

| `SixAxisMetric` | 體能 `axisChart` | 遙測 `axis` | scoreMeaning 頻譜 |
|---|---|---|---|
| `strength` | 力量 | 馬力 | 馬力頻譜 (HP) |
| `explosivePower` | 爆發力 | 扭矩 | 扭矩頻譜 (TRQ) |
| `cardio` | 心肺 | 續航 | 續航頻譜 (STINT) |
| `muscleMass` | 肌肉量 | 車體外觀 | 車體外觀頻譜 (CHSS) |
| `bodyFat` | FFMI | 引擎排量 | 引擎排量頻譜 (P2W) |
| `gripStrength` | 握力 | 抓地 | 抓地頻譜 (GRIP) |

天梯 metrics 短標（`ladder.metrics`）：馬力／扭矩／續航／車體外觀／引擎排量／抓地／臂圍。

#### 2.3.1 力量 → HP 帶文案（`scoreMeaning.bands.strength`）

| bandId | title |
|---|---|
| `BASE` | 10hp速克達 |
| `TIER_40` | 90hp家用車 |
| `TIER_50` | 140hp小房車 |
| `TIER_60` | 180hp性能鋼砲 |
| `TIER_70` | 250hp後驅小跑 |
| `TIER_80` | 350hp雙門跑車 |
| `TIER_90` | 430hp運動旗艦 |
| `TIER_100` | 550hp賽道剛性軸 |
| `TIER_110` | 680hp精銳工廠賽車 |
| `TIER_120` | 820hp耐力原型載具 |
| `TIER_130` | 1000hp千匹巨獸 |
| `TIER_140` | 1200hp火箭推進載具 |
| `LEGEND` | 1500hp地星資產 |
| `PANTHEON` | 萬神殿馬力 |

#### 2.3.2 爆發力 → Nm／TRQ

| bandId | title |
|---|---|
| `BASE` | 9Nm原廠街車扭矩 |
| `TIER_40` | 140Nm點火優化 |
| `TIER_50` | 210Nm輕量單質飛輪 |
| `TIER_60` | 320Nm一階內燃調校 |
| `TIER_70` | 400Nm階段性增壓 |
| `TIER_80` | 450Nm賽道彈射系統 |
| `TIER_90` | 600Nm機械增壓全域爆發 |
| `TIER_100` | 750Nm競賽級極限傳動 |
| `TIER_110` | 850Nm雙渦輪高壓灌注 |
| `TIER_120` | 950Nm原型車極限瞬態 |
| `TIER_130` | 1250Nm重型千匹油電綜效 |
| `TIER_140` | 1400Nm航空級瞬態幻影 |
| `LEGEND` | 宇航級火箭推進器 |
| `PANTHEON` | 萬神殿 |

#### 2.3.3 心肺／Cooper → Bar

BASE→PANTHEON：0.4 / 0.6 / 0.9 / 1.2 / 1.5 / 1.8 / 2.1 / 2.4 / 2.8 / 3.2 / 3.8 / 4.5 / 5.5 / 6.5 Bar。Cooper 文案強調 12 分鐘限時與 VO₂ **敘事**；分數仍是距離常模（見核心規格書）。

#### 2.3.4 FFMI → 排量（摘要鏈）

0.1L 迷你排量單缸 → 1.6L 四缸 → 1.5L 小排量鋼砲 → 2.0T → 3.0L 六缸 → 4.0T V8 → 6.2L V8 → 3.5T V6 賽道雙渦輪 → 4.0T V8 精銳 → 耐力原型動力源 → 5.0T V8 → 6.0T 航空 → 8.0L W16 → 萬神殿全極限排量。

#### 2.3.5 肌肉 → 車體空力／寬體（摘要鏈）

原廠素面外觀 → 基礎空力優化 → 運動化包圍 → 進階側裙 → 小寬體前葉子板 → GT 跑車專屬空力 → 競技級打孔寬體 → 高下壓力 GT 大尾翼 → 工廠賽車原廠寬體 → 耐力原型極低風阻外殼 → 千匹重裝碳纖維車體 → 全定制航天級寬體 → PANTHEON 一體化碳纖維骨架 → 萬神殿極致外裝神話。

#### 2.3.6 握力 → 輪胎（摘要鏈）

原廠節能窄胎 → 標準四季輪胎 → 街道升級胎款 → 高性能運動街胎 → 性能熱化跑胎 → 賽道級半熱熔胎 → 競技級熱熔極限胎 → Drag 直線加速專用胎 → 賽事專用光頭胎 → 耐力原型全天候貼地胎 → 加熱毯超溫全熱熔胎 → 液壓鉗級高黏性橡膠 → 地星資產級航天橡膠 → 萬神殿終極引力咬合。

**握力帶切點例外：** LEGEND = 150–159.99，PANTHEON ≥ 160（其餘軸 LEGEND 至 179.99、PANTHEON ≥ 180）。Aura 映射：BASE–50 `none`；60–70 `pulse`；80 `flow`；90–100 `shimmer`；110–120 `lightning`；130–140 `void_flame`；LEGEND+PANTHEON `divine_light`。

---

### 2.4 名人堂光譜（人類尺度階梯）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | {{axisTitle}} · 名人堂光譜 |
| **UI 位置** | 各評測頁級距徽章／「名人堂光譜 ➔」`HallOfFameSpectrumDrawer`；軸 id 含六軸 + `armSize` + `overall` |
| **核心互動** | 看自己落在 decade 0,40,…,150 哪一格與人口階級文案。名人錨點僅 **目前格且 decade ≥ 60** 顯示 1–2 名（穩定 slice，不 shuffle）。CTA「免費解碼生理成色」開 Dyno（顯示當日剩餘次數）。LEGEND 與 PANTHEON 在人類尺度都折到 decade `150`。 |
| **影片亮點** | pantheon 在上的階梯；目前格高亮；名人並肩一句。 |

Decade keys：`'0' | '40' | '50' | '60' | '70' | '80' | '90' | '100' | '110' | '120' | '130' | '140' | '150'`。

`HALL_OF_FAME_NAME_FLOOR_DECADE = 60`。

i18n：`assessment.hallSpectrum.title`「{{axisTitle}} · 名人堂光譜」；`teaserKicker`「DYNO INTEL 遙測」；`teaserLine`「拿掉感覺，用科學常模直面自我。」；`teaserCta`「免費解碼生理成色」。

---

### 2.5 載具全規格整備圖鑑（Vehicle Specification Codex）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | VEHICLE SPECIFICATION CODEX / 載具全規格整備圖鑑 |
| **UI 位置** | `/training-tools` 可展開 `DisclosurePanel` → `VehicleSpecificationCodex` |
| **核心互動** | 依目前分數標「目前載具設定」；分頁瀏覽全階規格（含 overall 與各軸／Cooper／5km／臂圍）。 |
| **影片亮點** | 分頁掃過 Flat-6、V8-TT、萬神殿；現況列高亮。 |

| Codex tab id | UI | systems 文案 |
|---|---|---|
| `overall` | OVERALL | 總合驅動性能 |
| `strength` | STRENGTH | 底盤推拉剛性極限 |
| `explosivePower` | EXPLOSIVE | 瞬時扭矩與推力爆發 |
| `gripStrength` | GRIP | 前軸咬合與抓地力 |
| `cooper` | CARDIO-12M | 瞬態進氣與排溫管理 |
| `fiveK` | CARDIO-5K | 巡航長時高熱效率 |
| `muscleMass` | MUSCLE MASS | 載具肌肉淨重噸位 |
| `bodyFat` | BODY FAT | 載具體脂排量設定 |
| `armSize` | ARM SIZE | 輪框大小與胎圈設定 |

`tools.codex.panelTitle`「載具全規格整備圖鑑」；`activeSetup`「目前載具設定」；`tierRange`「階層區間」。

---

## 3. AI 助教系統（Dyno Intel）

### 3.1 DYNO INTEL 智庫艙

| 欄位 | 內容 |
|---|---|
| **官方名稱** | DYNO INTEL |
| **觸發 aria** | 開啟 DYNO INTEL 智庫艙 |
| **角色定位** | 數據智庫／智慧分析官（歡迎詞：只解讀六軸遙測與級距解碼；**通用訓練百科不在服務範圍**） |
| **UI 位置** | **全域 HUD 準星**（非獨立路由）。Sheet 標題「DYNO INTEL」 |
| **核心互動** | 點準星開底 sheet → 輸入診斷或點捷徑。回覆帶級距卡、弱軸／動量／高階收束句。可展開本機「歷史遙測日誌」。 |
| **影片亮點** | 準星 morph「INTEL: ONLINE／SCANNING／CORE_MAX」；首次「點擊通電」callout「💡 AI 戰情點評」；打字機歡迎；「遙測解碼中…」。 |

**歡迎四行（`dynoIntel.welcomeIntroduction`）：**

1. 歡迎來到主控艙。我是你的 **DYNO INTEL 數據智庫**。
2. 已全量同步你的各項指標，
3. 請直接輸入診斷問題，發動 **全規格分析**。
4. 僅解讀六軸遙測與你的級距解碼；通用訓練百科不在服務範圍內。

**引導捷徑（`dynoIntel.suggestions`）：**

| id | label | query |
|---|---|---|
| `overall` | 我的總分表現點評 | 我的總分表現點評 |
| `axis` | 最弱軸向實力解析 | 我的{{axisLabel}}表現點評 |
| `methodology` | 科學計分公式說明 | 科學計分公式說明 |

輸入 placeholder：「輸入診斷問題…」；送出「發送」；關閉「關閉」。

**意圖枚舉 `DynoQuestionIntent`：** `'methodology' | 'progress' | 'status' | 'general' | 'coaching'`。

**模式枚舉 `DynoIntelMode`：** `'single-axis' | 'cross-axis' | 'weight-simulation'`。現況推理以 cross-axis 為主（v2.4.2）；weight-sim 僅 Pro。

**Console 標籤（依路由，`dynoIntel.console`）：**

| 路由情境 | consoleLabelKey | UI |
|---|---|---|
| `/user-info` | `home` | CONSOLE: HOME |
| `/skill-tree` | `lobby` | CONSOLE: LOBBY |
| `/ladder` | `arena` | CONSOLE: ARENA |
| `/history` | `history` | CONSOLE: HISTORY |
| `/training-tools` 與 `/tools/*` | `tools` | CONSOLE: TOOLS |
| `/strength` | `strength` | CONSOLE: STRENGTH |
| `/grip` | `grip` | CONSOLE: GRIP |
| `/ffmi` | `ffmi` | CONSOLE: FFMI |
| `/explosive` | `explosive` | CONSOLE: EXPLOSIVE |
| `/cardio` | `cardio` | CONSOLE: CARDIO |
| `/muscle` | `muscle` | CONSOLE: MUSCLE |
| `/arm-size` | `armSize` | CONSOLE: ARM |
| 其他 | `generic` | CONSOLE: DYNO |

額度列：`quotaLabel`「今日通電額度 {{remaining}}/{{limit}}」。

---

### 3.2 額度、權限與邊界

| 項目 | 現況代碼／文案 |
|---|---|
| 試用 | Core + Google 登入（非匿名）：**每日 2 次**，台北時間 00:00 重置 |
| Pro | **每日 30 次**；paywall 文案「15 倍算力」 |
| 體重模擬 | **僅 Pro**（`weight-simulation`）。預設模擬降 **8 kg** 重算力量 DOTS（`DYNO_WEIGHT_SIM_DEFAULT_DELTA_KG`）。AI 不得自編公斤。 |
| 本機日誌 cap | `DYNO_INTEL_LOCAL_LOG_CAP = 100`，FIFO 最新在前 |
| 阻擋 | 未登入；試用用盡／未 Pro；Pro 當日 30 次用盡；身體資料／雷達不完整；推理畸形；離題訓練百科 |
| Bypass | 僅 DEV／顯式 `VITE_DYNO_INTEL_BETA_FREE`；生產預設關閉。Client bypass **不能**單獨通過 Callable |

**Gate 文案（`dynoIntel.gate`）：**

| key | 繁中 |
|---|---|
| `authDescription` | DYNO INTEL 需要 Google 登入後才能通電遙測。 |
| `coreDescription` | Core 本機評測、雷達與歷史已隨下載解鎖；DYNO INTEL 為 Pro 頻道。 |
| `proDescription` | DYNO INTEL 為 Pro 專屬 — 智慧分析通電、全球天梯與雲端備份一次解鎖。 |
| `quotaDescription` | 今日通電額度已耗盡。額度於台北時間 00:00 重置，或確認 Pro 訂閱狀態。 |

**Paywall（`dynoIntel.paywall`）：**

| 狀態 | badge | title |
|---|---|---|
| `pro-required` | PRO 頻道待解鎖 | 解鎖智庫完全體：15倍算力大點火 |
| `quota-exhausted` | 今日免費額度已用盡 | 每日免費額度已熔斷 |

CTA：「⚡ 點火 Pro Pass (NT$ 30 / 月)」；價目「NT$ 30 / 月 ($1.00 USD)」。

Pro 三大核心（paywall features）：全球即時天梯；無限雲端護航；DYNO INTEL 智慧分析官。

**錯誤（節選）：**

| key | 繁中 |
|---|---|
| `invalidContext` | 診斷上下文不完整 — 請先在首頁完成雷達／身體資料後再試。 |
| `weightProfileMissing` | 請先在首頁完成身體資料，才能啟動體重模擬。 |
| `quotaExhaustedPro` | 今日 Pro 通電額度已用盡（30 次/日）— 請待台北時間 00:00 重置後再試。 |

`DynoIntelBlockReason`：`'auth' | 'pro-required' | 'pending'`。loading 期間不得誤開 paywall。

---

### 3.3 本機遙測日誌與收束句

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 歷史遙測日誌；sheet 內 `DYNO INTEL TELEMETRY`（本機診斷列，開發向） |
| **位置** | Dyno sheet 內；設定頁亦可「清除本機紀錄」 |
| **核心互動** | 看最近通電（聚焦軸／跨軸、時間）；展開／收合；清除不可復原。字幕「本機已封存 {{count}}/{{cap}} 則通電紀錄」。 |
| **影片亮點** | 不必當主鏡頭；可帶一句「每次解碼寫入本機主機」。 |

收束定位（產品邊界的旁白素材）：

- 預設：通電完成。這份遙測已寫入主機——下次再來，對照你自己的進步曲線。
- 方法論會 nudge 回評測頁看完整常模，而不是在聊天裡發明係數。
- 名人堂 CTA、評測突破後都灌進同一艙。短影音應拍「解碼器」而非私人教練。

`assessmentDeepDiveNudge`：「各評測頁面備有更完整的計分說明與常模解讀——請直接進入對應評測頁，展開說明區查閱全貌。」

---

## 4. 現場與輔助工具箱（Tools / GARAGE）

整備首頁：kicker `GARAGE`；title「整備基地」；路由 `/training-tools`。

頁面結構順序（現況）：`CrewHqCard` → 訓練計算器（1RM／槓片／人體幾何星圖）→ 載具全規格整備圖鑑 → `CloudSyncCard`。

---

### 4.1 1RM 計算機

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 1RM 計算機 |
| **結果 modal** | 1RM 預測報告／估算單次最大重量 |
| **路由** | `/tools/one-rm` |
| **核心互動** | 輸入重量＋次數；選公式：平均（推薦）／Epley／Brzycki／Lombardi；出估算 1RM 與 % 負荷對照（LOAD SPEC）。公／英制可切。**離線、不寫入雷達。** |
| **影片亮點** | 結果 modal「輸出負荷對照 // LOAD SPEC」百分比列。 |

| key | 繁中 |
|---|---|
| `tools.calculators.oneRm.kicker` | 力量工具 |
| `methodLabel` | 公式 |
| `methodSheetTitle` | 選擇 1RM 公式 |
| `methods.average` | 平均（推薦） |
| `resultLabel` | 估算 1RM |
| `calculate` | 計算 1RM |
| `hint` | 提示：次數越高通常誤差越大；若有低次數、接近力竭的組數，建議優先輸入該組。 |

---

### 4.2 槓片計算器

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 槓片計算器 |
| **結果 modal** | 槓片裝載藍圖／單邊槓片配置 |
| **路由** | `/tools/plates` |
| **核心互動** | 目標總重＋槓鈴重 → 每邊片數。湊不齊警告「每邊尚差 {{value}}」。**離線、不寫入雷達。** |
| **影片亮點** | 槓中心＋單邊片層視覺藍圖。 |

| key | 繁中 |
|---|---|
| `targetLabel` | 目標總重量（{{unit}}） |
| `barLabel` | 槓鈴重量（{{unit}}） |
| `perSideLabel` | 每邊目標重量 |
| `calculate` | 計算配重 |
| `resultModal.plates.barCenter` | 槓 |
| `resultModal.plates.perSideHeading` | 單邊裝載明細 |

---

### 4.3 人體幾何星圖（Somatotype Lab）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 人體幾何星圖（人體形態學實驗室） |
| **路由** | `/tools/somatotype-lab` |
| **核心互動** | 身高／體重／體脂／腕圍／用力臂圍＋性別 → Heath–Carter 簡化星圖與形態學報告、黃金比例標竿、傳奇防禦。HWR &lt; 35 或 &gt; 50 顯示非典型警告。完成可解鎖銘牌 `SOM-01`。**不進六軸雷達。** |
| **影片亮點** | 三角星圖；結構幾何代號；形態學報告 modal。 |

| key | 繁中 |
|---|---|
| `tools.somatotypeLab.kicker` | 人體形態學實驗室 |
| `tools.somatotypeLab.title` | 人體幾何星圖 |
| `entry.title` | 進入人體幾何星圖 |
| `physiqueTier.label` | 評測天賦標竿設定 |
| `report.kicker` | 形態學報告 |
| `report.title` | 人體幾何報告 |

底層說明（產品文案，非六軸分數）：希斯-卡特簡化；性別雙軌體脂錨點；傳奇體型防禦；BIA 水分波動 disclaimer。

---

### 4.4 雲端同步（Cloud Sync）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 雲端同步 |
| **UI 位置** | `/training-tools` 底部 `CloudSyncCard` |
| **權限** | **Pro 專屬**。需已登入 Google（不可匿名）。 |
| **核心互動** | 立即備份至雲端／從雲端還原。還原 **覆寫** 本機分數與測功日誌；測功節奏與銘牌與雲端 **合併**。有危險確認。 |
| **影片亮點** | 「雲端存檔 · 相對時間」；還原確認 kicker「危險操作」。 |

| key | 繁中 |
|---|---|
| `tools.syncTitle` | 雲端同步 |
| `tools.syncBackup` | 立即備份至雲端 |
| `tools.syncRestore` | 從雲端還原 |
| `tools.syncUpgrade` | 升級 PRO |
| `tools.sync.status.locked` | 雲端存檔為 PRO 專屬功能。升級後即可備份與還原。 |
| `tools.sync.restoreConfirmTitle` | 確定要從雲端還原？ |
| `tools.sync.footerHint` | ※ 還原將以雲端存檔覆蓋本機資料 |

主控 PRO 卡對應：`cloudTitle`「Cloud Sync」；`cloudBody`「跨裝置歷史評測與數據全量備份」。

---

### 4.5 整備頁其餘入口（交叉參照）

- 俱樂部：見 §1.6。
- 載具圖鑑：見 §2.5。

單位切換（全域工具／評測共用）：公制 (kg/cm)／英制 (lbs/in)。

---

## 5. 使用者與資料管理（Profile / History）

### 5.1 主控台雷達艙（性能儀表）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 主控台／性能儀表 |
| **路由** | `/user-info` 第一屏 `HomeRadarBoard` |
| **kicker** | `home.consoleKicker`「主控台」 |
| **核心互動** | 看六軸雷達、兩欄軸 HUD、體能／遙測切換、診斷儀式（§2.1）、卡內 `LeaderboardSyncAllBar`。雷達是評測結果的 **展示與共振**，不是再測一次。合併管線 `mergeScoreMapForHomeRadar` 以 persisted 輸入 + profile 重算力量／爆發／Cooper／肌肉／握力。 |
| **影片亮點** | 掃描格線；六邊形雷達；100 分外 overflow 外爆；滾分到認證。**第二支短影音開場錨點。** |

`home.radarOverview`「性能儀表」；`home.radarAria`「六維雷達圖」。

視覺：`RADAR_DISPLAY_MIN = 100`；overflow extra radius 最大 24px（√壓縮）。圖表尺固定 100，儲存分數仍可至 200。

即時規格列 `buildIdentityLiveSpecRows`：六軸各顯示當前 band title（與診斷報告共用，避免 i18n 漂移）。

---

### 5.2 身體基準與天梯名片

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 身體資料；天梯身份 |
| **路由** | `/user-info` 雷達與 PRO 卡下方（基準齊全後可收合） |
| **核心互動** | 必填：性別、年齡、身高、體重（`PHYSICAL_LIMITS`：年齡 13–90、身高 120–230 cm、體重 35–250 kg）。選填：職業、每週訓練時數、訓練年資、國家／城市／區、匿名。儲存後評測才能換算。身份見 §1.4。HUD 右上角頭像進 `/settings`。 |
| **影片亮點** | 收合摘要「{{gender}} · {{age}} 歲 · {{height}} · {{weight}}」；Pro 金環；匿名開關。 |

| key | 繁中 |
|---|---|
| `home.profile.kicker` | 身體基準 |
| `home.profile.title` | 身體資料 |
| `completeBadge` | 基準已齊。 |
| `incompleteHint` | 請補齊身體資料，之後評測才能從實測值換算分數。 |
| `advancedTitle` | 天梯細分標籤（選填） |
| `advancedCollapsedHint` | 有助於在排行榜上進行精準同儕篩選與比較 |
| `ladderTagsPillEmpty` | + 新增職業與地區 |
| `ladderTagsPrompt.title` | 補上天梯標籤 |

天梯進場也可能彈 `LadderTagsPromptSheet`（entry／filter-nudge 兩變體）。

**PRO 增值特權卡（`home.proFeatureCard`）：** kicker「✦ PRO 增值特權」；title「解鎖高算力與雲端能力」；Dyno Intel「AI 深度疲勞耐受與自體重量推演」；Cloud Sync「跨裝置歷史評測與數據全量備份」；CTA「升級 PRO 會員」→ `/join-arena`。已 Pro：`activeBadge`「PRO 已啟用」。

---

### 5.3 測功日誌與原始遙測

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 測功日誌 // DYNO LOGS |
| **kicker** | 本機日誌庫 |
| **路由** | `/history` |
| **權限** | **Core 本機**，不鎖 Pro |
| **核心互動** | 每次寫入雷達存 `LocalHistoryRecord`（六軸 `scores` + `overallScore` + 可選 `rawInputs`）。可刪（不可復原確認）。可展開「細項」看當時重量×次數、1RM、垂直跳、立定跳、100 m、Cooper 公尺、5 km、體脂、SMM、臂圍、握力峰值、身高體重快照。舊紀錄可能「純分數紀錄 · 此筆未封存原始物理細項」。 |
| **影片亮點** | 日誌卡六軸小格；展開原始物理量。 |

空態：`history.empty`「尚無六軸快照。前往「測功」分頁完成評測並儲存第一筆。」

卡軸短標：力量／爆發／心肺／肌量／FFMI／握力。

原始細項 section：力量／爆發力／心肺／體態·FFMI／握力。

---

### 5.4 測功節奏與機體規格銘牌

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 測功節奏（LOCAL RHYTHM）；機體規格；專項選配 |
| **UI 位置** | `/history` 頂部 `HistoryFootprintDashboard`；新銘牌 toast「規格解鎖」可帶 `focusBadgeId` 跳回 |
| **核心互動** | GitHub 風點陣：本週出勤目標 **3** 天（`WEEKLY_RHYTHM_TARGET`）、累積天數、本月熱圖三色（實戰／歸檔／突破）。銘牌本機單調解鎖，18 個月熱圖 prune **不會**回收已解鎖 id。Nav 日誌 tab 可顯示「有新解鎖銘牌」。 |
| **影片亮點** | 熱圖點亮；銘牌架 glow；底部 unseen badge。 |

熱圖 level：`1` 實戰工具；`2` 數據歸檔；`3` 極限突破。

**核心銘牌 `CORE_SPEC_BADGE_IDS`：**

| id | 官方 name | 解鎖條件（官方 desc） |
|---|---|---|
| `IGN-01` | 初次回火 | 有一天做過測功（評測、存檔，或算出 1RM／配重）。只打開 App 不算。 |
| `ARC-01` | 首份入庫 | 在測功分頁存下第一筆六軸成績。 |
| `RHY-03` | 本週節奏 | 本週（週一到週日）有 3 天做過測功。 |
| `RUN-07` | 七日磨合 | 累積有 7 天做過測功。 |
| `RUN-30` | 磨合完成 | 累積有 30 天做過測功。 |
| `CRS-04` | 巡航定速 | 連續 4 週，每週至少測功 3 天。 |
| `HIST-10` | 數據建構 | 日誌裡存了 10 筆六軸成績。 |
| `PR-01` | 破限初醒 | 任一軸分數比你以前最好的還高。六軸都有分數還不夠，要創新高。 |
| `SPEC-6` | 全軸通電 | 力量、爆發、有氧、肌肉、體脂、握力都有大於 0 的分數（不含臂圍）。 |

**專項選配 `OPTIONAL_SPEC_BADGE_IDS`：**

| id | 官方 name | 解鎖條件 |
|---|---|---|
| `ARM-01` | 圍度入庫 | 做完臂圍測試並存下分數。加分項，不計入六軸。 |
| `5K-01` | 五公里完賽 | 在有氧頁存下一筆 5 公里時間。加分項。 |
| `SPR-01` | 百米起跑 | 在爆發力頁存下一筆 100 公尺秒數。加分項。 |
| `SOM-01` | 人體幾何 | 完成一次希斯卡特體態分析。加分項。 |

Toast：`badgeToast.unlocked`「規格解鎖」；`tapToView`「點擊查看」。

---

### 5.5 設定、隱私與權益

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 設定（控制中心） |
| **路由** | `/settings` |
| **核心互動** | 語言（繁中／EN）；音效；Google／Apple 登入與登出；恢復購買；商店管理或取消訂閱；查看 PRO 戰場方案；已封鎖天梯名單；**撤除全球天梯公開足跡**（俱樂部私榜不受影響）；清除 Dyno 本機紀錄；刪除帳號；關於／隱私／聯絡；重新通電（重置首次引導聚光燈並回首頁）。 |
| **影片亮點** | 旁白一句「戰場身份可隨時從全球榜撤除」即可，不必當主鏡頭。 |

區塊：`sectionAccountPro`「帳戶與訂閱」；`sectionLadderPrivacy`「天梯與隱私安全」；`sectionLocalDiagnostics`「本機資料與診斷」；`sectionPreferences`「偏好設定」。

撤除公開足跡：`eraseHistoryTitle`「撤除全球天梯公開足跡」；hint「清空你在全球天梯的歷史分片與預覽卡；俱樂部私榜不受影響。」

重新通電：`system.reCalibrate`「重新通電」；kicker `RE-CALIBRATION`。

---

### 5.6 加入戰場與訂閱漏斗（名片周邊）

| 欄位 | 內容 |
|---|---|
| **官方名稱** | 加入戰場 |
| **路由** | `/join-arena`（query 可帶 funnel `from` 與 `returnTo`） |
| **核心互動** | Google／Apple 登入；選 Pro 方案；優惠碼；商店訂閱。Home／Dyno／backup funnel **不**套用天梯早鳥免費 CTA。 |
| **影片亮點** | 可作結尾 CTA；主畫面建議用主控 PRO 卡。 |

Paywall 價目現況文案：NT$ 30 / 月 ($1.00 USD)。

`EntitlementState` 關鍵欄：`purchaseStatus: 'none' | 'owned'`；`subscriptionStatus: 'free' | 'pro' | 'grace' | 'expired'`；`isPro`；`isGenesisEarlyBird`；`genesisSeatNumber`。

---

### 5.7 桌面 Widget snapshot（非獨立畫面）

`src/services/widgetSnapshotService.ts` 於分數變更時寫入本機 `up.widget.snapshot`（`overallScore` + `scores` + `updatedAt`）。**目前 repo 沒有獨立 Widget UI 頁面或 iOS/Android widget extension 畫面。** 短影音 **不建議**當鏡頭。

---

## 6. 建議 18 秒分鏡優先級（現況可拍）

1. **主控雷達**（`/user-info`）：體能 → 遙測切換＋整車性能指數滾分。
2. **全規格診斷**：Homologation 認證＋Flat-6／車系代號。
3. **天梯**（`/ladder`）：總戰力列表 → 篩選子榜 → 點人 PK 雙雷達。
4. **Dyno 準星**：智庫艙一句「只解讀遙測，不是教練百科」。
5. **整備**（`/training-tools`）：槓片藍圖或星圖 1 秒＋俱樂部卡。
6. **日誌**（`/history`）：熱圖＋銘牌解鎖。

**旁白主軸（現況對齊）：**  
「測完不是結束——你的分數會變成車籍認證、全球／俱樂部榜、AI 解碼，以及一本帶銘牌的測功日誌。」

---

## 附錄 A — 刻意排除（避免與評測片重複）

以下 **不上本圖鑑主文展開**（算法 SSOT 在 `docs/UP_CORE_SPEC_SSOT.md`）：

- `/skill-tree` 六軸大廳測項卡片流程
- `/strength` `/explosive` `/cardio` `/ffmi` `/muscle` `/grip` `/arm-size` 的輸入→計分公式
- DOTS／Brzycki／McCulloch／Cooper 常模／FFMI 分段／SMM 十分位／握力雙段斜率

例外收入：名人堂光譜、Homologation 儀式、Dyno CTA、專項榜（5 km／百米／臂圍）作為 **天梯／認證玩法**。

---

## 附錄 B — 關鍵檔案索引

| 檔案 | 職責 |
|---|---|
| `src/config/nav.config.ts` | 五 Tab 路徑與 guestRestricted |
| `src/config/routes.ts` | 全路由常數與 HUD／compact 判定 |
| `src/logic/core/ladderShards.ts` | Division／project／shard 映射 |
| `src/logic/core/vehicleResolver.ts` | 七種 VehicleClassId |
| `src/logic/core/scoreMeaningCatalog.ts` | Homologation 14 階與 decade 帶 |
| `src/logic/core/dynoIntelGates.ts` | Dyno 試用／Pro／weight-sim 權限 |
| `src/logic/core/trainingFootprint.ts` | 節奏熱圖與銘牌 id |
| `src/pages/LadderPage.tsx` | 全球天梯 |
| `src/pages/HomePage.tsx` | 主控組裝 |
| `src/pages/ToolsPage.tsx` | 整備基地 |
| `src/pages/HistoryPage.tsx` | 測功日誌 |
| `src/pages/CrewPage.tsx` | 俱樂部 HQ |
| `src/i18n/locales/zh-Hant/common/ladder.json` | 天梯文案 |
| `src/i18n/locales/zh-Hant/common/home.json` | 主控／認證／身份 |
| `src/i18n/locales/zh-Hant/common/dynoIntel.json` | 智庫艙 |
| `src/i18n/locales/zh-Hant/common/tools.json` | GARAGE／計算器／圖鑑 |
| `src/i18n/locales/zh-Hant/common/history.json` | 日誌／銘牌 |
| `src/i18n/locales/zh-Hant/common/crew.json` | 俱樂部 |
| `src/i18n/locales/zh-Hant/common/core.json` | navbar、scoreMeaning 頻譜、archetypes |
