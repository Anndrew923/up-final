/**
 * v5.2 — Shared population-class pyramid + overall/neuro/volume praise slots (zh-Hant).
 * DESIGN INTENT: zh macro uses dedicated overall copy while micro keeps neuro/volume routing.
 * v5.3 — en overlay: all decades 0–150 weld synced EN epic praise from i18n (parity with zh-Hant).
 */

import {
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE,
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN,
} from "./dynoIntelHumanPraise.data.js";

function resolvePraiseByDecade(locale, decadeKey) {
  if (locale === "en") {
    return (
      DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN[decadeKey] ??
      DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN["0"] ??
      null
    );
  }
  return DYNO_INTEL_HUMAN_PRAISE_BY_DECADE[decadeKey] ?? DYNO_INTEL_HUMAN_PRAISE_BY_DECADE["0"];
}

/**
 * zh-Hant + en: merge synced praise slots (overall / neuro / volume) when i18n corpus exists.
 */
function scaleBucket({ decadeKey, tierId, scoreRange, populationClass, summaryHuman, locale = "zh-Hant" }) {
  const praise = resolvePraiseByDecade(locale, decadeKey);

  if (locale === "en" && !praise) {
    return {
      tierId,
      scoreRange,
      populationClass,
      summaryHuman,
      overall: summaryHuman,
      neuro_male: summaryHuman,
      neuro_female: summaryHuman,
      volume_male: summaryHuman,
      volume_female: summaryHuman,
    };
  }

  const overall = praise?.overall ?? summaryHuman;
  const neuro = praise?.neuro ?? summaryHuman;
  const volume = praise?.volume ?? summaryHuman;
  return {
    tierId,
    scoreRange,
    populationClass: praise?.populationClass ?? populationClass,
    summaryHuman: overall,
    overall,
    neuro_male: neuro,
    neuro_female: neuro,
    volume_male: volume,
    volume_female: volume,
  };
}

const scaleBucketEn = (row) => scaleBucket({ ...row, locale: "en" });

export const DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH = {
  "150": scaleBucket({
    decadeKey: "150",
    tierId: "LEGEND",
    scoreRange: "150+",
    populationClass: "突破生理常模極限",
    summaryHuman:
      "已完全突破人類生理科學的既有常模極限，神經募集速度與骨骼肌極限承載展現非人哉的殿堂級主權。",
  }),
  "140": scaleBucket({
    decadeKey: "140",
    tierId: "TIER_140",
    scoreRange: "140–149",
    populationClass: "極限天賦神殿層級",
    summaryHuman:
      "站上全球人類基因與天賦的終極神殿層級，生理機能指標具備極致非凡的專項統治力。",
  }),
  "130": scaleBucket({
    decadeKey: "130",
    tierId: "TIER_130",
    scoreRange: "130–139",
    populationClass: "世界頂尖運動員層級",
    summaryHuman:
      "生理讀數完全對標世界頂尖運動員層級，在國際級超高強度對抗中展現毫無死角的絕對專項輸出。",
  }),
  "120": scaleBucket({
    decadeKey: "120",
    tierId: "TIER_120",
    scoreRange: "120–129",
    populationClass: "國際大師級運動員",
    summaryHuman:
      "具備國際大師級運動員的硬核體能基礎，專項能量系統與主要肌群募集大幅甩開常規競技常模。",
  }),
  "110": scaleBucket({
    decadeKey: "110",
    tierId: "TIER_110",
    scoreRange: "110–119",
    populationClass: "國家級頂尖運動員",
    summaryHuman:
      "生理常模精準錨定在國家級頂尖運動員之列，多關節協同穩定與絕對爆發輸出逼近該項目金字塔頂端。",
  }),
  "100": scaleBucket({
    decadeKey: "100",
    tierId: "TIER_100",
    scoreRange: "100–109",
    populationClass: "國家級賽事常勝軍",
    summaryHuman:
      "具備國家級賽事常勝軍的生理底蘊，在各高難度規律阻力或心肺週期中展現穩固的專業競技型態。",
  }),
  "90": scaleBucket({
    decadeKey: "90",
    tierId: "TIER_90",
    scoreRange: "90–99",
    populationClass: "地區型各類賽事常勝軍",
    summaryHuman:
      "已成為地區型各類賽事常勝軍的指標常模，多關節大重量動作中肌群協同極佳，展現清晰降維長板。",
  }),
  "80": scaleBucket({
    decadeKey: "80",
    tierId: "TIER_80",
    scoreRange: "80–89",
    populationClass: "業餘運動員中優秀表現",
    summaryHuman:
      "在業餘運動員群體中展現極其優秀的常模表現，主要肌群儲備厚實，生理機能處於同齡顯著高位。",
  }),
  "70": scaleBucket({
    decadeKey: "70",
    tierId: "TIER_70",
    scoreRange: "70–79",
    populationClass: "商業健身房傑出族群",
    summaryHuman:
      "已站上商業健身房的傑出菁英族群之列，具備深刻且規律的科學訓練痕跡，穩定超越業餘大眾。",
  }),
  "60": scaleBucket({
    decadeKey: "60",
    tierId: "TIER_60",
    scoreRange: "60–69",
    populationClass: "擁有規律運動習慣族群（略優於大眾水平）",
    summaryHuman:
      "具備良好且規律的日常運動習慣，多關節協同動作流暢，各項讀數穩定高於群體平均水平。",
  }),
  "50": scaleBucket({
    decadeKey: "50",
    tierId: "TIER_50",
    scoreRange: "50–59",
    populationClass: "健康常模大眾平均水平",
    summaryHuman:
      "精準鎖定在同齡健康大眾的平均水平基準線，生理功能指標皆符合標準體態健康常模。",
  }),
  "40": scaleBucket({
    decadeKey: "40",
    tierId: "TIER_40",
    scoreRange: "40–49",
    populationClass: "擁有巨大進步潛力新手期",
    summaryHuman:
      "正處於擁有巨大進步潛力的體能初始新手期，主要肌群募集與基礎機能具備清晰的優化提升空間。",
  }),
  "0": scaleBucket({
    decadeKey: "0",
    tierId: "BASE",
    scoreRange: "0–39",
    populationClass: "生理低谷／亟需啟動評測頁調校",
    summaryHuman:
      "相關肌群長期缺乏阻力刺激導致募集效率下滑，生理機能處於低谷，亟需透過評測引導啟動身體機能調校。",
  }),
};

export const DYNO_INTEL_HUMAN_SCALE_MATRIX_EN = {
  "150": scaleBucketEn({
    decadeKey: "150",
    tierId: "LEGEND",
    scoreRange: "150+",
    populationClass: "beyond conventional physiological norms",
    summaryHuman:
      "You have broken past established human physiological norms — recruitment speed and skeletal loading show hall-of-fame dominance.",
  }),
  "140": scaleBucketEn({
    decadeKey: "140",
    tierId: "TIER_140",
    scoreRange: "140–149",
    populationClass: "extreme talent temple tier",
    summaryHuman:
      "You sit at the global genetic ceiling with rare specialist dominance across every physiological read.",
  }),
  "130": scaleBucketEn({
    decadeKey: "130",
    tierId: "TIER_130",
    scoreRange: "130–139",
    populationClass: "world-top athlete tier",
    summaryHuman:
      "Your reads benchmark world-top athletes with airtight specialty output under international-level stress.",
  }),
  "120": scaleBucketEn({
    decadeKey: "120",
    tierId: "TIER_120",
    scoreRange: "120–129",
    populationClass: "international master athlete",
    summaryHuman:
      "You carry an international master-athlete base — energy systems and major-muscle recruitment sit far above conventional competitive norms.",
  }),
  "110": scaleBucketEn({
    decadeKey: "110",
    tierId: "TIER_110",
    scoreRange: "110–119",
    populationClass: "national elite athlete",
    summaryHuman:
      "You anchor in the national elite band with stable multi-joint synergy and peak explosive output near the sport pyramid top.",
  }),
  "100": scaleBucketEn({
    decadeKey: "100",
    tierId: "TIER_100",
    scoreRange: "100–109",
    populationClass: "national event perennial winner",
    summaryHuman:
      "You hold national-event winner physiology with stable professional competitive patterns across hard training blocks.",
  }),
  "90": scaleBucketEn({
    decadeKey: "90",
    tierId: "TIER_90",
    scoreRange: "90–99",
    populationClass: "regional multi-event perennial winner",
    summaryHuman:
      "You are a regional multi-event benchmark with excellent multi-joint loading synergy and a clear specialty edge.",
  }),
  "80": scaleBucketEn({
    decadeKey: "80",
    tierId: "TIER_80",
    scoreRange: "80–89",
    populationClass: "strong amateur athlete performance",
    summaryHuman:
      "Among amateur athletes you show standout norms with thick major-muscle reserves and clearly above-average physiology.",
  }),
  "70": scaleBucketEn({
    decadeKey: "70",
    tierId: "TIER_70",
    scoreRange: "70–79",
    populationClass: "standout commercial-gym cohort",
    summaryHuman:
      "You rank among standout commercial-gym performers with deep, consistent training traces above the amateur majority.",
  }),
  "60": scaleBucketEn({
    decadeKey: "60",
    tierId: "TIER_60",
    scoreRange: "60–69",
    populationClass: "regular exerciser slightly above average",
    summaryHuman:
      "You maintain regular exercise habits with fluent multi-joint patterns and reads above population average.",
  }),
  "50": scaleBucketEn({
    decadeKey: "50",
    tierId: "TIER_50",
    scoreRange: "50–59",
    populationClass: "healthy population average",
    summaryHuman:
      "You lock onto the healthy same-age average baseline with standard physiological markers.",
  }),
  "40": scaleBucketEn({
    decadeKey: "40",
    tierId: "TIER_40",
    scoreRange: "40–49",
    populationClass: "high-upside beginner phase",
    summaryHuman:
      "You are in a high-upside beginner phase with clear room to improve recruitment and base capacity.",
  }),
  "0": scaleBucketEn({
    decadeKey: "0",
    tierId: "BASE",
    scoreRange: "0–39",
    populationClass: "physiological low point needing assessment reset",
    summaryHuman:
      "Long-term under-stimulation has dragged recruitment efficiency down — assessment-guided rebuilding is the priority.",
  }),
};
