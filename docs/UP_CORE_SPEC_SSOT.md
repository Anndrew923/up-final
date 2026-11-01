# 最強肉體（Ultimate Physique）核心演算法與對標規格書

- **產品**：最強肉體（Ultimate Physique）
- **SSOT 層**：`src/logic/core/`（純函數；UI 不得自行改係數）
- **分數空間**：單軸持久化上限 `SCORE_AXIS_MAX = 200`；綜合戰力為六軸算術平均（等權、無 gamma）
- **跨群體公平 PK**：先用年齡／性別／體重／身高把「原始物理量」換成同一套 0–200 分，再以該分數上混合天梯。篩選桶（年齡帶、身高帶、體重帶）只做榜單切分，不改分數。

本文件嚴格依 **up-final 現況代碼** 彙整（`src/logic/core/*`、`src/types/*`、`src/i18n/locales/zh-Hant/common/*`）。未在程式中實作的公式（例如 Sayers 功瓦、Cooper VO₂max 解析式、左右手握力加權）會標明「未實作」，避免把文案層的隱喻寫成演算真相。

---

## 一、核心架構與多變數校準機制（Demographic Calibration）

### 1.1 身體基線（所有評測的前置條件）

來源：`src/types/userProfile.ts`、`src/logic/core/physicalProfile.ts`

```ts
export interface PhysicalProfile {
  gender: 'male' | 'female';
  age: number;       // 整歲
  heightCm: number;  // cm
  weightKg: number;  // kg
  // 天梯切分用選填欄：jobCategory, weeklyTrainingHours, trainingYears,
  // countryCode, region, city, district, isAnonymousInLadder
  updatedAt: string;
}
```

**輸入邊界（產品驗證，非計分公式）：**

| 變數 | 下限 | 上限 | 備註 |
|---|---|---|---|
| 年齡 | 13 | 90 | 整數 |
| 身高 | 120 cm | 230 cm | 一位小數 |
| 體重 | 35 kg | 250 kg | 一位小數 |
| 性別 | `male` / `female` | — | 表單亦接受 `男性` / `女性` |

`isPhysicalProfileComplete` 要求四欄齊全。力量／爆發／肌肉／握力／FFMI 寫入雷達前都會擋這道門。

性別正規化（常模表用）`normalizeGenderForNormTables`：

- `male` / `男性` / 含 `"m"` → `male`
- `female` / `女性` → `female`
- 缺值 → `null`；多數計分路徑缺性別時 **fallback 男性**（混合天梯守門）。

---

### 1.2 各變數實際進入哪些公式

| 變數 | 進入的軸 | 修正形式 | 數學 |
|---|---|---|---|
| **性別 Gender** | 力量 | IPF DOTS 四階多項式係數分男／女 | 見 §2.1 |
| | 爆發、心肺、肌肉 | 獨立常模表（男表／女表） | 見各節矩陣 |
| | FFMI | 分段曲線錨點不同；人體極限 42／34 | 見 §2.4 |
| | 握力 | 斜率、百級門檻、體重錨點、峰值天花板全部分性別 | 見 §2.6 |
| **年齡 Age** | 力量 | McCulloch 年齡係數（乘在 DOTS 上） | 見下表 |
| | 爆發 | 8 段年齡桶常模（12–80） | 見 §2.2 |
| | 心肺 Cooper | 7 段年齡桶常模（13–50+） | 見 §2.3 |
| | 肌肉 SMM／SM% | 8 段年齡桶十分位表（10–80；產品年齡下限 13） | 見 §2.5 |
| | 握力、FFMI | **不進公式**（只當 profile 完整性檢查） | — |
| **體重 Weight** | 力量 | DOTS 分母 \(A w^4+B w^3+C w^2+D w+E\) | 見 §2.1 |
| | 握力 | 異速生長 \(W_{factor}=(錨點/W)^{0.5}\) 或 \(^{0.3333}\) | 見 §2.6 |
| | 肌肉 | \(SM\%=SMM/W\times 100\) | 見 §2.5 |
| | FFMI | \(FFM=W\times(1-BF\%)\) | 見 §2.4 |
| | 爆發、Cooper | **不進公式** | — |
| **身高 Height** | FFMI | \(FFMI=FFM/h^2\)；\(h>1.8\) 再加 \(6(h-1.8)\) | Kouri 高個修正（係數 6，非 6.1） |
| | 其餘五軸 | **不進計分**（仍須填寫以通過完整 profile） | — |

---

### 1.3 年齡係數（McCulloch）— 僅力量軸

來源：`getMcCullochCoefficient`（`src/logic/core/scoring.ts`）

\[
C_{age} =
\begin{cases}
1.23 & age < 14 \\
1.23 - \dfrac{age-14}{9}\times 0.23 & 14 \le age \le 23 \\
1.00 & 23 < age \le 40 \\
1.045 & 41\text{–}44 \\
1.11 & 45\text{–}49 \\
1.15 & 50\text{–}54 \\
1.20 & 55\text{–}59 \\
1.25 & 60\text{–}64 \\
1.30 & 65\text{–}69 \\
1.35 & 70\text{–}74 \\
1.40 & 75\text{–}79 \\
1.45 & age \ge 80
\end{cases}
\]

設計意圖：青春期給加成、23–40 為基準 1.0、40 歲後逐步補償肌少／恢復衰退，使「同分數」在混合天梯上代表同相對水準，而非同公斤數。

---

### 1.4 跨群體歸一化如何實現「男女老少同基準 PK」

產品沒有再套一層全域 z-score。公平性來自 **軸內校準 → 同一分數尺**：

1. **原始物理量**（kg、cm、m、秒、%）依性別／年齡查常模或套 DOTS／異速生長。
2. 映射到 **同一分數空間 0–200**（多數軸 100 分＝該群體常模頂點；100+ 為溢出／極限帶）。
3. 綜合戰力 \(Overall=\frac{1}{6}\sum clamp(s_i,0,200)\)，六軸等權。
4. 天梯 `scoreBest` 用此校準分排名；年齡／身高／體重桶只是 **可選篩選**（`LadderAgeBucket` 等），不是計分因子。

因此 55 歲女性 45 kg 握力與 25 歲男性 72 kg 握力，在各自錨點下都落在約 **100.8 分** 的同一「世紀門檻」，可直接 PK。

---

## 二、六維核心演算法規格（Hexagonal Dimension Algorithms）

雷達與綜合戰力固定六軸（`SIX_AXIS_METRICS`），**不含臂圍**：

1. `strength` 力量（馬力 HP）
2. `explosivePower` 爆發力（扭矩 TRQ）
3. `cardio` 心肺（續航 STINT；**僅 Cooper**）
4. `muscleMass` 骨骼肌（車體外觀 CHSS）
5. `bodyFat` FFMI（引擎排量 P2W）
6. `gripStrength` 握力（抓地 GRIP）

專項（不進六軸）：5 km、100 m 衝刺、臂圍 `armSize`。

單軸寫入：`clampScoreMapValue(x) = round2(clamp(x, 0, 200))`。握力例外：先 `round1` 再 clamp。

---

### 2.1 五項力量（Five-Lift Strength）

來源：`scoring.ts`、`strengthAssessment.ts`、`strengthWeightLimits.ts`

**輸入：** 各動作 `weightKg` + 整數 `reps ∈ [1,10]`；profile 的性別、年齡、體重。身高不進公式。

**五項動作（等權平均，缺項當 0，分母固定 5）：**

| UI key | ExerciseType | 錨點 DOTS `ANCHOR_DOTS` | 模型重量上限 kg |
|---|---|---|---|
| `benchPress` | Bench Press | **90** | 370 |
| `squat` | Squat | **140** | 510 |
| `deadlift` | Deadlift | **150** | 550 |
| `latPulldown` | Lat Pulldown | **88** | 300 |
| `shoulderPress` | Overhead Press | **60** | 244 |

常數另有 `'Pull-ups': 88`，**五項評測未使用**。

錨點不是「五項權重係數」，而是各動作「100 分對應的校正後 DOTS」。複合時五項 **等權**：缺項計 0 再除以 5。

#### 步驟 A — Brzycki 1RM

\[
1RM =
\begin{cases}
W & R=1 \\
W \times \dfrac{36}{37-R_{cap}} & R>1
\end{cases}
\quad R_{cap}=\mathrm{clamp}(R,1,15)
\]

產品表單把次數卡在 1–10；≥7 次會出現準確度提示。引體向上特例（未進五項）：`liftWeight = bodyWeight + weight`。

#### 步驟 B — IPF DOTS（四階多項式）

\[
DOTS_{raw}=\frac{1RM\times 500}{A w^4+B w^3+C w^2+D w+E}
\]

\(w=\) 體重 kg。分母 ≤ 0 拋錯。

**男性係數：**

| | 值 |
|---|---|
| A | −0.000001093 |
| B | 0.0007391293 |
| C | −0.191875104 |
| D | 24.0900756 |
| E | −307.75076 |

**女性係數：**

| | 值 |
|---|---|
| A | −0.0000010706 |
| B | 0.0005158568 |
| C | −0.1126655495 |
| D | 13.6175032 |
| E | −57.96288 |

#### 步驟 C — 年齡修正與錨點正規化

\[
DOTS_{corr}=DOTS_{raw}\times C_{age}
\]

\[
Score_{lift}=\frac{DOTS_{corr}}{ANCHOR\_DOTS_{lift}}\times 100
\]

#### 步驟 D — 五項複合（雷達 `strength`）

\[
Score_{strength}=\mathrm{round2}\!\left(\frac{\sum_{i=1}^{5} Score_{lift,i}}{5}\right)
\quad\text{（缺項 }Score_{lift}=0\text{）}
\]

再 `clamp` 到 0–200。

**天梯分流：**

- `strength` shard：深蹲＋臥推＋硬舉 **估計 1RM 公斤總和**（SBD 三項都要有）
- `strength_totalFive`：與雷達相同的五項平均分
- `strength_squat` / `bench` / `deadlift` / `ohp` / `latPull`：單項分

---

### 2.2 爆發力（Peak Power）

來源：`powerScoring.ts`、`explosiveInputCaps.ts`

**未實作：** Sayers 垂直跳功瓦  
\(P=60.7\times h_{cm}+45.3\times m_{kg}-2055\)。  
代碼沒有瓦特換算，也沒有「體重 × 跳高」功率項。體重不進爆發力分數。

**雷達軸輸入：** 垂直跳 cm、立定跳遠 cm。  
**專項（不進六軸）：** 100 m 秒數。

**複合：**

\[
Score_{explosive}=\frac{Score_{VJ}+Score_{SLJ}}{2}
\quad\text{（缺支當 0；兩支都缺則軸為 null／0）}
\]

分母固定 `EXPLOSIVE_COMPOSITE_FIXED_DENOMINATOR = 2`。

**輸入天花板（計分前 clamp）：**

| | 男 | 女 |
|---|---|---|
| 垂直跳上限 | 135 cm | 135 cm |
| 立定跳遠上限 | 390 cm | 390 cm |
| 100 m 地板（更快則鎖此） | 9.4 s | 9.4 s |

#### 低於 T100：0／50／100 兩段線性

增值項目（跳）：

\[
s=
\begin{cases}
\dfrac{v-s_0}{s_{50}-s_0}\times 50 & v<s_{50}\\
50+\dfrac{v-s_{50}}{s_{100}-s_{50}}\times 50 & s_{50}\le v<s_{100}
\end{cases}
\]

減值項目（百米，秒愈小愈好）：對稱線性；快於 T100 走四次溢出。

#### 高於 T100：四次溢出

**立定跳遠（把 cm 差換成公尺）：**  
\(\Delta D_m=(v-s_{100})/100\)

\[
s=100+40\cdot\Delta D_m+45\cdot(\Delta D_m)^4
\]

**垂直跳（公分）：** \(\Delta C=v-s_{100}\)

\[
s=100+1.5\cdot\Delta C+0.000021502\cdot(\Delta C)^4
\]

（校準點：男 21–30，T100=70 cm，103 cm → 175.00）

**百米專項：** \(\Delta T=s_{100}-t\)

\[
s=100+20\cdot\Delta T+12\cdot(\Delta T)^4
\]

#### 垂直跳常模（cm）— 0／50／100 分錨點

**男**

| 年齡桶 | 0 | 50 | 100 |
|---|---|---|---|
| 12–15 | 25 | 45 | 65 |
| 16–20 | 35 | 55 | 75 |
| 21–30 | 30 | 50 | 70 |
| 31–40 | 25 | 45 | 65 |
| 41–50 | 20 | 40 | 60 |
| 51–60 | 15 | 35 | 55 |
| 61–70 | 10 | 30 | 50 |
| 71–80 | 5 | 25 | 45 |

**女**

| 年齡桶 | 0 | 50 | 100 |
|---|---|---|---|
| 12–15 | 20 | 35 | 50 |
| 16–20 | 25 | 40 | 55 |
| 21–30 | 22 | 38 | 52 |
| 31–40 | 18 | 32 | 46 |
| 41–50 | 15 | 28 | 42 |
| 51–60 | 10 | 25 | 40 |
| 61–70 | 5 | 20 | 35 |
| 71–80 | 0 | 15 | 30 |

#### 立定跳遠常模（cm）

**男**

| 年齡桶 | 0 | 50 | 100 |
|---|---|---|---|
| 12–15 | 150 | 200 | 250 |
| 16–20 | 180 | 230 | 280 |
| 21–30 | 170 | 220 | 270 |
| 31–40 | 150 | 200 | 250 |
| 41–50 | 130 | 180 | 230 |
| 51–60 | 110 | 160 | 210 |
| 61–70 | 90 | 140 | 190 |
| 71–80 | 70 | 120 | 170 |

**女**

| 年齡桶 | 0 | 50 | 100 |
|---|---|---|---|
| 12–15 | 120 | 170 | 220 |
| 16–20 | 140 | 190 | 240 |
| 21–30 | 130 | 180 | 230 |
| 31–40 | 115 | 165 | 215 |
| 41–50 | 100 | 150 | 200 |
| 51–60 | 80 | 130 | 180 |
| 61–70 | 60 | 110 | 160 |
| 71–80 | 40 | 90 | 140 |

#### 100 m 專項常模（秒；愈小愈好）

**男：** 12–15 `{18,15,12}`；16–20／21–30 `{17,14,11}`；31–40 `{18,15,12}`；41–50 `{19,16,13}`；51–60 `{20,17,14}`；61–70 `{22,19,16}`；71–80 `{24,21,18}`

**女：** 12–15 `{19,16,13}`；16–20／21–30 `{18,15,12}`；31–40 `{19,16,13}`；41–50 `{20,17,14}`；51–60 `{21,18,15}`；61–70 `{23,20,17}`；71–80 `{25,22,19}`

年齡映射：12–15、16–20、21–30、31–40、41–50、51–60、61–70、71–80；產品年齡從 13 起，13–15 用 `12-15` 列；>80 無表。

---

### 2.3 心肺耐力（Cardio Endurance）

來源：`cardioScoring.ts`

**未實作：** Cooper 經典 VO₂max  
\(\mathrm{VO_2max}=(d_{m}-504.9)/44.73\)。  
分數 **不經 VO₂**，直接用「性別 × 年齡」距離常模做線性映射。VO₂ 只出現在文案層。

**雷達軸：僅 Cooper 12 分鐘距離（公尺）。** 5 km 為專項（`cardio_5km`），絕不 fallback 進六軸。

#### Cooper 距離上限

- 男 `COOPER_MAX_DISTANCE_MALE_METERS = 4900`
- 女 `COOPER_MAX_DISTANCE_FEMALE_METERS = 4400`

超過則 clamp 再計分。

#### 計分（只用 60 分與 100 分錨點；70／80／90 不參與斜率）

\[
s=60+(d-d_{60})\times\frac{40}{d_{100}-d_{60}},\quad s=\mathrm{round2}(\max(0,s))
\]

距離低於 \(d_{60}\) 可低於 60；高於 \(d_{100}\) 可超過 100，直到距離上限。

年齡帶：13–14、15–16、17–20、**21–29 用 `20-29` 列**、30–39、40–49、50+。

#### Cooper 常模（公尺）— 男

| 年齡 | 100 | 90 | 80 | 70 | 60 |
|---|---|---|---|---|---|
| 13–14 | 2700 | 2400 | 2200 | 2100 | 2100 |
| 15–16 | 2800 | 2500 | 2300 | 2200 | 2200 |
| 17–20 | 3000 | 2700 | 2500 | 2300 | 2300 |
| 20–29 | 2800 | 2400 | 2200 | 1600 | 1600 |
| 30–39 | 2700 | 2300 | 1900 | 1500 | 1500 |
| 40–49 | 2500 | 2100 | 1700 | 1400 | 1400 |
| 50+ | 2400 | 2000 | 1600 | 1300 | 1300 |

#### Cooper 常模（公尺）— 女

| 年齡 | 100 | 90 | 80 | 70 | 60 |
|---|---|---|---|---|---|
| 13–14 | 2000 | 1900 | 1600 | 1500 | 1500 |
| 15–16 | 2100 | 2000 | 1700 | 1600 | 1600 |
| 17–20 | 2300 | 2100 | 1800 | 1700 | 1700 |
| 20–29 | 2700 | 2200 | 1800 | 1500 | 1500 |
| 30–39 | 2500 | 2000 | 1700 | 1400 | 1400 |
| 40–49 | 2300 | 1900 | 1500 | 1200 | 1200 |
| 50+ | 2200 | 1700 | 1400 | 1100 | 1100 |

#### 5 km 專項（不進雷達）

| | T0（0 分） | T100（100 分） | WR 地板（最快可接受） |
|---|---|---|---|
| 男 | 45:00（2700 s） | 20:00（1200 s） | 12:20（740 s） |
| 女 | 50:00（3000 s） | 22:30（1350 s） | 13:40（820 s） |

T100–T0 線性：

\[
s=100-\frac{t-T_{100}}{T_0-T_{100}}\times 100
\]

快於 T100（\(\Delta t_{min}=(T_{100}-t)/60\)）：

\[
s=100+6\cdot\Delta t_{min}+k\cdot(\Delta t_{min})^4
\]

- 男 \(k=0.0105\)
- 女 \(k=0.0047\)（較寬 WR 間距，避免同分落到更高 pantheon）

慢於 T0 → 0。

---

### 2.4 FFMI（Fat-Free Mass Index）— 雷達鍵 `bodyFat`

來源：`ffmiScoring.ts`（Kouri 系調整 FFMI + 產品分段給分）

**輸入：** 身高 cm、體重 kg、體脂％ ∈ **[3, 60]**。年齡不進公式。

#### Kouri 調整 FFMI

\[
FFM = W_{kg}\times\left(1-\frac{\mathrm{clamp}(BF\%,0,99.9)}{100}\right)
\]

\[
FFMI_{raw}=\frac{FFM}{h_m^2}
\]

\[
FFMI_{adj}=
\begin{cases}
FFMI_{raw}+6(h_m-1.8) & h_m>1.8 \\
FFMI_{raw} & \text{otherwise}
\end{cases}
\]

（Kouri 文獻常見係數 6.1；本產品係數為 **6**。矮於 1.8 m **不加**負修正。）

#### 人體極限錨點（超過則禁止寫入雷達）

- 男 `FFMI_HUMAN_CAP_MALE = 42`
- 女 `FFMI_HUMAN_CAP_FEMALE = 34`

`allowsRadarSubmit = rawAdjusted ≤ cap`。超過時仍算 `uncappedScore`，但 `submittedScore` 用 cap 後 FFMI，且 UI 鎖寫入。

#### 分段給分（自然極限門檻）

**男：** base 18.5 → 60 分；自然上限 25 → 100 分；超過每 1 FFMI **+5 分**

\[
s=
\begin{cases}
\dfrac{F}{18.5}\times 60 & F\le 18.5 \\
60+\dfrac{F-18.5}{25-18.5}\times 40 & 18.5<F<25 \\
100+(F-25)\times 5 & F\ge 25
\end{cases}
\]

男 cap 42 → \(100+(42-25)\times 5=185\) 分。

**女：** base 15.5 → 60；自然上限 21 → 100；超過 +5／單位

女 cap 34 → \(100+(34-21)\times 5=165\) 分。

Kouri 1995 常被引用的「自然男 ~25」對應本產品 **100 分門檻**，不是硬封頂。

#### 衛教區間（給分不讀此表，只做分類文案）

**男：** <18 偏低；18–19 入門；20–21 訓練者；22 強健業餘；23–25 自然天花板帶；26–27 極高；≥28 極端離群。  
**女：** <15 偏低；15–16 入門；17–18 訓練者；19–21 強健業餘；>22 極高。

---

### 2.5 肌肉總量（Skeletal Muscle Mass）

來源：`muscleScoring.ts`、`muscleStandards.ts`

**輸入：** SMM kg（儀器讀值，不由身高推估）、profile 體重／年齡／性別。

\[
SM\%=\frac{SMM}{W}\times 100
\]

**輸入天花板（超過不計分）：** 男 100 kg、女 67 kg。

#### 分支給分 `calculateScoreFromStandard`

十分位錨點 0,10,…,100。落在區間內線性內插。超過 100 分錨點：

\[
s_{ext}=100+(v-s_{100})\times\frac{10}{s_{100}-s_{90}}
\]

若 \(s_{ext}>120\)：\(s=120+(s_{ext}-120)\times 0.5\)（半斜率延長）。

#### 雙維合成

基準（SMM 分支分 ≤ 100）：

\[
Score_{eq}=\frac{s_{SMM}+s_{SM\%}}{2}
\]

巨獸帶（\(s_{SMM}>100\)）：

\[
Score_{beast}=0.8\,s_{SMM}+0.2\,s_{SM\%}
\]

\[
Score_{muscle}=\max(Score_{eq},Score_{beast})
\]

避免重骨架被 SM% 拖垮，且交接點不倒排。

天梯：`muscleMass` 用合成分；`muscleMass_weightKg` 用 SMM 分支；`muscleMass_ratio` 用 SM% 分支。

#### 男 SMM kg 十分位

| 年齡 | 100 | 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10–12 | 26 | 24 | 22 | 20 | 18 | 16 | 14 | 12 | 10 | 8 | 6 |
| 13–17 | 42.8 | 40.4 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 | 23.6 | 21.2 | 18.8 |
| 18–30 | 50 | 47.6 | 45.2 | 42.8 | 40.4 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 |
| 31–40 | 47.6 | 45.2 | 42.8 | 40.4 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 | 23.6 |
| 41–50 | 45.2 | 42.8 | 40.4 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 | 23.6 | 21.2 |
| 51–60 | 42.8 | 40.4 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 | 23.6 | 21.2 | 18.8 |
| 61–70 | 40.4 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 | 23.6 | 21.2 | 18.8 | 16.4 |
| 71–80 | 38 | 35.6 | 33.2 | 30.8 | 28.4 | 26 | 23.6 | 21.2 | 18.8 | 16.4 | 14 |

#### 男 SM% 十分位

| 年齡 | 100 | 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10–12 | 45.6 | 43.4 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 | 23.6 |
| 13–17 | 47.8 | 45.6 | 43.4 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 |
| 18–30 | 50 | 47.8 | 45.6 | 43.4 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 |
| 31–40 | 47.8 | 45.6 | 43.4 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 |
| 41–50 | 45.6 | 43.4 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 | 23.6 |
| 51–60 | 43.4 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 | 23.6 | 21.4 |
| 61–70 | 41.2 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 | 23.6 | 21.4 | 19.2 |
| 71–80 | 39 | 36.8 | 34.6 | 32.4 | 30.2 | 28 | 25.8 | 23.6 | 21.4 | 19.2 | 17 |

#### 女 SMM kg 十分位

| 年齡 | 100 | 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10–12 | 24 | 22 | 20 | 18 | 16 | 14 | 12 | 10 | 8 | 6 | 4 |
| 13–17 | 32 | 29.4 | 26.8 | 24.2 | 21.6 | 19 | 16.4 | 13.8 | 11.2 | 8.6 | 6 |
| 18–30 | 37.5 | 35 | 32.5 | 30 | 27.5 | 25 | 22.5 | 20 | 17.5 | 15 | 12.5 |
| 31–40 | 36 | 33.5 | 31 | 28.5 | 26 | 23.5 | 21 | 18.5 | 16 | 13.5 | 11 |
| 41–50 | 34.5 | 32 | 29.5 | 27 | 24.5 | 22 | 19.5 | 17 | 14.5 | 12 | 9.5 |
| 51–60 | 33 | 30.5 | 28 | 25.5 | 23 | 20.5 | 18 | 15.5 | 13 | 10.5 | 8 |
| 61–70 | 31.5 | 29 | 26.5 | 24 | 21.5 | 19 | 16.5 | 14 | 11.5 | 9 | 6.5 |
| 71–80 | 30 | 27.5 | 25 | 22.5 | 20 | 17.5 | 15 | 12.5 | 10 | 7.5 | 5 |

#### 女 SM% 十分位

| 年齡 | 100 | 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10–12 | 41 | 39 | 37 | 35 | 33 | 31 | 29 | 27 | 25 | 23 | 21 |
| 13–17 | 42 | 40 | 38 | 36 | 34 | 32 | 30 | 28 | 26 | 24 | 22 |
| 18–30 | 43 | 41 | 39 | 37 | 35 | 33 | 31 | 29 | 27 | 25 | 23 |
| 31–40 | 41.5 | 39.5 | 37.5 | 35.5 | 33.5 | 31.5 | 29.5 | 27.5 | 25.5 | 23.5 | 21.5 |
| 41–50 | 40 | 38 | 36 | 34 | 32 | 30 | 28 | 26 | 24 | 22 | 20 |
| 51–60 | 38.5 | 36.5 | 34.5 | 32.5 | 30.5 | 28.5 | 26.5 | 24.5 | 22.5 | 20.5 | 18.5 |
| 61–70 | 37 | 35 | 33 | 31 | 29 | 27 | 25 | 23 | 21 | 19 | 17 |
| 71–80 | 35.5 | 33.5 | 31.5 | 29.5 | 27.5 | 25.5 | 23.5 | 21.5 | 19.5 | 17.5 | 15.5 |

---

### 2.6 握力（Grip Strength）

來源：`gripStrength.ts`、`types/gripInputs.ts`

**未實作：** 左右手分別輸入與左右權重。持久化只有單一 `peakKg`（握力計峰值）。

**輸入：** `peakKg` + profile 體重、性別。年齡／身高不進公式。

#### 常數

| 符號 | 男 | 女 |
|---|---|---|
| 線性倍率 | 1.4 | \(1.4\times 1.6=2.24\) |
| 世紀門檻 peak | 72 kg | 45 kg |
| 世紀分數 `GRIP_CENTURY_SCORE` | 100.8 | 100.8 |
| 體重錨點 | 75 kg | 55 kg |
| 峰值天花板 | 200 kg | 110 kg |
| 精英斜率 | \((200-100.8)/(200-72)=0.775\) | \((200-100.8)/(110-45)\approx 1.526153846\) |

輕體指數 `GRIP_WEIGHT_EXPONENT_LIGHT = 0.5`  
重體指數 `GRIP_WEIGHT_EXPONENT_HEAVY = 0.3333`

#### 異速生長體重因子

\[
W_{factor}=
\begin{cases}
\left(\dfrac{W_{anchor}}{W}\right)^{0.5} & W\le W_{anchor}\\
\left(\dfrac{W_{anchor}}{W}\right)^{0.3333} & W>W_{anchor}
\end{cases}
\]

缺體重時 \(W=W_{anchor}\) → \(W_{factor}=1\)。

#### 雙段斜率（W_factor 前）

男：

\[
raw=
\begin{cases}
peak\times 1.4 & peak\le 72\\
100.8+(peak-72)\times 0.775 & peak>72
\end{cases}
\]

女：

\[
raw=
\begin{cases}
peak\times 2.24 & peak\le 45\\
100.8+(peak-45)\times s_{elite,f} & peak>45
\end{cases}
\]

\[
Score_{grip}=\mathrm{clamp}(\mathrm{round1}(raw\times W_{factor}),\,0,\,200)
\]

校準：男 75 kg／72 kg 握 ≈ 100.8；女 55 kg／45 kg 握 ≈ 100.8。天花板閉合於 200。

握力帶與其他軸略有不同：LEGEND = 150–159.99，PANTHEON ≥ 160（其餘軸 LEGEND 到 179.99、PANTHEON ≥ 180）。

---

### 2.7 補充：臂圍（不進六軸）

\[
s=\frac{arm_{cm}}{benchmark}\times\left(1+\frac{BF_{base}-BF\%}{100}\right)\times 100
\]

- 男 benchmark 50 cm、base BF 20%
- 女 benchmark 35 cm、base BF 18%
- 臂圍 (0, 70] cm；體脂 [3, 50]%

---

## 三、綜合戰力指數與車系對標（Telemetry & Benchmark）

### 3.1 綜合戰力（Total Composite Score）

來源：`calculateSixAxisOverall`（`scoring.ts`）

\[
Overall=\mathrm{round2}\!\left(\frac{1}{6}\sum_{m\in M}\mathrm{clamp}(s_m,0,200)\right)
\]

\(M=\{strength, explosivePower, cardio, muscleMass, bodyFat, gripStrength\}\)

- **等權 1/6**，無額外軸權重、無 gamma、無公式性人工天花板。
- 缺軸當 **0**（拉低平均）。`armSize` 不進平均。
- 顯示固定兩位小數（例如 `95.78`）。
- 單軸 persist 上限 200；overall 理論上限 200。

**雷達視覺（不算分）：**

- 多邊形半徑尺固定 100（`radarDisplayScaleMax`）
- 超過 100 的 overflow 用 \(\sqrt{}\) 壓成最多 +24 px：  
  \(r_{extra}=24\sqrt{\min(s-100,100)/100}\)
- 另有舊函式 `normalizeRadarValue`（log1p 軟頂 130），**現況六軸 overall 不使用**。

**合併管線** `mergeScoreMapForHomeRadar`：以 persisted 原始輸入 + profile **重算** cardio／muscle／explosive／strength／grip，覆蓋 store 分數。FFMI 由評測頁直接寫 `scores.bodyFat`。

---

### 3.2 Homologation Grade（賽會認證評等）

來源：`OVERALL_GRADE_TIERS` + `home.overallGrade.*`  
UI kicker：`HOMOLOGATION GRADE // 賽會認證評等`  
代碼 **沒有** 名為「黃金認證」的獨立 enum；對應的是下列 decade 門檻（Score ≥ min）。

| bandId | 分數 | 認證名 | 結構代號（representativeCar） | 參考身價文案 |
|---|---|---|---|---|
| BASE | 0–39.99 | STOCK COMMUTER 原廠常規街車 | STOCK ‧ 原廠初始素車 | 100 萬內代步級 |
| TIER_40 | 40–49.99 | STREET MODIFIED 街道初階改裝 | STOCK ‧ 原廠初始素車 (街道精調) | 200 萬級街道鋼砲 |
| TIER_50 | 50–59.99 | STAGE 1 TUNE 進階一階調校 | Inline-4 Turbo ‧ 街道前驅鋼砲 (原廠態) | 250 萬級進階一階 |
| TIER_60 | 60–69.99 | CLUB TRACK SPEC 俱樂部賽道版 | Inline-4 Turbo ‧ 街道前驅鋼砲 (Stage 1) | 300 萬級四驅底盤 |
| TIER_70 | 70–79.99 | TRACKDAY ENTHUSIAST 週末熱道挑戰 | Mid-Engine ‧ 幾何流線完全體 (街道態) | 400 萬級後驅跑車 |
| TIER_80 | 80–89.99 | AMATEUR TIME ATTACK 業餘挑戰組 | Mid-Engine ‧ 幾何流線完全體 (賽道態) | 450 萬級雙門轎跑 |
| TIER_90 | 90–99.99 | UNLIMITED ATTACK 極限計時賽規 | **Flat-6 NA ‧ 賽道高轉剛性軸 (Club)** | 600 萬級中置運動旗艦 |
| TIER_100 | 100–109.99 | REGIONAL CHAMPIONSHIP 地區錦標賽規 | **Flat-6 NA ‧ 賽道高轉剛性軸 (Championship)** | 1,500 萬級自然進氣天花板 |
| TIER_110 | 110–119.99 | STAGE 2 COMPETITION 精銳國際錦標 | V8-TwinTurbo ‧ Stage 2 重裝超壓 | 2,500 萬級精銳賽車缸體 |
| TIER_120 | 120–129.99 | PRO ENDURANCE SPEC 職業耐力賽規 | V8-TwinTurbo ‧ Stage 2 重裝超壓 (Endurance) | 4,500 萬級職業殿堂 |
| TIER_130 | 130–139.99 | FACTORY PROTOTYPE 原型工廠賽車 | V8-TwinTurbo ‧ Stage 3 賽道魔王 | 億級工廠尖端科技 |
| TIER_140 | 140–149.99 | STAGE 3 APEX 頂級超驗載具 | V8-TwinTurbo ‧ Stage 3 賽道魔王 (Apex) | 1.5 億級頂級神獸 |
| LEGEND | 150–179.99 | LEGENDARY MONSTER 傳奇改裝怪獸 | PANTHEON ‧ 終極星艦概念體 (Legend) | 3 億以上傳奇不朽結晶 |
| PANTHEON | ≥180 | PANTHEON EXPERIMENTAL 萬神殿實驗車 | PANTHEON ‧ 終極星艦概念體 | 無價 // 萬神殿歸檔 |

這些 hp／Nm／Bar **不是** 由分數線性換算出的物理量，而是 **帶文案對照表**。

---

### 3.3 分軸 Telemetry 對照（scoreMeaning bands）

與 overall 共用 decade 門檻（握力 LEGEND／PANTHEON 切點不同，見 §2.6）。

#### 力量 → 馬力 HP

| 帶 | 規格 |
|---|---|
| BASE | 10 hp 速克達 |
| TIER_40 | 90 hp 家用車 |
| TIER_50 | 140 hp 小房車 |
| TIER_60 | 180 hp 性能鋼砲 |
| TIER_70 | 250 hp 後驅小跑 |
| TIER_80 | 350 hp 雙門跑車 |
| TIER_90 | 430 hp 運動旗艦 |
| TIER_100 | 550 hp 賽道剛性軸 |
| TIER_110 | 680 hp 精銳工廠賽車 |
| TIER_120 | 820 hp 耐力原型載具 |
| TIER_130 | 1000 hp 千匹巨獸 |
| TIER_140 | 1200 hp 火箭推進載具 |
| LEGEND | 1500 hp 地星資產 |
| PANTHEON | 萬神殿馬力 |

#### 爆發力 → 扭矩 Nm／TRQ

| 帶 | 規格 |
|---|---|
| BASE | 9 Nm 原廠街車扭矩 |
| TIER_40 | 140 Nm 點火優化 |
| TIER_50 | 210 Nm 輕量單質飛輪 |
| TIER_60 | 320 Nm 一階內燃調校 |
| TIER_70 | 400 Nm 階段性增壓 |
| TIER_80 | 450 Nm 賽道彈射系統 |
| TIER_90 | 600 Nm 機械增壓全域爆發 |
| TIER_100 | 750 Nm 競賽級極限傳動 |
| TIER_110 | 850 Nm 雙渦輪高壓灌注 |
| TIER_120 | 950 Nm 原型車極限瞬態 |
| TIER_130 | 1250 Nm 重型千匹油電綜效 |
| TIER_140 | 1400 Nm 航空級瞬態幻影 |
| LEGEND | 宇航級火箭推進器 |
| PANTHEON | 萬神殿 |

#### 心肺／Cooper → 增壓 Bar

0.4 / 0.6 / 0.9 / 1.2 / 1.5 / 1.8 / 2.1 / 2.4 / 2.8 / 3.2 / 3.8 / 4.5 / 5.5 / 6.5 Bar（BASE→PANTHEON）。Cooper 文案強調 12 分鐘限時與 VO₂ 敘事，**分數仍是距離常模**。

#### FFMI → 排量

0.1L 單缸 → 1.6L → 1.5L 鋼砲 → 2.0T → 3.0L I6 → 4.0T V8 → 6.2L V8 → 3.5T V6 賽道雙渦輪 → 4.0T V8 精銳 → 耐力原型 → 5.0T V8 → 6.0T 航空 → 8.0L W16 → 萬神殿全極限排量。

#### 肌肉 → 車體空力／寬體

原廠素面 → 基礎空力 → 運動化包圍 → 側裙 → 小寬體 → GT 空力 → 競技寬體 → GT 大尾翼 → 工廠寬體 → 極低風阻外殼 → 千匹碳纖車體 → 航天寬體 → PANTHEON 一體化骨架 → 萬神殿外裝。

#### 握力 → 輪胎

節能窄胎 → 四季胎 → 街道升級 → 運動街胎 → 熱化跑胎 → 半熱熔 → 熱熔極限 → Drag 專用 → 光頭胎 → 耐力貼地 → 加熱毯全熱熔 → 液壓鉗高黏橡膠 → 航天橡膠 → 萬神殿引力咬合。

---

### 3.4 車系原型（Vehicle Class）— 由雷達形狀決定，不是 overall 分數

來源：`resolveVehicleClass`（`vehicleResolver.ts`）

令六軸值平均 \(\mu\)、標準差 \(\sigma\)：

- 若 \(\sigma<10\) 且 \(\mu>50\) → **`GT_CRUISER`**（全域巡航；均衡旗艦）
- 否則取最高軸：
  - strength → `G_PLATFORM` 鋼鐵底盤
  - explosivePower → `HIGH_OUTPUT` 強力後燃
  - cardio → `ENDURANCE_PROTO` 耐力原案
  - muscleMass → `WIDE_BODY` 寬體架構
  - bodyFat（FFMI）→ `AERO_SPEC` 氣動優化
  - gripStrength → `MR_SPEC` 中置重心

這是 **身份／文案路由**，不改變 overall。

---

### 3.5 其他分級（非 Homologation）

**LEVEL_BANDS**（舊 Nen／等級帶，仍在 `scoring.ts`）：0 新手、40 守護級、60 先鋒級、80 騎士級、100 主權級。

**Aura（純呈現）：** BASE–50 none；60–70 pulse；80 flow；90–100 shimmer；110–120 lightning；130–140 void_flame；LEGEND+PANTHEON divine_light。

**人類尺度 decade：** 0,40,50,…,150；Hall of Fame 名人從 decade ≥ 60 才掛名。LEGEND 與 PANTHEON 在人類尺度都折到 `150`。

---

## 四、系統資料結構（Core Data Models）

代碼沒有名為 `DynoScore` 的介面。對應物：`ScoreMap` + `calculateSixAxisOverall`、以及 Dyno Intel 的 `DynoAxisSnapshot`／`DynoIntelContextV1`。

### 4.1 分數與雷達

```ts
export type ScoreMetric =
  | 'strength' | 'explosivePower' | 'cardio'
  | 'muscleMass' | 'bodyFat' | 'armSize' | 'gripStrength';

export const SIX_AXIS_METRICS = [
  'strength', 'explosivePower', 'cardio',
  'muscleMass', 'bodyFat', 'gripStrength',
] as const;

export type ScoreMap = Partial<Record<ScoreMetric, number>>;

export interface RadarPoint {
  key: ScoreMetric;
  label: string;
  value: number;
}
```

### 4.2 使用者／權益

```ts
export interface PhysicalProfile {
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  jobCategory?: LadderJobCategory | '';
  weeklyTrainingHours?: number | null;
  trainingYears?: number | null;
  countryCode?: LadderCountryCode | '';
  region?: string;
  city?: string;
  district?: string;
  isAnonymousInLadder?: boolean;
  updatedAt: string;
}

export interface EntitlementState {
  purchaseStatus: 'none' | 'owned';
  subscriptionStatus: 'free' | 'pro' | 'grace' | 'expired';
  isPro: boolean;
  proExpiresAt: string | null;
  promoExpiresAt: string | null;
  effectiveUntil?: string | null;
  planId: string | null;
  isGenesisEarlyBird: boolean;
  genesisSeatNumber: number | null;
  // …cooldown / credit 欄位略
}
```

### 4.3 評測原始輸入

```ts
export interface StrengthInputsPersisted {
  lifts?: Partial<Record<
    'benchPress' | 'squat' | 'deadlift' | 'latPulldown' | 'shoulderPress',
    { weightKg?: number; reps?: number }
  >>;
  bodyWeightKgSnapshot?: number;
}

export interface ExplosivePowerRawPersisted {
  verticalJumpCm?: number;
  standingLongJumpCm?: number;
  sprintSeconds?: number; // 專項
}

export interface CardioInputsPersisted {
  cardio?: { distance?: number };           // Cooper m
  run_5km?: { minutes?: number; seconds?: number; totalSeconds?: number; paceInSeconds?: number };
}

export interface MuscleInputsPersisted { muscle?: { smmKg?: number } }
export interface GripInputsPersisted { peakKg?: number; genderSnapshot?: 'male' | 'female' }
export interface ArmSizeInputsPersisted { armCircumferenceCm?: number; bodyFatPct?: number }

export interface AssessmentRawInputsV1 {
  schemaVersion: 1;
  physicalProfileSnapshot?: Pick<PhysicalProfile, 'gender' | 'age' | 'heightCm' | 'weightKg'>;
  strength?: StrengthInputsPersisted;
  power?: { explosivePower?: ExplosivePowerRawPersisted };
  cardio?: CardioInputsPersisted;
  muscle?: MuscleInputsPersisted;
  grip?: GripInputsPersisted;
  armSize?: ArmSizeInputsPersisted;
  ffmi?: { bodyFatPct: number };
}
```

### 4.4 歷史／首頁共振

```ts
export interface LocalHistoryRecord {
  id: string;
  createdAt: string;
  scores: ScoreMap;
  overallScore: number;
  note?: string;
  rawInputs?: AssessmentRawInputsV1;
}

export interface HomeResonanceSnapshot {
  overallScore: number;
  radarPoints: RadarChartPoint[];
  gradeBandId: OverallGradeBandId;
  gradeLine: string;
  archetypeTitle: string;
  archetypeSummary: string;
}
```

### 4.5 天梯紀錄（LeaderboardEntry ≈ 請求中的 LeaderboardRecord）

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

export interface LadderProfileProjection {
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  jobCategory: LadderJobCategory | '';
  weeklyTrainingHours: number | null;
  trainingYears: number | null;
  countryCode: LadderCountryCode | '';
  region: string; city: string; district: string;
  isAnonymousInLadder: boolean;
  ageBucket: 'under-20' | '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '70+';
  heightBucket: '<160' | '160-170' | '170-180' | '180-190' | '>190';
  weightBucket:
    | 'under-50kg' | '50-60kg' | '60-70kg' | '70-80kg'
    | '80-90kg' | '90-100kg' | '100-110kg' | '110kg+';
  regionScope: 'country' | 'city' | 'district';
}
```

已知 shard：`ladderScore`, `strength`, `strength_totalFive`, `strength_squat|bench|deadlift|ohp|latPull`, `cardio`, `cardio_5km`, `explosivePower`, `explosive_composite|vertical|broad|sprint`, `bodyFat`, `bodyFat_ffmi`, `muscleMass`, `muscleMass_weightKg`, `muscleMass_ratio`, `gripStrength`, `armSize`。

### 4.6 Dyno Intel（最接近 DynoScore 的執行期契約）

```ts
export interface DynoAxisSnapshot {
  axis: SixAxisMetric;
  score: number | null;
  tierBandId: string | null;
  meaningI18nPrefix: string | null;
  weightInvariant: boolean;
}

export interface DynoIntelContextV1 {
  schemaVersion: 1;
  overallScore: number | null;
  axes: DynoAxisSnapshot[];
  profile: {
    gender: 'male' | 'female';
    ageBucket: DynoAgeBucket; // 去識別化，不送精確年齡
    heightCm: number;
    weightKg: number;
  } | null;
  vehicleClassId: VehicleClassId | null;
  supplementalMetrics: DynoSupplementalMetricSnapshot[];
  scoringMethodologyBriefs: DynoScoringMethodologyBrief[];
  // …intent / gaps / momentum / weightSimulation
}
```

### 4.7 力量單次分解（計算回傳，非 Firestore schema）

```ts
export interface StrengthScoreBreakdown {
  oneRepMax: number;
  rawDots: number;
  ageCoefficient: number;
  correctedDots: number;
  anchorDots: number;
  finalScore: number;
}
```

---

## 附錄 A — 實作 vs 常見文獻公式

| 文獻／預期 | 本產品 |
|---|---|
| Sayers 垂直跳瓦特 | **未實作**；年齡／性別 0–50–100 常模 + 四次溢出 |
| Cooper VO₂max \((d-504.9)/44.73\) | **未實作**；距離常模線性分；VO₂ 僅文案 |
| Kouri FFMI + 6.1(1.8−h) | **已實作** FFM/h²；高個修正係數 **+6(h−1.8)**（僅 h>1.8） |
| Kouri 自然極限 FFMI 25 | **男 25／女 21 = 100 分**；人體硬錨 42／34 |
| IPF DOTS 四階多項式 | **已實作**（上列 A–E） |
| Brzycki 1RM | **已實作** |
| McCulloch 年齡係數 | **已實作** |
| 左右手握力加權 | **未實作**；單一 peakKg |
| 綜合戰力加權（非等權） | **等權 1/6** |
| 黃金認證獨立等級 | **無此 id**；用 Homologation Grade decade 帶 |

## 附錄 B — 關鍵檔案索引

| 檔案 | 職責 |
|---|---|
| `src/logic/core/scoring.ts` | DOTS、McCulloch、Brzycki、六軸 overall、軸上限 200 |
| `src/logic/core/strengthAssessment.ts` | 五項／5 分母複合 |
| `src/logic/core/powerScoring.ts` | 爆發常模與溢出 |
| `src/logic/core/cardioScoring.ts` | Cooper／5 km |
| `src/logic/core/ffmiScoring.ts` | Kouri FFMI 分段 |
| `src/logic/core/muscleScoring.ts` + `muscleStandards.ts` | SMM／SM% |
| `src/logic/core/gripStrength.ts` | 雙段斜率 + 異速生長 |
| `src/logic/core/scoreMeaningCatalog.ts` | Homologation／decade 帶 |
| `src/logic/core/vehicleResolver.ts` | 七種車系原型 |
| `src/i18n/locales/zh-Hant/common/home.json` | 整車認證與車體結構代號 |
| `src/i18n/locales/zh-Hant/common/core.json` | 分軸 hp／Nm／Bar／排量文案 |
