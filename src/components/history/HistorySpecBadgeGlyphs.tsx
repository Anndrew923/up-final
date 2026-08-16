import type { ReactNode } from 'react';
import type { TrainingFootprintBadgeId } from '../../logic/core/trainingFootprint';

const TURBINE_BLADE_DEG = [0, 60, 120, 180, 240, 300] as const;
const WHEEL_SPOKE_DEG = [0, 72, 144, 216, 288] as const;
const CALIPER_PISTON_Y = [8, 9.6, 11.2, 12.8, 14.4, 16] as const;
const CHIP_FINGER_X = [6.2, 8.8, 11.4, 14, 16.6] as const;
const GEAR_TOOTH_COUNT = 7;

export function HistorySpecBadgeGlyph({ id }: { id: TrainingFootprintBadgeId }): ReactNode {
  switch (id) {
    case 'IGN-01':
      return (
        <>
          <circle cx="12" cy="12" r="2.1" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="8.3" strokeWidth="1.15" />
          {TURBINE_BLADE_DEG.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 12 12)`}>
              <path d="M12 9.6 Q 14.6 6.4 12 3.6 Q 9.4 6.4 12 9.6" strokeWidth="1.15" />
            </g>
          ))}
        </>
      );
    case 'ARC-01':
      return (
        <>
          <rect x="4.2" y="5.2" width="15.6" height="13.6" rx="1.4" strokeWidth="1.2" />
          <path d="M6.4 8.2 H17.6 M6.4 10.6 H15.2" strokeWidth="1.1" strokeLinecap="round" />
          {CHIP_FINGER_X.map((x) => (
            <rect key={x} x={x} y="16.6" width="1.5" height="3.4" rx="0.3" strokeWidth="1" />
          ))}
        </>
      );
    case 'RHY-03':
      return (
        <>
          <circle cx="12" cy="12" r="7.6" strokeWidth="1.15" />
          <circle cx="12" cy="12" r="2.1" strokeWidth="1.15" />
          <path d="M12 4.6 V7.4 M4.6 12 H7.4 M12 16.6 V19.4" strokeWidth="1.15" strokeLinecap="round" />
          <path
            d="M5.4 15.6 Q 8.2 12.4 12 13.2 Q 15.8 14 18.6 10.8"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M5.8 17.4 Q 9 14.8 12 15.4 Q 15.2 16 18.4 13.2" strokeWidth="1.1" />
        </>
      );
    case 'RUN-07':
      return (
        <>
          <circle cx="12" cy="12" r="3.1" strokeWidth="1.15" />
          {Array.from({ length: GEAR_TOOTH_COUNT }, (_, index) => {
            const deg = (360 * index) / GEAR_TOOTH_COUNT;
            return (
              <g key={index} transform={`rotate(${deg} 12 12)`}>
                <path
                  d="M10.7 8.2 L10.35 4.7 L12 3.6 L13.65 4.7 L13.3 8.2"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </>
      );
    case 'RUN-30':
      return (
        <>
          <rect x="8.4" y="3.4" width="7.2" height="5.4" rx="0.6" strokeWidth="1.2" />
          <path d="M12 8.8 V15.2 L8.2 20.4" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M16.2 5.6 L20.6 3.4 M16.4 8 L21.2 6.6" strokeWidth="1.15" strokeLinecap="round" />
        </>
      );
    case 'CRS-04':
      return (
        <>
          <path
            d="M2.8 13.2 Q 8 8.2 14 9.2 Q 19.5 10.2 21.4 13 Q 14.2 12.2 8 14.4 Q 5 15.2 2.8 13.2"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M15.6 8.2 Q 18.8 6.2 21.6 5 M14.8 10.6 Q 18.6 9.4 21.6 8.4" strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
    case 'HIST-10':
      return (
        <>
          <path d="M4 16.8 L7.2 13.6 L10.2 14.8 L13.8 7.4 L16.8 9.6 L20.2 4.6" strokeWidth="1.25" strokeLinejoin="round" />
          <path d="M4 19.2 H20.2" strokeWidth="1.1" />
          <path d="M7.2 19.2 V20.6 M13.8 19.2 V20.6" strokeWidth="1.1" />
        </>
      );
    case 'PR-01':
      return (
        <>
          <circle cx="12" cy="12" r="8.4" strokeWidth="1.15" />
          <circle cx="12" cy="12" r="2.05" strokeWidth="1.15" />
          {WHEEL_SPOKE_DEG.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 12 12)`}>
              <path
                d="M11.15 11.2 L10.35 5.35 L12 4.15 L13.65 5.35 L12.85 11.2"
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </>
      );
    case 'SPEC-6':
      return (
        <>
          <circle cx="10.2" cy="12" r="7.1" strokeWidth="1.15" />
          <circle cx="10.2" cy="12" r="2.05" strokeWidth="1.15" />
          <path d="M16 7.2 H20.6 L21.2 16.8 H16 Q 14.6 12 16 7.2" strokeWidth="1.15" strokeLinejoin="round" />
          {CALIPER_PISTON_Y.map((y) => (
            <circle key={y} cx="16.35" cy={y} r="0.7" strokeWidth="1" />
          ))}
        </>
      );
    case 'ARM-01':
      return (
        <>
          <path d="M3.6 8.4 H9.2 L10.4 6.6 H13.6 L14.8 8.4 H20.4" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M9.2 8.4 V17.6 H14.8 V8.4" strokeWidth="1.15" />
          <path d="M4.2 12 H8.4 M15.6 12 H19.8" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M6.2 10.4 V13.6 M17.8 10.4 V13.6" strokeWidth="1.1" />
        </>
      );
    case '5K-01':
      return (
        <>
          <path d="M3.6 16.8 L7.2 11.4 L10.6 13.2 L14.4 6.8 L17.6 9.2 L20.6 5.2" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M3.8 18.6 Q 7.4 16.2 10.8 17.4 Q 14.6 18.8 20.4 15.2" strokeWidth="1.1" />
        </>
      );
    case 'SPR-01':
      return (
        <>
          <path d="M4.2 18.4 L7.6 18.4 L9.2 14.8 L6.4 14.8 Z" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M9.2 14.8 L12.4 9.2" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M12.2 8.2 L16.8 5.4 L15.4 9.6 L20.2 7.2 L16.2 12.4 L19.6 11.2" strokeWidth="1.2" strokeLinejoin="round" />
        </>
      );
    case 'SOM-01':
      return (
        <>
          <path d="M12 3.5 L20.6 19.2 H3.4 Z" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M12 3.5 V13.8 M3.4 19.2 L12 13.8 L20.6 19.2" strokeWidth="1.05" />
          <circle cx="12" cy="13.8" r="1.35" strokeWidth="1.1" />
        </>
      );
    default: {
      const _never: never = id;
      return _never;
    }
  }
}
