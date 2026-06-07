# Radar Card Visual Upgrade v2

## Goal

Upgrade Home radar card polish for screenshot sharing while preserving readability-first behavior:

- fixed 0-100 base radar scale
- overclock burst for values > 100
- symmetric dual-track data grid labels (no weakest-axis chrome)
- low-risk, low-noise dark sci-fi finish

## Visual Tokens

### Opacity

- Grid overlay: `0.08`
- Ring stroke: `0.42`
- Spoke stroke: `0.40`
- Base polygon fill: `0.22`
- Overflow polygon fill: `0.14`
- Overflow stroke: `0.90`
- Axis label fill: `0.76`
- Center aura: `0.07`

### Shadow

- Panel shadow:
  - `inset 0 1px 0 rgba(56,189,248,0.14)`
  - `inset 0 0 40px rgba(59,130,246,0.07)`
  - `0 0 34px rgba(56,189,248,0.08)`
- Overall block shadow:
  - `inset 0 0 0 1px rgba(56,189,248,0.08)`
  - `inset 0 0 20px rgba(59,130,246,0.08)`

### Typography

- Kicker: `10px`
- Axis label: `7px`

### Motion

- Panel transition: `480ms`
- Radar chart transition: `560ms`
- Rule: no looping decorative animation; entry/interaction only

### Geometry

- Radar outer radius: `72`
- Axis label radius: `88`
- Center aura radius: `86`
- Overflow max extra radius: `24`

## Implemented Files

- `src/components/home/HomeRadarBoard.tsx`
- `src/components/radar/HexRadarChart.tsx`
- `src/components/radar/radarVisualTokens.ts`

## v2.1 Screenshot Tuning

Applied as token-only tweaks (no logic changes):

- Grid opacity `0.08 -> 0.06` (cleaner dark background in compressed screenshots)
- Ring/spoke opacity `0.42/0.40 -> 0.36/0.34` (lower visual noise)
- Base polygon fill `0.22 -> 0.24` (shape remains readable after share compression)
- Overflow fill/stroke `0.14/0.90 -> 0.18/0.96` (stronger overclock pop)
- Label opacity `0.76 -> 0.84` (better small-screen legibility)
- Center aura `0.07 -> 0.09` (subtle depth increase without bloom fatigue)
- Chart transition `560ms -> 520ms` (snappier, less perceived lag)
- Label radius `88 -> 90` (extra spacing from burst tips)

## Stability Guardrails

- Do not reduce axis label legibility under small viewport
- Do not let visual effects distort score interpretation
- Keep overclock burst cues on polygon/overflow only (no weakest-axis styling)
- Keep all user-facing copy under i18n keys
