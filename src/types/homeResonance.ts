import type { RadarChartPoint } from './radarDisplay';

export type HomeResonancePhase = 'idle' | 'boot' | 'charge' | 'count' | 'reveal';

export interface HomeResonanceSnapshot {
  overallScore: number;
  radarPoints: RadarChartPoint[];
  gradeBandId: string;
  gradeLine: string;
  archetypeTitle: string;
}
