import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ASSESSMENT_LOBBY_ROUTES,
  LOBBY_BENTO_LAYOUT,
  type AssessmentLobbyCardKey,
  type AssessmentLobbyCardSize,
  type AssessmentLobbyLayer,
} from '../config/assessmentLobby';
import type { RoutePath } from '../config/routes';
import { buildLobbyGlanceStatus } from '../logic/core/resolveLobbyGlanceStatus';
import type { ScoreMap } from '../types/scoring';

export interface AssessmentLobbyCardModel {
  key: AssessmentLobbyCardKey;
  to: RoutePath;
  title: string;
  size: AssessmentLobbyCardSize;
  colSpan: 1 | 2;
  layer: AssessmentLobbyLayer;
  /** Glanceable right-rail label (pure 2dp score, or unset copy). */
  glanceLabel: string;
  /** True when a measured score is shown (high-contrast mono). */
  glanceFilled: boolean;
}

/**
 * Lobby cards in Bento visual order.
 * WHY scores are injected: AssessmentPage already owns `useMergedScoresFromLocalStores`
 * for the HUD snapshot — reuse that map so we do not double-subscribe local stores.
 */
export function useAssessmentLobbyCards(scores: ScoreMap): AssessmentLobbyCardModel[] {
  const { t } = useTranslation('common');

  return useMemo(() => {
    const emptyLabel = t('assessment.lobby.glanceUnset');

    return LOBBY_BENTO_LAYOUT.map((slot) => {
      const glance = buildLobbyGlanceStatus(slot.key, scores, emptyLabel);
      return {
        key: slot.key,
        to: ASSESSMENT_LOBBY_ROUTES[slot.key],
        title: t(`assessment.${slot.key}.title`),
        size: slot.size,
        colSpan: slot.colSpan,
        layer: slot.layer,
        glanceLabel: glance.label,
        glanceFilled: glance.filled,
      };
    });
  }, [t, scores]);
}
