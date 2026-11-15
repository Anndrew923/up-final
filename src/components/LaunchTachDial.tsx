import { type FC } from 'react';
import {
  TACH_BEZEL_GOLD_CHAMFER_STROKE,
  TACH_BRIDGE_HIGHLIGHT_PATHS,
  TACH_BRIDGE_METAL,
  TACH_BRIDGE_PATHS,
  TACH_CD_GROOVE_RADII,
  TACH_COLOR_CYAN,
  TACH_COLOR_GOLD,
  TACH_COLOR_RED,
  TACH_CREST_CUP_INNER_R,
  TACH_CREST_CUP_MID_R,
  TACH_CREST_CUP_OUTER_R,
  TACH_CREST_GOLD,
  TACH_CREST_GOLD_HI,
  TACH_CREST_GOLD_LO,
  TACH_CREST_LIT,
  TACH_CREST_LIT_CLASS,
  TACH_CX,
  TACH_CY,
  TACH_JEWELS,
  TACH_KNURL_TICKS,
  TACH_METAL_EDGE,
  TACH_METAL_MIRROR,
  TACH_METAL_SLOT,
  TACH_METAL_STEEL,
  TACH_METAL_TITANIUM,
  TACH_MOVEMENT_GROOVE_RADII,
  TACH_MOVEMENT_PLATE_R,
  TACH_OUTER_RAIL_PATH,
  TACH_PRIMARY_GEAR,
  TACH_REDLINE_ARC_PATH,
  TACH_REDLINE_PULSE_CLASS,
  TACH_REDLINE_RPM,
  TACH_REFRACTION_PATH,
  TACH_R_NEEDLE,
  TACH_R_OUTER,
  TACH_R_SEGMENT_INNER,
  TACH_SAPPHIRE_SLASH,
  TACH_SCREWS,
  TACH_SECONDARY_CX,
  TACH_SECONDARY_CY,
  TACH_SECONDARY_GEAR,
  TACH_SEGMENT_DIM,
  TACH_SEGMENTS,
  TACH_TICKS,
  type TachScrew,
  formatLaunchHudPrimary,
  formatLaunchHudSecondary,
  isLaunchRedline,
  isSegmentLit,
  isTachLabelLit,
  progressToNeedleRotateDeg,
  progressToPrimaryGearRotateDeg,
  progressToSecondaryGearRotateDeg,
} from '../logic/core/launchTachometer';
import GuillocheCrest from './aesthetic/GuillocheCrest';

export interface LaunchTachDialProps {
  progress: number;
}

/** Hard-edge dual-facet blade — tiny hub so GuillocheCrest stays readable. */
function TachNeedle({ progress }: { progress: number }) {
  const needleRotate = progressToNeedleRotateDeg(progress);
  const atRedline = isLaunchRedline(progress);
  const coreFill = atRedline ? TACH_COLOR_RED : TACH_COLOR_CYAN;
  const tipY = TACH_CY - TACH_R_NEEDLE;
  const hubY = TACH_CY + 12;

  return (
    <g
      data-testid="launch-needle"
      data-progress={progress.toFixed(3)}
      data-rotate={needleRotate.toFixed(2)}
      transform={`rotate(${needleRotate} ${TACH_CX} ${TACH_CY})`}
    >
      {/* Backlight facet — deep gun-metal */}
      <polygon
        points={`${TACH_CX},${tipY} ${TACH_CX - 4.6},${hubY} ${TACH_CX},${TACH_CY + 4}`}
        fill="#1A1E26"
      />
      {/* Lit facet — bright champagne silver */}
      <polygon
        points={`${TACH_CX},${tipY} ${TACH_CX + 4.6},${hubY} ${TACH_CX},${TACH_CY + 4}`}
        fill="url(#launch-needle-blade-lit)"
      />
      {/* 1.5px luminous core spine */}
      <line
        x1={TACH_CX}
        y1={tipY + 8}
        x2={TACH_CX}
        y2={TACH_CY + 2}
        stroke={coreFill}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Multi-step micro hub — does not bury the crest */}
      <circle
        cx={TACH_CX}
        cy={TACH_CY}
        r="5.2"
        fill="url(#launch-needle-hub-metal)"
        stroke="#FFFDF2"
        strokeWidth="0.55"
      />
      <circle cx={TACH_CX} cy={TACH_CY} r="3.2" fill="#0a0c10" stroke="#8a909c" strokeWidth="0.45" />
      <circle cx={TACH_CX} cy={TACH_CY} r="1.35" fill={coreFill} />
      <circle cx={TACH_CX} cy={TACH_CY} r="0.55" fill="#FFFFFF" />
    </g>
  );
}

function HexScrew({ screw }: { screw: TachScrew }) {
  const { cx, cy, r, hexPoints, key } = screw;
  return (
    <g data-testid={`launch-screw-${key}`}>
      <circle cx={cx} cy={cy} r={r} fill="url(#launch-hub-metal)" stroke="#040507" strokeWidth="0.5" />
      <circle cx={cx - r * 0.28} cy={cy - r * 0.28} r={r * 0.22} fill="#FFFDF2" opacity="0.55" />
      <polygon points={hexPoints} fill="#1B1F2A" stroke="#8a909c" strokeWidth="0.35" />
    </g>
  );
}

/** Solid metallic movement stack — plate → gears → bridges → crest cup. */
function TachSolidMovement({
  primaryGearRotate,
  secondaryGearRotate,
}: {
  primaryGearRotate: number;
  secondaryGearRotate: number;
}) {
  return (
    <g data-testid="launch-tourbillon">
      <circle
        cx={TACH_CX}
        cy={TACH_CY}
        r={TACH_MOVEMENT_PLATE_R}
        fill="url(#launch-movement-plate)"
        data-testid="launch-movement-plate"
      />
      <g
        data-testid="launch-movement-grooves"
        fill="none"
        stroke="#2a3140"
        strokeOpacity="0.55"
      >
        {TACH_MOVEMENT_GROOVE_RADII.map((r) => (
          <circle key={r} cx={TACH_CX} cy={TACH_CY} r={r} strokeWidth="0.55" />
        ))}
      </g>

      <g
        data-testid="launch-gear-primary"
        data-rotate={primaryGearRotate.toFixed(2)}
        data-teeth={TACH_PRIMARY_GEAR.teeth}
        transform={`rotate(${primaryGearRotate} ${TACH_CX} ${TACH_CY})`}
        filter="url(#launch-gear-drop)"
      >
        <path
          d={TACH_PRIMARY_GEAR.bodyPath}
          fill="url(#launch-gear-metal)"
          fillRule="evenodd"
          stroke={TACH_METAL_EDGE}
          strokeWidth="0.8"
        />
      </g>

      <g
        data-testid="launch-gear-secondary"
        data-rotate={secondaryGearRotate.toFixed(2)}
        data-teeth={TACH_SECONDARY_GEAR.teeth}
        transform={`rotate(${secondaryGearRotate} ${TACH_SECONDARY_CX} ${TACH_SECONDARY_CY})`}
        filter="url(#launch-gear-drop)"
      >
        <path
          d={TACH_SECONDARY_GEAR.bodyPath}
          fill="url(#launch-gear-metal)"
          fillRule="evenodd"
          stroke={TACH_METAL_EDGE}
          strokeWidth="0.8"
        />
      </g>

      {TACH_BRIDGE_PATHS.map((d, i) => (
        <path
          key={`bridge-${i}`}
          d={d}
          fill="url(#launch-bridge-fill)"
          stroke={TACH_METAL_STEEL}
          strokeWidth="0.6"
          filter="url(#launch-bridge-drop)"
          data-testid={`launch-bridge-${i}`}
          data-metal={TACH_BRIDGE_METAL}
        />
      ))}
      {TACH_BRIDGE_HIGHLIGHT_PATHS.map((d, i) => (
        <path
          key={`bridge-hi-${i}`}
          d={d}
          fill="none"
          stroke={TACH_METAL_EDGE}
          strokeWidth="1.05"
          strokeLinecap="round"
          opacity="0.9"
          data-testid={`launch-bridge-hi-${i}`}
        />
      ))}

      {TACH_SCREWS.map((s) => (
        <HexScrew key={s.key} screw={s} />
      ))}
      {TACH_JEWELS.map((j) => (
        <g key={j.key} data-testid={`launch-jewel-${j.key}`}>
          <circle
            cx={j.cx}
            cy={j.cy}
            r={j.r}
            fill={j.tone === 'cyan' ? TACH_COLOR_CYAN : TACH_COLOR_RED}
            stroke="#040507"
            strokeWidth="0.35"
          />
          <circle
            cx={j.cx - j.r * 0.3}
            cy={j.cy - j.r * 0.3}
            r={j.r * 0.28}
            fill="#FFFFFF"
            opacity="0.65"
          />
        </g>
      ))}

      {/* Recessed crest cup — champagne gold only; isolates UP seal from gear spokes */}
      <g data-testid="launch-crest-cup">
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_CREST_CUP_OUTER_R}
          fill="none"
          stroke={TACH_CREST_GOLD_HI}
          strokeWidth="1.6"
        />
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_CREST_CUP_MID_R}
          fill="none"
          stroke={TACH_CREST_GOLD_LO}
          strokeWidth="1.1"
        />
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_CREST_CUP_INNER_R}
          fill="url(#launch-crest-cup-recess)"
          stroke={TACH_CREST_GOLD}
          strokeWidth="0.55"
          data-testid="launch-crest-cup-recess"
        />
      </g>
    </g>
  );
}

/**
 * Presentational supercar tach dial — titanium CNC bezel/movement, champagne crest focus, hard-edge needle.
 * WHY: Keep LaunchQuoteSplash focused on boot lifecycle; dial craft stays swappable without timer risk.
 */
const LaunchTachDial: FC<LaunchTachDialProps> = ({ progress }) => {
  const atRedline = isLaunchRedline(progress);
  const hudPrimary = formatLaunchHudPrimary(progress);
  const hudSecondary = formatLaunchHudSecondary(progress);
  const primaryGear = progressToPrimaryGearRotateDeg(progress);
  const secondaryGear = progressToSecondaryGearRotateDeg(progress);

  return (
    <div className="relative w-full max-w-[22rem]">
      <svg
        viewBox="0 0 320 300"
        className="mx-auto block h-auto w-full"
        data-testid="launch-tachometer"
        aria-hidden
      >
        <defs>
          <linearGradient id="launch-bezel-metal" x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="18%" stopColor="#64748B" />
            <stop offset="38%" stopColor="#0F172A" />
            <stop offset="52%" stopColor="#475569" />
            <stop offset="68%" stopColor="#0F172A" />
            <stop offset="85%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <radialGradient id="launch-dial-face" cx="38%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#151922" />
            <stop offset="55%" stopColor="#080a0e" />
            <stop offset="100%" stopColor="#040507" />
          </radialGradient>
          <radialGradient id="launch-ring-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="72%" stopColor="#000000" stopOpacity="0" />
            <stop offset="88%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="launch-movement-plate" cx="42%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#161A23" />
            <stop offset="100%" stopColor="#080A0F" />
          </radialGradient>
          <radialGradient id="launch-gear-metal" cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#A8B0BE" />
            <stop offset="45%" stopColor="#3A4150" />
            <stop offset="100%" stopColor="#151820" />
          </radialGradient>
          <radialGradient id="launch-bridge-fill" cx="30%" cy="20%" r="80%">
            <stop offset="0%" stopColor={TACH_METAL_MIRROR} />
            <stop offset="45%" stopColor={TACH_METAL_TITANIUM} />
            <stop offset="85%" stopColor={TACH_METAL_STEEL} />
            <stop offset="100%" stopColor={TACH_METAL_SLOT} />
          </radialGradient>
          <radialGradient id="launch-crest-cup-recess" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="#050608" />
            <stop offset="70%" stopColor="#0a0c10" />
            <stop offset="100%" stopColor="#151820" />
          </radialGradient>
          <linearGradient id="launch-hub-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF2" />
            <stop offset="40%" stopColor="#8a909c" />
            <stop offset="100%" stopColor="#1B1F2A" />
          </linearGradient>
          <linearGradient id="launch-hud-wing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={TACH_COLOR_GOLD} stopOpacity="0" />
            <stop offset="50%" stopColor={TACH_COLOR_GOLD} stopOpacity="0.45" />
            <stop offset="100%" stopColor={TACH_COLOR_GOLD} stopOpacity="0" />
          </linearGradient>
          <filter id="launch-segment-red-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="launch-gear-drop" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="1.2" dy="2.2" stdDeviation="1.4" floodColor="#000000" floodOpacity="0.65" />
          </filter>
          <filter id="launch-bridge-drop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.8" dy="1.6" stdDeviation="1.1" floodColor="#000000" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* CNC dual bezel */}
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_R_OUTER + 10}
          fill="url(#launch-bezel-metal)"
          data-testid="launch-bezel-outer"
        />
        <circle cx={TACH_CX} cy={TACH_CY} r={TACH_R_OUTER + 5.5} fill="#040507" />
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_R_OUTER + 4}
          fill="none"
          stroke="url(#launch-bezel-metal)"
          strokeWidth="1.8"
          opacity="0.95"
        />
        {/* Knurling + CD grooves */}
        <g data-testid="launch-knurl" stroke="#FFFDF2" strokeOpacity="0.28" fill="none">
          {TACH_KNURL_TICKS.map((t) => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth="0.45" />
          ))}
        </g>
        <g data-testid="launch-cd-grooves" fill="none" stroke="#8a909c" strokeOpacity="0.35">
          {TACH_CD_GROOVE_RADII.map((r) => (
            <circle key={r} cx={TACH_CX} cy={TACH_CY} r={r} strokeWidth="0.4" />
          ))}
        </g>

        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_R_OUTER}
          fill="url(#launch-dial-face)"
          stroke="#1B1F2A"
          strokeWidth="1"
        />
        {/* Hairline champagne inner chamfer — brand gold only at the bezel/face junction */}
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_R_OUTER}
          fill="none"
          stroke={TACH_COLOR_GOLD}
          strokeWidth={TACH_BEZEL_GOLD_CHAMFER_STROKE}
          opacity="0.9"
          data-testid="launch-bezel-gold-chamfer"
        />

        {/* Sharp sapphire slash + cyan-gold refraction hairline */}
        <line
          x1={TACH_SAPPHIRE_SLASH.x1}
          y1={TACH_SAPPHIRE_SLASH.y1}
          x2={TACH_SAPPHIRE_SLASH.x2}
          y2={TACH_SAPPHIRE_SLASH.y2}
          stroke="rgba(255,253,242,0.22)"
          strokeWidth="1.15"
          strokeLinecap="round"
          data-testid="launch-sapphire-slash"
        />
        <path
          d={TACH_REFRACTION_PATH}
          fill="none"
          stroke="rgba(0,229,255,0.18)"
          strokeWidth="0.7"
          data-testid="launch-refraction-line"
        />

        <TachSolidMovement
          primaryGearRotate={primaryGear}
          secondaryGearRotate={secondaryGear}
        />

        {/* Suspended tick ring — inner shadow for 3D float */}
        <circle
          cx={TACH_CX}
          cy={TACH_CY}
          r={TACH_R_SEGMENT_INNER - 2}
          fill="url(#launch-ring-shadow)"
          data-testid="launch-ring-shadow"
        />

        <path
          d={TACH_OUTER_RAIL_PATH}
          fill="none"
          stroke={TACH_COLOR_GOLD}
          strokeWidth="1.1"
          opacity="0.45"
        />

        <path
          d={TACH_REDLINE_ARC_PATH}
          fill="none"
          stroke={TACH_COLOR_RED}
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity={atRedline ? 0.85 : 0.6}
          className={atRedline ? TACH_REDLINE_PULSE_CLASS : undefined}
          data-testid="launch-redline-arc"
          data-pulse={atRedline ? '1' : '0'}
        />

        <g data-testid="launch-segment-arc">
          {TACH_SEGMENTS.map((seg) => {
            const lit = isSegmentLit(seg, progress);
            return (
              <path
                key={seg.key}
                d={seg.path}
                fill={lit ? seg.litColor : TACH_SEGMENT_DIM}
                opacity={lit ? (seg.band === 'red' ? 0.95 : 0.88) : 1}
                filter={lit && seg.band === 'red' ? 'url(#launch-segment-red-glow)' : undefined}
                data-lit={lit ? '1' : '0'}
                data-band={seg.band}
              />
            );
          })}
        </g>

        {TACH_TICKS.map((tick) => {
          const lit = tick.label ? isTachLabelLit(tick.label.n, progress) : false;
          const labelFill = !tick.label
            ? TACH_COLOR_GOLD
            : tick.label.n >= TACH_REDLINE_RPM
              ? lit
                ? TACH_COLOR_RED
                : 'rgba(255,74,74,0.35)'
              : lit
                ? '#F5F2EA'
                : 'rgba(245,242,234,0.28)';
          return (
            <g key={tick.key}>
              <line
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={
                  tick.label && tick.label.n >= TACH_REDLINE_RPM
                    ? TACH_COLOR_RED
                    : lit
                      ? TACH_COLOR_GOLD
                      : 'rgba(243,208,120,0.35)'
                }
                strokeWidth={tick.major ? 1.55 : 0.65}
                opacity={tick.major ? 0.95 : 0.5}
              />
              {tick.label ? (
                <text
                  x={tick.label.x}
                  y={tick.label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={labelFill}
                  fontSize="12"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight="800"
                  fontStyle="italic"
                  data-lit={lit ? '1' : '0'}
                  data-rpm={tick.label.n}
                >
                  {tick.label.n}
                </text>
              ) : null}
            </g>
          );
        })}

        <g data-testid="launch-digital-window">
          <path
            d={`M ${TACH_CX - 78} ${TACH_CY + 64} L ${TACH_CX - 28} ${TACH_CY + 64}`}
            stroke="url(#launch-hud-wing)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d={`M ${TACH_CX + 28} ${TACH_CY + 64} L ${TACH_CX + 78} ${TACH_CY + 64}`}
            stroke="url(#launch-hud-wing)"
            strokeWidth="1"
            fill="none"
          />
          <text
            x={TACH_CX}
            y={hudSecondary ? TACH_CY + 58 : TACH_CY + 66}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={atRedline ? TACH_COLOR_RED : TACH_COLOR_CYAN}
            fontSize={atRedline ? 11 : 16}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="0.08em"
            className={atRedline ? TACH_REDLINE_PULSE_CLASS : undefined}
            data-testid="launch-hud-primary"
            data-pulse={atRedline ? '1' : '0'}
          >
            {hudPrimary}
          </text>
          {hudSecondary ? (
            <text
              x={TACH_CX}
              y={TACH_CY + 74}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(243,208,120,0.55)"
              fontSize="7"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontWeight="600"
              letterSpacing="0.28em"
              data-testid="launch-hud-secondary"
            >
              {hudSecondary}
            </text>
          ) : null}
        </g>
      </svg>

      <div
        className={`pointer-events-none absolute left-1/2 top-[52.67%] z-[1] -translate-x-1/2 -translate-y-1/2 scale-[0.72] ${TACH_CREST_LIT_CLASS} drop-shadow-[0_0_2.5px_rgba(243,208,120,0.55)]`}
        data-testid="launch-crest-slot"
        data-crest-lit={TACH_CREST_LIT}
      >
        <GuillocheCrest />
      </div>

      <svg
        viewBox="0 0 320 300"
        className="pointer-events-none absolute inset-0 z-[2] mx-auto block h-auto w-full"
        aria-hidden
      >
        <defs>
          {/* Unique ids — avoid clashing with dial-face paint servers in the sibling SVG. */}
          <linearGradient id="launch-needle-hub-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF2" />
            <stop offset="40%" stopColor="#8a909c" />
            <stop offset="100%" stopColor="#1B1F2A" />
          </linearGradient>
          <linearGradient id="launch-needle-blade-lit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="100%" stopColor="#E6C26B" />
          </linearGradient>
        </defs>
        <TachNeedle progress={progress} />
      </svg>
    </div>
  );
};

export default LaunchTachDial;
