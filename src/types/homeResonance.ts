import type { OverallGradeBandId } from '../logic/core/scoreMeaningCatalog';
import type { RadarChartPoint } from './radarDisplay';

export type HomeResonancePhase = 'idle' | 'boot' | 'charge' | 'count' | 'reveal' | 'report';

export interface HomeResonanceSnapshot {
  overallScore: number;
  radarPoints: RadarChartPoint[];
  gradeBandId: OverallGradeBandId;
  gradeLine: string;
  archetypeTitle: string;
  archetypeSummary: string;
}
