/**
 * Science methodology SSOT for /science.
 * WHY: Mirror app scoring honesty — only cite formulas actually used in product code.
 */

export interface ScienceAxis {
  id: string;
  code: string;
  telemetryCode: string;
  /** Full HUD name, e.g. 馬力頻譜 */
  carMetaphor: string;
  /** Short car-axis label for radar preview, e.g. 馬力 */
  telemetryShort: string;
  titleZh: string;
  inputs: string[];
  formulas: string[];
  normNotes: string[];
  literature: string[];
  /** Explicit non-claims for this axis (honesty firewall). */
  notClaimed?: string[];
}

export interface SpecialtyMetric {
  id: string;
  titleZh: string;
  summary: string;
  notes: string[];
}

export const scoreCharter = {
  axisMax: 200,
  centuryMeaning: '該性別／年齡常模的精英（世紀）門檻',
  overclockBand: '100–200 為超限溢出帶',
  overall:
    '六軸等權算術平均：Overall = round2( (1/6) Σ clamp(sᵢ, 0, 200) )；缺軸以 0 計入',
  specialtiesExcluded: ['臂圍', '100 公尺衝刺', '5 公里跑'],
};

export const strengthLiftAnchors = [
  { key: 'benchPress', name: '自由重量平板臥推', anchorDots: 90, capKg: 370 },
  { key: 'squat', name: '槓鈴深蹲', anchorDots: 140, capKg: 510 },
  { key: 'deadlift', name: '硬舉 (傳統／相撲)', anchorDots: 150, capKg: 550 },
  { key: 'latPulldown', name: '滑輪下拉', anchorDots: 88, capKg: 300 },
  { key: 'shoulderPress', name: '站姿槓鈴肩推', anchorDots: 60, capKg: 244 },
] as const;

export const scienceAxes: ScienceAxis[] = [
  {
    id: 'strength',
    code: 'strength',
    telemetryCode: 'HP',
    carMetaphor: '馬力頻譜',
    telemetryShort: '馬力',
    titleZh: '最大肌力',
    inputs: [
      '五項動作：weightKg + reps ∈ [1,10]',
      '性別、年齡、體重（身高不進公式）',
    ],
    formulas: [
      'Brzycki 1RM：R=1 → 1RM=W；否則 1RM = W × 36/(37 − R_cap)，R_cap = clamp(R,1,15)',
      'IPF DOTS：DOTS = (1RM × 500) / (A w⁴ + B w³ + C w² + D w + E)（男女係數分表）',
      'McCulloch：DOTS_corr = DOTS × C_age（23–40＝1.0；青春期加成；40+ 逐步補償）',
      '錨點正規化：Score_lift = (DOTS_corr / ANCHOR) × 100',
      '雷達複合：五項等權平均（缺項當 0，分母固定 5），clamp 0–200',
    ],
    normNotes: [
      '100 分錨點為各動作 DOTS 目標（見下表）',
      '跨量級公平：體重進 DOTS、年齡進 McCulloch',
    ],
    literature: [
      'Brzycki 1RM 估算',
      'IPF DOTS 四階多項式',
      'McCulloch 年齡係數',
    ],
  },
  {
    id: 'explosivePower',
    code: 'explosivePower',
    telemetryCode: 'TRQ',
    carMetaphor: '扭矩頻譜',
    telemetryShort: '扭矩',
    titleZh: '爆發力',
    inputs: ['原地垂直跳 (cm)', '立定跳遠 (cm)', '性別、年齡桶'],
    formulas: [
      'Score = (Score_VJ + Score_SLJ) / 2（分母固定 2；缺支當 0）',
      '低於 T100：0／50／100 兩段線性對照場測常模',
      '立定跳遠溢出：ΔD_m = (v − s₁₀₀)/100；s = 100 + 40ΔD_m + 45(ΔD_m)⁴',
      '垂直跳溢出：ΔC = v − s₁₀₀；s = 100 + 1.5ΔC + 0.000021502(ΔC)⁴',
    ],
    normNotes: [
      '男 21–30 摘要：垂直跳 30／50／70 cm；立定跳遠 170／220／270 cm',
      'Input caps：垂直跳 ≤135 cm；立定跳遠 ≤390 cm',
      '體重不進爆發力分數',
    ],
    literature: ['年齡×性別場測常模表（程式內建）', '產品四次溢出曲線'],
    notClaimed: ['未實作 Sayers 功瓦進分數'],
  },
  {
    id: 'cardio',
    code: 'cardio',
    telemetryCode: 'STINT',
    carMetaphor: '續航頻譜',
    telemetryShort: '續航',
    titleZh: '心肺耐力',
    inputs: ['Cooper 12 分鐘跑距離 (m)', '性別、年齡'],
    formulas: [
      '僅用 60 與 100 錨點斜率：s = 60 + (d − d₆₀) × 40/(d₁₀₀ − d₆₀)',
      '再 round2／max(0)；距離上限男 4900 m／女 4400 m',
    ],
    normNotes: [
      '雷達軸僅採 Cooper 距離常模',
      '5 公里跑為專項榮譽指標，不進六軸',
    ],
    literature: ['Cooper 12 分鐘跑距離常模（性別×年齡，程式內建）'],
    notClaimed: [
      '未將 VO₂max 解析式算進分數（文案可提 VO₂ 語意）',
      '非 ACSM／NSCA 函式庫常數直接引用',
    ],
  },
  {
    id: 'muscleMass',
    code: 'muscleMass',
    telemetryCode: 'CHSS',
    carMetaphor: '車體外觀頻譜',
    telemetryShort: '車體',
    titleZh: '骨骼肌量',
    inputs: ['儀器測得 SMM (kg)', '體重 → SM% = SMM/W×100', '性別、年齡'],
    formulas: [
      '雙維：SMM kg 與 SM% 對照年齡×性別十分位常模',
      '超過 100 錨點延長；>120 半斜率',
      '合成：基準等權；巨獸帶（SMM 分支>100）改 0.8／0.2，取 max；clamp 0–200',
    ],
    normNotes: [
      '輸入天花板：男 100 kg／女 67 kg',
      '非由身高推估 SMM',
    ],
    literature: ['程式內建年齡×性別十分位常模（SMM kg 與 SM%）'],
  },
  {
    id: 'bodyFat',
    code: 'bodyFat',
    telemetryCode: 'P2W',
    carMetaphor: '引擎排量頻譜',
    telemetryShort: '排量',
    titleZh: 'FFMI',
    inputs: ['身高、體重、體脂%（輸入 [3,60]%）'],
    formulas: [
      'FFM = W(1 − BF%/100)；FFMI_raw = FFM / h_m²',
      'FFMI_adj = FFMI_raw + 6(h_m − 1.8)（僅 h_m > 1.8；產品高個係數為 6）',
      '男：60 分＝18.5；100 分＝25；溢出 +5 分／單位',
      '女：60 分＝15.5；100 分＝21；溢出 +5 分／單位',
    ],
    normNotes: [
      'Kouri 1995「自然男 ~25」對應本產品 100 分門檻；女 21＝100 分',
      '年齡不進公式',
    ],
    literature: ['Kouri 系調整 FFMI（產品係數 6，非文獻常見 6.1）', '產品分段給分'],
  },
  {
    id: 'gripStrength',
    code: 'gripStrength',
    telemetryCode: 'GRIP',
    carMetaphor: '抓地頻譜',
    telemetryShort: '抓地',
    titleZh: '握力',
    inputs: ['握力峰值 peakKg', '性別、體重（異速生長因子）'],
    formulas: [
      '雙段斜率 + 異速生長體重因子',
      '男：線性倍率 1.4；世紀門檻 72 kg；體重錨 75 kg',
      '女：線性倍率 2.24；世紀門檻 45 kg；體重錨 55 kg',
      'W ≤ W_anchor 用指數 0.5；較重用 0.3333',
      'Score = clamp(round1(raw × W_factor), 0, 200)；世紀分數 100.8',
    ],
    normNotes: ['峰值天花板：男 200 kg／女 110 kg', '未實作左右手分別輸入'],
    literature: ['程式內建雙段斜率與異速生長握力因子'],
  },
];

export const specialtyMetrics: SpecialtyMetric[] = [
  {
    id: 'armSize',
    titleZh: '臂圍',
    summary:
      '專項榮譽指標，不進入六軸綜合戰力。依臂圍與體脂相對基準正規化。',
    notes: [
      '男基準 50 cm／BF 20%；女 35 cm／18%',
      's = (arm/benchmark) × (1 + (BF_base − BF%)/100) × 100',
    ],
  },
  {
    id: 'sprint100m',
    titleZh: '100 公尺衝刺',
    summary:
      '專項榮譽指標。0／50／100 錨點與輸入地板由分齡世界紀錄（WR）常模衍生。',
    notes: [
      '程式內建 WR 秒數表 → T100 = WR + 1.42；地板 = WR − 0.13',
      '不稀釋六軸 overall；非 ACSM／NSCA 常數來源',
    ],
  },
  {
    id: 'run5k',
    titleZh: '5 公里跑',
    summary: '專項榮譽指標。T0–T100 線性；快於 T100 四次溢出；不進雷達軸。',
    notes: ['WR 地板參考：男 12:20／女 13:40', '心肺雷達軸僅採 Cooper'],
  },
];
