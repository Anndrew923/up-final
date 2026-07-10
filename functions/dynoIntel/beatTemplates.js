/**
 * v2.4.5 — Dyno Intel beat template codex (static copy only).
 * WHY: Isolate human/vehicle fallback prose from repair heuristics so hotfixes
 *      do not bloat the quality-gate pipeline.
 */
import { detectQuestionFocusSupplemental } from "./resolveQuestionIntent.js";

/** Future tier-dynamic slot — interpolate via interpolateTemplateSlots(). */
export const TIER_TITLE_SLOT = "{tierTitle}";

export const ACADEMIC_BOILERPLATE_MARKERS =
  /這份級距標題|解碼主軸|評估輸出密度|常模中的站位|輸出密度|tier title corresponds/i;

export const HUMAN_BEAT_MARKERS =
  /神經肌肉|募集|常模|人體|生理|競技體育|NBA|健力|舉重|制動|骨骼肌|心肺儲能|爆發起跳|握力評分|同齡一般人|業餘上限|校隊|跳箱|擼鐵|臂圍|FFMI|業餘跑者|健力選手/i;

export const VEHICLE_BEAT_MARKERS =
  /遙測底盤|熱熔|輪胎|煞車|抓地頻譜|馬力|扭矩|排量|渦輪|底盤中|傳動|彈射|冷卻續航|車架剛性|空力噸位|重載動作/i;

/** v2.4.4 — status P1: ladder contrast + cinematic scene (zh); no scores. */
export const AXIS_HUMAN_STATUS_ZH = {
  gripStrength:
    "以同齡一般人的常模梯隊來看，你的手部握力與指力募集已明顯高於業餘上限，正面突破常人天花板並逼近專項運動員的鋼鐵強度。這份抓握制動天賦，代表在前臂屈肌群的高剛性爆發下，你能完美掌控重載對抗。",
  explosivePower:
    "以同齡一般人來看，你的爆發起跳已遠甩常人，直追校隊田徑與球類專項的起步水準。這份雷霆彈射天賦，代表你在跳箱、短跑衝刺、急停再加速時，能在極短時間內把下肢功率一次打滿。",
  strength:
    "以同齡一般人來看，你的重載槓鈴輸出已高出健身房常客一截，逼近進階練力與健力選手的募集水準。這份鋼鐵噸位天賦，代表你在深蹲、硬舉、臥推等抗重力對抗中，骨骼肌能穩定頂住大重量。",
  cardio:
    "以同齡一般人來看，你的心肺續航已站上業餘跑者段位，逼近競賽級耐力選手的長程輸出水準。這份底盤續航天賦，代表你在長時間高頻率輸出、長途拉力對抗中，仍能維持穩定節奏不崩。",
  muscleMass:
    "以同齡同體重來看，你的純肌肉量已高出一般體態一級，逼近高強度訓練者與健體選手的量體密度。這份車架剛性天賦，代表更厚的肌纖維層能為骨架提供防滾架級支撐，扛住更大配重。",
  bodyFat:
    "以同齡同身高來看，你的 FFMI 去脂肌肉指數已站上緊實運動體態高位，逼近賽車大排量高配版的淨輸出效率。這份破風阻天賦，代表扣除脂肪風阻負載後，每一公斤瘦體重都能轉成更純淨的引擎輸出。",
};

/** v2.4.4 — non-status P1: plain human-science with scene (zh). */
export const AXIS_HUMAN_GENERAL_ZH = {
  gripStrength:
    "你的握力與前臂指力募集在同齡梯隊中屬於高位，重載抓握時手指與屈肌群能維持穩定制動。這份抓握表現，直接反映專項運動員水準的前臂剛性與神經驅動。",
  explosivePower:
    "你的爆發起跳在同齡梯隊中反應靈敏，跳箱與短跑衝刺時下肢能在瞬間完成蹬地發力。這份彈射表現，對應校隊與球類專項選手的起步爆發型態。",
  strength:
    "你的絕對力量表現在同齡梯隊中屬於高位，深蹲、硬舉、臥推等大重量動作中肌群仍能協同頂住槓鈴。這份出力表現，對應進階練力與健力業餘選手的典型募集型態。",
  cardio:
    "你的心肺續航在同齡梯隊中屬於中上段，長時間跑步或高頻訓練中節奏仍能維持穩定。這份耐力表現，對應業餘跑者與耐力專項選手的典型續航型態。",
  muscleMass:
    "你的骨骼肌量在同齡同體重梯隊中屬於高位，肌纖維量體為骨架提供厚實支撐。這份肌量表現，支撐你在重載訓練與高強度週期中的穩定承載。",
  bodyFat:
    "你的瘦體重與體脂分布在同齡同身高梯隊中屬於優勢區間，線條更接近緊實運動體態。這份體成分表現，反映 FFMI 在同齡梯隊中的淨引擎優勢。",
};

export const SUPPLEMENTAL_HUMAN_STATUS_ZH = {
  armSize:
    "以同齡未訓練一般人來看，你的臂圍維度已明顯超過街頭平均，直逼進階擼鐵狂熱者與專項健美選手的撐袖水準。這份上肢侵略性天賦，代表彎舉與超載抗阻時，肱二頭與前臂能撐出高剛性線條，視覺與出力同步頂滿袖口。",
};

export const SUPPLEMENTAL_HUMAN_GENERAL_ZH = {
  armSize:
    "你的臂圍在同齡梯隊中屬於高位，彎舉與上肢抗阻時能撐出明顯的袖口服貼感。這份線條表現，對應長期擼鐵與健美專項選手的典型臂圍型態。",
};

export const AXIS_HUMAN_STATUS_EN = {
  gripStrength:
    "Against same-age norms, your grip and finger recruitment sit well above the amateur ceiling — past everyday limits and edging toward specialist strength. That braking grip talent means your forearm flexors can dominate heavy loads under high tension.",
  explosivePower:
    "Against same-age norms, your first-step burst leaves everyday adults behind — closing in on school-team sprinters and court athletes. That thunder launch talent shows up in box jumps, sprint starts, and stop-and-go bursts when your legs fire all at once.",
  strength:
    "Against same-age norms, your barbell output sits above the regular gym floor — edging toward advanced lifters and powerlifting cohorts. That iron-tonnage talent means squats, deadlifts, and benches hold steady when gravity fights back.",
  cardio:
    "Against same-age norms, your cardio endurance sits in the amateur runner band — approaching race-pace endurance specialists. That chassis-range talent keeps rhythm alive through long, high-frequency efforts without fading out.",
  muscleMass:
    "For your body weight and age cohort, muscle mass sits above everyday physique — nearing high-volume trainers and physique athletes. That roll-cage tissue talent gives your skeleton a denser base under heavier loading.",
  bodyFat:
    "For your height and age cohort, FFMI lean-mass efficiency sits in the athletic band — nearing a high-displacement performance build. That aero-shed talent means less fat drag and more clean engine per kilogram of lean mass.",
};

export const AXIS_HUMAN_GENERAL_EN = {
  gripStrength:
    "Your grip and forearm recruitment rank high in your age cohort — fingers and flexors hold steady under load. That pattern matches specialist grip athletes, not casual gym output.",
  explosivePower:
    "Your explosive launch ranks high in your age cohort — box jumps and sprint starts fire fast from the floor. That burst profile matches school-team and court-sport athletes.",
  strength:
    "Your absolute strength performance ranks high in your age cohort — squats, deadlifts, and benches still hold under load. That output shape matches advanced amateur lifters.",
  cardio:
    "Your cardio endurance ranks in the upper half of your age cohort — rhythm holds on longer efforts. That aerobic profile matches trained amateur endurance athletes.",
  muscleMass:
    "Your muscle mass ranks high for your weight class — tissue volume backs force production. That base supports heavier loading in compound work.",
  bodyFat:
    "Your lean-mass profile ranks favorably for your height cohort — physique skews athletic rather than sedentary. That composition supports sport-tier body balance.",
};

export const SUPPLEMENTAL_HUMAN_STATUS_EN = {
  armSize:
    "Against untrained same-age norms, your arm girth already clears street average — pressing toward serious iron addicts and physique specialists. That sleeve-stretching talent means curls and overloaded pressing fill the fabric with hard, visible upper-arm presence.",
};

export const SUPPLEMENTAL_HUMAN_GENERAL_EN = {
  armSize:
    "Your arm girth ranks high in your age cohort — curls and pressing create a tight sleeve line under load. That upper-arm profile matches dedicated iron and physique athletes.",
};

export const AXIS_VEHICLE_SPECTRUM = {
  gripStrength: "煞車抓地",
  strength: "馬力／排量",
  explosivePower: "傳動彈射",
  cardio: "冷卻續航",
  muscleMass: "車架剛性",
  bodyFat: "空力噸位",
};

export const SUPPLEMENTAL_VEHICLE_SPECTRUM = {
  armSize: "寬體輪拱",
  cooper: "冷卻續航",
  "5km": "冷卻續航",
};

const SUPPLEMENTAL_TALENT_LABEL_ZH = {
  armSize: "上肢侵略性天賦",
  cooper: "底盤續航天賦",
  "5km": "底盤續航天賦",
};

const SUPPLEMENTAL_TALENT_LABEL_EN = {
  armSize: "sleeve-stretching talent",
  cooper: "chassis-range talent",
  "5km": "chassis-range talent",
};

const AXIS_SURFACE_LABEL_ZH = {
  gripStrength: "握力",
  strength: "力量",
  explosivePower: "爆發",
  cardio: "心肺",
  muscleMass: "肌肉量",
  bodyFat: "FFMI",
};

/** v2.4.7 — axis-specific talent nouns for beat-2 (aligned with human-beat copy). */
const AXIS_TALENT_LABEL_ZH = {
  gripStrength: "抓握制動天賦",
  strength: "鋼鐵噸位天賦",
  explosivePower: "雷霆彈射天賦",
  cardio: "底盤續航天賦",
  muscleMass: "車架剛性天賦",
  bodyFat: "破風阻天賦",
};

const AXIS_TALENT_LABEL_EN = {
  gripStrength: "braking grip talent",
  strength: "iron-tonnage talent",
  explosivePower: "thunder launch talent",
  cardio: "chassis-range talent",
  muscleMass: "roll-cage tissue talent",
  bodyFat: "aero-shed talent",
};

const AXIS_SURFACE_LABEL_EN = {
  gripStrength: "grip",
  strength: "strength",
  explosivePower: "explosive power",
  cardio: "cardio",
  muscleMass: "muscle mass",
  bodyFat: "FFMI",
};

const VEHICLE_CLASS_TITLE_ZH = {
  G_PLATFORM: "序列代號：鋼鐵底盤",
  HIGH_OUTPUT: "序列代號：強力後燃",
  ENDURANCE_PROTO: "序列代號：耐力原案",
  WIDE_BODY: "序列代號：寬體架構",
  AERO_SPEC: "序列代號：氣動優化",
  MR_SPEC: "序列代號：中置重心",
  GT_CRUISER: "序列代號：巡航均衡",
};

const VEHICLE_CLASS_TITLE_EN = {
  G_PLATFORM: "Steel Chassis (G-Platform)",
  HIGH_OUTPUT: "High-Output Afterburn",
  ENDURANCE_PROTO: "Endurance Prototype",
  WIDE_BODY: "Wide-Body Architecture",
  AERO_SPEC: "Aero-Optimized Spec",
  MR_SPEC: "Mid-Rear Balance Spec",
  GT_CRUISER: "GT Cruiser Balance",
};

export const HOLLOW_PRAISE_MARKERS =
  /足以應付|表現優異|表現出色|相當不錯|非常出色|handles most challenges|performs excellently|quite impressive/i;

export function resolveReplyLocale(context) {
  return context?.locale === "en" ? "en" : "zh-Hant";
}

/**
 * v2.4.5 — tier-dynamic slot hook for future cardCopy-driven human beats.
 * WHY: Keeps template codex pure while enabling gradual {tierTitle} migration.
 */
export function interpolateTemplateSlots(template, snap) {
  const title = String(snap?.cardCopy?.title ?? "").trim();
  if (!title || !String(template ?? "").includes(TIER_TITLE_SLOT)) {
    return String(template ?? "").trim();
  }
  return String(template).replaceAll(TIER_TITLE_SLOT, title).trim();
}

export function isCardCopyAnchoredHumanBeat(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized) return false;
  return (
    /^就你目前的級距/.test(normalized) ||
    /^就你目前的表現/.test(normalized) ||
    /^就「/.test(normalized) ||
    /^On your current tier band/i.test(normalized) ||
    /^Your tier band maps/i.test(normalized)
  );
}

export function isCanonicalHumanBeatSynthesis(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized || ACADEMIC_BOILERPLATE_MARKERS.test(normalized)) return false;
  if (isCardCopyAnchoredHumanBeat(normalized)) return true;
  return (
    /^以同齡/.test(normalized) ||
    /^Against same-age norms/i.test(normalized) ||
    /^Against untrained same-age norms/i.test(normalized) ||
    /^For your (body weight|height)/i.test(normalized) ||
    /^你的(握力|絕對力量|多關節|重載|心肺|骨骼肌|純肌肉|瘦體重|爆發|臂圍)/.test(normalized) ||
    /^Your (grip|multi-joint|barbell|cardio|muscle mass|lean-mass|explosive|arm girth)/i.test(normalized)
  );
}

function resolveChassisAxisExtremes(context) {
  const scored = (Array.isArray(context?.axes) ? context.axes : []).filter(
    (snap) => snap?.score != null
  );
  if (scored.length === 0) {
    return { weakest: null, strongest: null };
  }
  let weakest = scored[0];
  let strongest = scored[0];
  for (const snap of scored) {
    if ((snap.score ?? 0) < (weakest.score ?? 0)) weakest = snap;
    if ((snap.score ?? 0) > (strongest.score ?? 0)) strongest = snap;
  }
  return { weakest, strongest };
}

function formatDisplayScore(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  const numeric = Number(score);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function resolveAxisSurfaceLabel(axis, locale) {
  const map = locale === "en" ? AXIS_SURFACE_LABEL_EN : AXIS_SURFACE_LABEL_ZH;
  return map[axis] ?? (locale === "en" ? "axis" : "軸線");
}

function resolveVehicleClassTitle(vehicleClassId, locale) {
  const map = locale === "en" ? VEHICLE_CLASS_TITLE_EN : VEHICLE_CLASS_TITLE_ZH;
  return map[vehicleClassId] ?? (locale === "en" ? "whole-chassis profile" : "整車底盤級距");
}

/** @deprecated v3.0 — legacy v2.5 chassis human beat; retained for deferred cleanup. */
export function synthesizeChassisHumanBeat(context) {
  const locale = resolveReplyLocale(context);
  const overall = formatDisplayScore(context?.overallScore);
  const { weakest, strongest } = resolveChassisAxisExtremes(context);

  if (locale === "en") {
    const weakestLabel = resolveAxisSurfaceLabel(weakest?.axis, locale);
    const strongestLabel = resolveAxisSurfaceLabel(strongest?.axis, locale);
    const weakestScore = formatDisplayScore(weakest?.score);
    const strongestScore = formatDisplayScore(strongest?.score);
    if (overall && weakestScore && strongestScore) {
      return `The six-axis chassis locks at an overall score of ${overall}, mapping elite-cohort spread across specialties. ${strongestLabel} sits high in sport norms while ${weakestLabel} at ${weakestScore} still drags synchronized output against ${strongestScore} on the strong link.`;
    }
    if (overall) {
      return `The six-axis chassis anchors at an overall score of ${overall}, showing how specialty peaks and systemic weak links diverge across competitive sport norms.`;
    }
    return "The six-axis chassis profile maps specialty peaks against systemic weak links across competitive sport norms.";
  }

  const weakestLabel = resolveAxisSurfaceLabel(weakest?.axis, locale);
  const strongestLabel = resolveAxisSurfaceLabel(strongest?.axis, locale);
  const weakestScore = formatDisplayScore(weakest?.score);
  const strongestScore = formatDisplayScore(strongest?.score);
  if (overall && weakestScore && strongestScore) {
    return `六軸整車遙測總分錨定在 ${overall} 分，呈現專項長板與系統短板的梯隊落差。${strongestLabel} 處於同齡常模高位（${strongestScore} 分），${weakestLabel}（${weakestScore} 分）仍拖慢整體協同輸出。`;
  }
  if (overall) {
    return `六軸整車遙測總分錨定在 ${overall} 分，專項長板與系統短板在競技體育常模中形成可量化的梯隊落差。`;
  }
  return "六軸整車體能結構在競技體育常模中呈現專項長板與系統短板的可量化落差。";
}

/** @deprecated v3.0 — legacy v2.5 vehicle beat; retained for deferred cleanup. */
export function synthesizeChassisVehicleBeat(context) {
  const locale = resolveReplyLocale(context);
  const classTitle = resolveVehicleClassTitle(context?.vehicleClassId, locale);

  if (locale === "en") {
    return `On the Ultimate Physique host telemetry chassis, the ${classTitle} frame redistributes torque as roll-cage rigidity and driveline axes share multi-axis load — whole-chassis balance outlasts single-axis spikes when climbing the next tier band.`;
  }
  return `在《最強肉體》主機的遙測底盤中，${classTitle} 的全車車架正承受多軸負載聯動——防滾架剛性與傳動軸在長板推力與短板拖曳之間重新分配扭矩，整車均衡比單點爆發更能支撐下一格級距。`;
}

/** @deprecated v3.0 — legacy v2.5 dual-beat chassis synthesis; retained for deferred cleanup. */
export function synthesizeChassisBeatFromContext(context) {
  return {
    human: synthesizeChassisHumanBeat(context),
    vehicle: synthesizeChassisVehicleBeat(context),
  };
}

function resolveSupplementalMetric(context) {
  const userQuestion = context?.userQuestion ?? "";
  return (
    detectQuestionFocusSupplemental(userQuestion) ??
    context?.questionFocusSupplemental ??
    context?.focusSupplemental ??
    null
  );
}

function resolvePrimaryAxisSnap(context) {
  if (!context) return null;
  const focusAxis = context.questionFocusAxis ?? null;
  const axes = Array.isArray(context.axes) ? context.axes : [];
  return (
    (focusAxis ? axes.find((snap) => snap?.axis === focusAxis) : null) ??
    axes.find((snap) => snap?.score != null && snap?.cardCopy?.title) ??
    null
  );
}

export function resolvePrimaryBeatSnap(context) {
  if (!context) return null;

  const supplementalMetric = resolveSupplementalMetric(context);
  if (supplementalMetric) {
    const metrics = Array.isArray(context.supplementalMetrics) ? context.supplementalMetrics : [];
    const snap = metrics.find((entry) => entry?.metric === supplementalMetric);
    if (snap?.cardCopy?.title) {
      return { kind: "supplemental", metric: supplementalMetric, snap };
    }
  }

  const axisSnap = resolvePrimaryAxisSnap(context);
  if (axisSnap) {
    return { kind: "axis", metric: axisSnap.axis, snap: axisSnap };
  }
  return null;
}

function resolveHumanBeatCopy(context) {
  const focus = resolvePrimaryBeatSnap(context);
  if (!focus) return null;

  const locale = resolveReplyLocale(context);
  const isStatus = context?.intent === "status";

  if (focus.kind === "supplemental") {
    const statusMap = locale === "en" ? SUPPLEMENTAL_HUMAN_STATUS_EN : SUPPLEMENTAL_HUMAN_STATUS_ZH;
    const generalMap = locale === "en" ? SUPPLEMENTAL_HUMAN_GENERAL_EN : SUPPLEMENTAL_HUMAN_GENERAL_ZH;
    const raw =
      (isStatus ? statusMap[focus.metric] : generalMap[focus.metric]) ??
      generalMap[focus.metric] ??
      null;
    return raw ? interpolateTemplateSlots(raw, focus.snap) : null;
  }

  const statusMap = locale === "en" ? AXIS_HUMAN_STATUS_EN : AXIS_HUMAN_STATUS_ZH;
  const generalMap = locale === "en" ? AXIS_HUMAN_GENERAL_EN : AXIS_HUMAN_GENERAL_ZH;
  const raw =
    (isStatus ? statusMap[focus.metric] : generalMap[focus.metric]) ??
    generalMap[focus.metric] ??
    null;
  return raw ? interpolateTemplateSlots(raw, focus.snap) : null;
}

export function humanizeCardCopySummary(summary) {
  return String(summary ?? "")
    .replace(/^【[^】]+】[。.]?\s*/, "")
    .replace(/[。.]\s*$/, "")
    .trim();
}

/**
 * v2.4.6 — P1 sovereignty: plain-language extension of official scoreMeaning cardCopy.summary.
 * WHY: Static ladder maps read generic; users expect the tier band copy they already earned.
 */
export function synthesizeHumanBeatFromCardCopySummary(context) {
  const focus = resolvePrimaryBeatSnap(context);
  const snap = focus?.snap;
  const rawSummary = String(snap?.cardCopy?.summary ?? "").trim();
  if (!rawSummary) return null;

  const locale = resolveReplyLocale(context);
  // v2.5.1 — official cardCopy.summary is immune to stripHollowPraise (coach-extension only).
  let body = humanizeCardCopySummary(rawSummary);
  if (!body) return null;

  // v2.4.7 — tier title lives only in beat-2 【】; P1 extends cardCopy summary in plain human language.
  if (locale === "en") {
    const lead = "On your current tier band, the official read is: ";
    const closing = /[.!?]$/.test(body) ? "" : ".";
    return `${lead}${body}${closing}`;
  }

  const lead = "就你目前的表現來說，";
  const closing = /[。！？]$/.test(body) ? "" : "。";
  return `${lead}${body}${closing}`;
}

export function synthesizeHumanBeatFromCardCopy(context) {
  return synthesizeHumanBeatFromCardCopySummary(context) ?? resolveHumanBeatCopy(context);
}

function resolveTalentLabel(focus, locale) {
  if (focus?.kind === "supplemental") {
    const map = locale === "en" ? SUPPLEMENTAL_TALENT_LABEL_EN : SUPPLEMENTAL_TALENT_LABEL_ZH;
    return map[focus.metric] ?? (locale === "en" ? "telemetry talent" : "遙測天賦");
  }
  const map = locale === "en" ? AXIS_TALENT_LABEL_EN : AXIS_TALENT_LABEL_ZH;
  return map[focus?.metric] ?? (locale === "en" ? "telemetry talent" : "遙測天賦");
}

/** @deprecated v3.0 — legacy v2.5 vehicle beat; retained for deferred cleanup. */
export function synthesizeVehicleBeatFromContext(context) {
  const focus = resolvePrimaryBeatSnap(context);
  const snap = focus?.snap;
  const locale = resolveReplyLocale(context);
  const talentLabel = resolveTalentLabel(focus, locale);

  if (!snap?.cardCopy?.title) {
    if (locale === "en") {
      return `On the Ultimate Physique host telemetry chassis, this ${talentLabel} maps to the horsepower output spectrum.`;
    }
    return `在《最強肉體》主機的遙測底盤中，這份${talentLabel}被精準類比為馬力頻譜的輸出。`;
  }
  const spectrum =
    focus.kind === "supplemental"
      ? SUPPLEMENTAL_VEHICLE_SPECTRUM[focus.metric] ?? "馬力"
      : AXIS_VEHICLE_SPECTRUM[focus.metric] ?? "馬力";
  const title = String(snap.cardCopy.title).trim();

  if (locale === "en") {
    return `On the Ultimate Physique host telemetry chassis, this ${talentLabel} maps to the ${spectrum} output spectrum, tier [${title}].`;
  }
  return `在《最強肉體》主機的遙測底盤中，這份${talentLabel}被精準類比為${spectrum}頻譜的輸出，級距【${title}】。`;
}

/**
 * v2.5.1 — hollow-praise strip for AI coach extensions and synthesized chassis shards only.
 * WHY: Official cardCopy.summary must never pass through this filter.
 */
export function stripHollowPraise(text) {
  const normalized = String(text ?? "").trim();
  if (!normalized || !HOLLOW_PRAISE_MARKERS.test(normalized)) return normalized;
  return normalized
    .replace(HOLLOW_PRAISE_MARKERS, "")
    .replace(/[，,、。\s]+$/g, "。")
    .replace(/^[，,、。\s]+/g, "")
    .trim();
}
