/**
 * Science methodology SSOT for /science.
 * WHY: Public copy teaches physiology & model architecture only — no internal tuning constants
 * (IP fence). Validity notes stay measurement-science framing for adult trainees & athletes.
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
  /** Public model architecture — no proprietary calibration constants. */
  formulas: string[];
  /**
   * Theory / tool-calculator contrast that must NOT be read as radar scoring.
   * Rendered outside the formula box so long contrast copy stays body weight.
   */
  contrastNotes?: string[];
  normNotes: string[];
  literature: string[];
}

export interface SpecialtyMetric {
  id: string;
  titleZh: string;
  summary: string;
  notes: string[];
}

export interface AcademicReference {
  id: string;
  /** Authors (year). Title. — everything before the journal name. */
  lead: string;
  /** Journal title — rendered in italics per APA. */
  journal: string;
  /** Volume(issue), pages. */
  trailing: string;
  doiUrl?: string;
}

export interface StrengthLiftPublicRow {
  key: string;
  name: string;
  biomechanics: string;
  normRole: string;
}

export const scoreCharter = {
  /** Public single-axis theoretical ceiling (not a hidden tuning knob). */
  axisMax: 200,
  /** 100-point elite athlete benchmark wording (field kept free of internal jargon). */
  eliteBenchmarkMeaning:
    '該生理性別與年齡常模下之頂尖運動員基準線（100 分錨點）',
  overclockBand:
    '突破 100 分精英基準線即進入「破百超頻」區間，系統將啟動高階溢位曲線持續向上累計至單軸理論上限 200 分',
  overall:
    '六大維度均衡評量機制：綜合戰力由六項核心軸線共同構成（未測試之項目以 0 分計入，鼓勵全能發展；單軸最高收斂至 200 分）',
  specialtiesExcluded: ['臂圍', '100 公尺衝刺', '5 公里跑'],
};

/** Five-lift public table — biomechanics & role only; no proprietary lift ceilings. */
export const strengthLiftCatalog: readonly StrengthLiftPublicRow[] = [
  {
    key: 'benchPress',
    name: '自由重量平板臥推',
    biomechanics: '上肢水平推（胸大肌、前三角肌、肱三頭肌）',
    normRole: '以國際健力標準平板臥推常模建立 100 分精英基準線',
  },
  {
    key: 'squat',
    name: '槓鈴深蹲',
    biomechanics: '下肢前側鏈與核心抗屈曲（股四頭肌、臀大肌、豎脊肌）',
    normRole: '對照全蹲力學負荷與跨量級 DOTS 基準曲線',
  },
  {
    key: 'deadlift',
    name: '硬舉 (傳統／相撲)',
    biomechanics: '全身後側鏈最大力量輸出（膕繩肌、臀肌、背闊肌與握持）',
    normRole: '涵蓋傳統與相撲站姿之絕對拉舉力量常模',
  },
  {
    key: 'latPulldown',
    name: '滑輪下拉',
    biomechanics: '上肢垂直拉（背闊肌、大圓肌、肱二頭肌）',
    normRole: '量化上肢垂直拉力相對於體重負荷之結構平衡',
  },
  {
    key: 'shoulderPress',
    name: '站姿槓鈴肩推',
    biomechanics: '上肢垂直推與核心穩定（三角肌群、上胸、核心肌群）',
    normRole: '排除下肢借力之純粹上肢過頭推舉力量基準',
  },
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
      '五項核心複合動作：負載重量 (kg) 與反覆次數（建議 1–10 次以確保最佳推估效度；演算法安全上限為 15 次）',
      '生理性別、年齡與體重（身高不納入肌力計算，避免身形比例重複加權）',
    ],
    formulas: [
      '次最大肌力推估（Brzycki 模型）：單次最大負荷（R = 1）直接採計實測重量；多次反覆則依 1RM = W × [36 / (37 − R)] 推算（反覆次數上限收斂於 15 次）',
      '跨量級正規化（BVDK / Konertz DOTS 模型）：DOTS = (1RM × 500) / (A·w⁴ + B·w³ + C·w² + D·w + E)，男女性別各自套用獨立的四次多項式生理常模係數',
      '分齡生理校準（McCulloch 年齡係數）：針對成年黃金期以外之年齡層進行非線性生理加權補償，使不同年齡段皆能公平對照',
      '基準錨點正規化：將校準後之 DOTS 數值對照各動作專屬之頂尖精英基準線換算為百分制分數；突破基準線後可持續向上累積至 200 分理論上限',
      '五項動作綜合評分：由五大核心動作等權構成肌力維度總分（未輸入之動作以 0 分計入），完整反映全身推、拉、蹲、舉之均衡肌力',
    ],
    contrastNotes: [
      'Epley (1985)、Lander (1985) 等次最大負荷推估公式僅用於工具計算器之學理對照，不進入六軸肌力雷達計分。',
      '平方立方定律與 Jaric et al. (2005) 之異速生長標度（表現量近似與體重的 0.67 次方相關）為跨量級正規化的生物物理學背景；DOTS 與 McCulloch 係數本身屬國際力量賽事經驗回歸常模，並非由該標度第一原理直接導出。',
    ],
    normNotes: [
      '100 分錨點為各動作對應之頂尖精英 DOTS 基準線（見下方動作對照表之常模定位說明）',
      '測量學邊界：Brzycki (1993) 於低反覆（約 R ≤ 10，相當於 80%–85% 1RM）具高預測效度（r = 0.88–0.93；標準估計誤差 SEE ≈ 4–8 kg）；當反覆次數明顯超過此區間時，能量代謝由磷酸原系統轉向無氧糖解，疲勞曲線呈非線性偏離，推估易產生高估偏差',
      '跨量級正規化：絕對肌力近似隨生理橫截面積（∝ L²）成長，體重與體積近似 ∝ L³（平方立方定律）；異速生長標度理論提出表現量與體重呈約 0.67 次方關係（Jaric et al., 2005）——作為理解「為何必須體重正規化」的生物物理學背景',
      '常模性質標註：DOTS 係數屬德國健力聯會 BVDK／Tim Konertz (2019) 之國際力量賽事經驗回歸模型，非生理學第一原理推導；McCulloch 年齡係數同屬分齡經驗補償常模',
    ],
    literature: [
      'Brzycki (1993) 次最大負荷 1RM 推估',
      'BVDK / Konertz (2019) DOTS 四次多項式經驗回歸',
      'McCulloch 分齡年齡係數（經驗常模）',
      'Jaric et al. (2005) 體型正規化與異速生長標度（學理背景）',
      'Epley (1985)／Lander (1985)：工具計算器學理對照，非主雷達計分',
    ],
  },
  {
    id: 'explosivePower',
    code: 'explosivePower',
    telemetryCode: 'TRQ',
    carMetaphor: '扭矩頻譜',
    telemetryShort: '扭矩',
    titleZh: '爆發力',
    inputs: [
      '原地垂直跳高度 (cm) 與立定跳遠距離 (cm)',
      '生理性別與年齡區間（體重不納入爆發力計算，專注評估下肢神經肌肉瞬間徵召效率）',
    ],
    formulas: [
      '雙項目等權複合：由垂直跳與立定跳遠兩項場測成績共同構成爆發力維度總分（單項未測以 0 分計入），兼顧垂直彈跳與水平動量轉移能力',
      '基準線內分段線性插值：在達到 100 分精英基準線前，依生理性別與年齡常模採雙段線性模型映射，精準區分基礎體能與進階運動員表現',
      '破百超頻四次方溢位曲線：當跳躍表現超越 100 分精英基準線後，系統自動啟動非線性四次多項式溢位曲線（Quartic Overflow），為頂尖爆發力選手提供高鑑別度的進階給分空間，並收斂於 200 分理論上限',
    ],
    normNotes: [
      '測驗設計邏輯：垂直跳著重評估下肢牽張－縮短週期（SSC）之純粹垂直功率輸出；立定跳遠則同步考驗髖膝踝三關節伸展協調、上肢擺臂動量轉移與動態著地控制',
      '建構效度實證：場地跳躍測驗與實驗室測力板（Force Plate）峰值功率及等速肌力儀測量結果具備高度建構效度（r = 0.82–0.86；Castro-Piñero et al., 2010），垂直跳場測體系最早可追溯至 Sargent (1921)',
      '極端值防呆保護：系統內建符合人體生物力學極限之合理輸入邊界與分數封頂機制，過濾異常輸入干擾',
    ],
    literature: [
      '年齡×性別場測常模',
      '破百後四次多項式溢位架構',
      'Sargent (1921)；場測效標綜述見 Castro-Piñero et al. (2010)',
    ],
  },
  {
    id: 'cardio',
    code: 'cardio',
    telemetryCode: 'STINT',
    carMetaphor: '續航頻譜',
    telemetryShort: '續航',
    titleZh: '心肺耐力',
    inputs: ['Cooper 12 分鐘跑走總距離 (m)', '生理性別與年齡區間'],
    formulas: [
      '性別與年齡分層距離常模：將 12 分鐘內完成之最大跑走距離，直接對照同性別與同齡層之運動生理學距離基準線進行線性正規化映射',
      '破百線性外延機制：當跑走距離超越 100 分精英基準線時，維持穩定斜率持續向上累計，最高收斂至 200 分理論上限',
    ],
    contrastNotes: [
      '本評測軸採用實測距離常模直接計分，不以估算之最大攝氧量（VO₂max）公式重複換算；Cooper (1968) 所驗證之 12 分鐘跑與實驗室跑步機氣體代謝分析儀高度相關性（r = 0.85–0.90），作為本測驗具備高心肺效度之運動生理學依據。',
    ],
    normNotes: [
      '能量代謝與配速效度：相較於折返跑易受急停轉向與敏捷度干擾，12 分鐘連續跑走測驗能更純粹地反映心肺循環恆定態（Steady-State）與周邊骨骼肌微血管有氧代謝能力',
      '專項區隔：5 公里長跑列入「專項榮譽指標」獨立呈現，不與 12 分鐘跑重複計入六軸綜合戰力',
    ],
    literature: [
      'Cooper (1968) 12 分鐘跑與最大攝氧量相關',
      '性別×年齡距離常模（產品計分架構）',
    ],
  },
  {
    id: 'muscleMass',
    code: 'muscleMass',
    telemetryCode: 'CHSS',
    carMetaphor: '車體外觀頻譜',
    telemetryShort: '車體',
    titleZh: '骨骼肌量',
    inputs: [
      '多頻生物電阻抗（BIA）或 DEXA 儀器實測之全身骨骼肌重 SMM (kg)',
      '總體重 (kg)（系統自動換算骨骼肌率 SM% = SMM / 體重 × 100%）',
      '生理性別與年齡區間',
    ],
    formulas: [
      '雙維度百分位常模評估：同時考量「絕對骨骼肌量（SMM）」與「相對骨骼肌率（SM%）」，分別對照同性別、同年齡層之族群分佈常模進行分段線性映射',
      '高肌量動態權重與收斂保護：當絕對骨骼肌量突破 100 分精英基準線時，系統自動提升絕對肌量維度之權重占比，避免重型肌肥大訓練者因體重基數較高而在肌量率上受到懲罰；超過高階門檻後則啟動斜率收斂機制，平穩過渡至 200 分上限',
    ],
    normNotes: [
      '雙指標分離設計：堅持以儀器實測骨骼肌量為準，不以身高公式粗略推估；並將「骨骼肌量」與「FFMI」拆分為兩個獨立評測軸，精準區分「絕對肌肉總量」與「身高比例下的去脂體組成密度」',
      '極端值保護：系統內建符合人類生理極限之骨骼肌量有效檢核區間，確保體組成數據之客觀真實性',
    ],
    literature: ['年齡×性別十分位常模（SMM kg 與 SM%）'],
  },
  {
    id: 'bodyFat',
    code: 'bodyFat',
    telemetryCode: 'P2W',
    carMetaphor: '引擎排量頻譜',
    telemetryShort: '排量',
    titleZh: 'FFMI',
    inputs: ['身高 (cm)、體重 (kg) 與體脂率 (%)（輸入有效檢核區間為 3%–60%）'],
    formulas: [
      '去脂體重與原始指數：FFM = 體重 × (1 − 體脂率 / 100)；FFMI_raw = FFM / 身高(m)²',
      '身高比例補償校正（參考 Kouri et al., 1995 架構）：當身高超過 1.80 公尺時，啟動線性身高補償調整 FFMI_adj = FFMI_raw + k × (h − 1.8)（僅針對 h > 1.8 m 進行上修，消除高個子在身高平方分母下的幾何比例不利）',
      '性別獨立分段常模：依男女性別生理差異設定獨立及格線與 100 分自然人精英基準線，突破基準線後採線性溢位機制向上累計至 200 分上限',
    ],
    normNotes: [
      '超越傳統 BMI 盲點：傳統身體質量指數（BMI）無法區分脂肪與骨骼肌，極易將高肌量訓練者誤判為過重；無脂肪質量指數（FFMI）能精準反映骨架上的純肌肉承載密度',
      '學理基準與參數保護：參考 Kouri et al. (1995) 針對自然訓練者與藥物使用者之去脂體組成研究建立男女基準常模；年齡不納入 FFMI 公式，專注呈現當下純粹的體組成品質',
    ],
    literature: ['Kouri et al. (1995) 身高補償 FFMI', '性別獨立分段給分架構（產品常模）'],
  },
  {
    id: 'gripStrength',
    code: 'gripStrength',
    telemetryCode: 'GRIP',
    carMetaphor: '抓地頻譜',
    telemetryShort: '抓地',
    titleZh: '握力',
    inputs: [
      '單手等長握力峰值（kg，採左右手最佳成績）',
      '生理性別與體重（kg，用於非線性體重尺度正規化）',
    ],
    formulas: [
      '雙段線性常模曲線：依生理性別套用獨立基準斜率——在達到 100 分精英基準線前採標準線性遞增；突破精英基準線後切換為較平緩之高階超頻斜率，使世界級握力表現能平順收斂至 200 分上限，避免線性溢位失真',
      '分段式非線性體重縮放因子：以男女各自之標準體重錨點為界，低於基準體重者採用較溫和之冪次補償，高於基準體重者則切換為更嚴格之冪次收斂，客觀抵銷大體重選手在握力器上的絕對體型紅利',
    ],
    contrastNotes: [
      '生物物理學依據：根據平方立方定律，肌肉力量近似與生理橫截面積（L²）成正比，體重則與體積（L³）成正比。本系統參考 Jaric et al. (2005) 異速生長標度（Allometric Scaling）之體重正規化精神，設計分段式非線性體重縮放模型，而非直接套用單一理論閉式解。',
    ],
    normNotes: [
      '全身神經肌力風向球：大量運動醫學與流行病學研究證實，等長握力具備極高之儀器再測信度（ICC > 0.90），且與全身多處肌群綜合力量呈現顯著正相關（r = 0.70–0.80；Bohannon, 2008, 2019），是評估中樞神經運動單元徵召效率與抗疲勞狀態的關鍵指標',
      '極端值防呆保護：系統內建符合人類生理極限之握力峰值檢核上限，過濾異常讀數',
    ],
    literature: [
      'Bohannon (2008, 2019) 握力信效度與生物標記文獻',
      '雙段斜率與異速生長體重縮放（產品架構）',
    ],
  },
];

/**
 * Vehicle / dyno lexicon overlay — derived from scienceAxes (single source).
 * WHY: Scores are physiology-only; telemetry labels are a visualization/game layer.
 */
export const telemetryMapping = {
  kicker: '動力遙測映射',
  title: '動力遙測映射（Telemetry Mapping）',
  coreRule:
    '計分核心 100% 基於運動生理學公式與常模；切換「遙測頻譜」不會重算任何分數。車輛遙測映射是建立在真實評分之上的視覺化與遊戲化轉譯層，僅改標籤語彙。',
  pairsLead: '六大生理軸與動力遙測頻譜對應（對齊主程式詞彙）：',
  pairs: scienceAxes.map((axis) => ({
    id: axis.id,
    physique: axis.titleZh,
    spectrum: axis.carMetaphor,
  })),
} as const;

export const specialtyMetrics: SpecialtyMetric[] = [
  {
    id: 'armSize',
    titleZh: '臂圍',
    summary:
      '專項榮譽指標（獨立呈現，不計入六軸綜合戰力）。結合上臂圍度與體脂率進行雙重正規化，排除高體脂帶來的虛胖圍度紅利。',
    notes: [
      '去脂圍度校準邏輯：依生理性別設定標準臂圍與基準體脂率門檻；當實測體脂率低於基準時給予額外線條加成，高於基準時則依比例折減，確保高分代表貨真價實的肌肉圍度',
      '獨立榮譽機制：專項指標旨在滿足特定肌肥大與競技愛好者的自我挑戰需求，不稀釋六軸全能戰力評分',
    ],
  },
  {
    id: 'sprint100m',
    titleZh: '100 公尺衝刺',
    summary:
      '專項榮譽指標（獨立呈現，不計入六軸綜合戰力）。以國際田徑分齡世界紀錄（WR）常模為基準，量化無氧磷酸原系統之極限衝刺速度。',
    notes: [
      '分齡世界紀錄動態錨定：依據受測者之生理性別與年齡層，動態對應國際分齡短跑紀錄常模推算 100 分精英基準線與生理極限邊界',
      '與雷達爆發力之區隔：100 公尺衝刺受跑道材質、起跑反應與風速等場地變因影響較大，故列為專項榮譽；六軸雷達之爆發力則採用標準化原地垂直跳與立定跳遠，確保任何場地皆能精準複測',
    ],
  },
  {
    id: 'run5k',
    titleZh: '5 公里跑',
    summary:
      '專項榮譽指標（獨立呈現，不計入六軸綜合戰力）。評估長距離乳酸閾值巡航與有氧耐力續航表現。',
    notes: [
      '分段線性與超頻溢位：對照性別與分齡長跑常模進行線性映射，突破 100 分精英基準線後啟動高階四次方溢位曲線，精準區分進階市民跑者與競技級選手',
      '與雷達心肺軸之區隔：六軸雷達統一採用時間固定（12 分鐘）之 Cooper 測驗以利跨族群標準化比較；5 公里完賽時間則作為長距離耐力專項之進階勳章',
    ],
  },
];

/**
 * Peer-reviewed references for /science footer — alphabetical by first author surname.
 * DOI links only when a stable DOI was verified for the citation.
 */
export const academicReferences: AcademicReference[] = [
  {
    id: 'bohannon-2008',
    lead: 'Bohannon, R. W. (2008). Hand-grip dynamometry predicts future outcomes in aging adults. ',
    journal: 'Journal of Geriatric Physical Therapy',
    trailing: ', 31(1), 3–10.',
    doiUrl: 'https://doi.org/10.1519/00139143-200831010-00002',
  },
  {
    id: 'bohannon-2019',
    lead: 'Bohannon, R. W. (2019). Grip strength: An indispensable biomarker for older adults. ',
    journal: 'Clinical Interventions in Aging',
    trailing: ', 14, 1681–1691.',
    doiUrl: 'https://doi.org/10.2147/CIA.S194543',
  },
  {
    id: 'brzycki-1993',
    lead: 'Brzycki, M. (1993). Strength testing—Predicting a one-rep max from reps-to-fatigue. ',
    journal: 'Journal of Physical Education, Recreation & Dance',
    trailing: ', 64(1), 88–90.',
    doiUrl: 'https://doi.org/10.1080/07303084.1993.10606684',
  },
  {
    id: 'castro-pinero-2010',
    lead: 'Castro-Piñero, J., Artero, E. G., España-Romero, V., Ortega, F. B., Sjöström, M., Suni, J., & Ruiz, J. R. (2010). Criterion-related validity of field-based fitness tests in youth: A systematic review. ',
    journal: 'British Journal of Sports Medicine',
    trailing: ', 44(13), 934–943.',
    doiUrl: 'https://doi.org/10.1136/bjsm.2009.058321',
  },
  {
    id: 'cooper-1968',
    lead: 'Cooper, K. H. (1968). A means of assessing maximal oxygen intake: Correlation between field and treadmill testing. ',
    journal: 'JAMA',
    trailing: ', 203(3), 201–204.',
    doiUrl: 'https://doi.org/10.1001/jama.1968.03140030033008',
  },
  {
    id: 'jaric-2005',
    lead: 'Jaric, S., Mirkov, D., & Markovic, G. (2005). Normalizing physical performance tests for body size: A proposal for standardization. ',
    journal: 'Journal of Strength and Conditioning Research',
    trailing: ', 19(2), 467–474.',
  },
  {
    id: 'kouri-1995',
    lead: 'Kouri, E. M., Pope, H. G., Jr., Katz, D. L., & Oliva, P. (1995). Fat-free mass index in users and nonusers of anabolic-androgenic steroids. ',
    journal: 'Clinical Journal of Sport Medicine',
    trailing: ', 5(4), 223–228.',
    doiUrl: 'https://doi.org/10.1097/00042752-199510000-00003',
  },
  {
    id: 'lander-1985',
    lead: 'Lander, J. (1985). Maximum based on reps. ',
    journal: 'National Strength and Conditioning Association Journal',
    trailing: ', 6(6), 60–61.',
  },
  {
    id: 'sargent-1921',
    lead: 'Sargent, D. A. (1921). The physical test of a man. ',
    journal: 'American Physical Education Review',
    trailing: ', 26(4), 188–194.',
    doiUrl: 'https://doi.org/10.1080/23267224.1921.10650486',
  },
];

/** DOI path after host — keeps mobile reference rows readable while href stays absolute. */
export function doiDisplayLabel(doiUrl: string): string {
  return doiUrl.replace(/^https?:\/\/(dx\.)?doi\.org\//i, 'doi.org/');
}
