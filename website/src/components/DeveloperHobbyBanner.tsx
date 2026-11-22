/**
 * Minimal developer easter-egg under radar — one compact banner, not a 6-tile grid.
 * WHY: Teases human↔vehicle mapping without competing with the radar first viewport.
 *
 * Telemetry chips follow scienceAxes.telemetryShort (馬力/扭矩/續航/排量/抓地),
 * except 肌量 →「車體外觀」(carMetaphor stem; radar short label is「車體」).
 * Physique chips stay compact shorthand (肌力/爆發/心肺/肌量), not full titleZh.
 */
const DEV_HOBBY_PAIRS = [
  { physique: '肌力', telemetry: '馬力' },
  { physique: '爆發', telemetry: '扭矩' },
  { physique: '心肺', telemetry: '續航' },
  { physique: '肌量', telemetry: '車體外觀' },
  { physique: 'FFMI', telemetry: '排量' },
  { physique: '握力', telemetry: '抓地' },
] as const;

export function DeveloperHobbyBanner() {
  return (
    <aside className="rounded-2xl border border-white/10 bg-panel/50 px-3.5 py-3 sm:px-4 sm:py-3.5">
      <p className="ui-kicker-zh">開發者小嗜好</p>
      <p className="mt-1.5 text-sm font-semibold text-zinc-50">
        把肉體當超跑調校，是開發者的一點浪漫。
      </p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
        切換上方「遙測頻譜」，將六大生理指標轉譯為動力工程語彙（未來解鎖更多主題）：
      </p>
      <ul
        className="mt-2.5 flex flex-wrap gap-1.5"
        aria-label="人體與車體映射關鍵詞"
      >
        {DEV_HOBBY_PAIRS.map((pair) => (
          <li
            key={pair.physique}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-void/50 px-2 py-1 text-xs leading-none"
          >
            <span className="text-zinc-200">{pair.physique}</span>
            <span className="text-energy" aria-hidden>
              →
            </span>
            <span className="text-energy">{pair.telemetry}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
