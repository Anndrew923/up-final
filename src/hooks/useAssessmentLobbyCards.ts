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

export interface AssessmentLobbyCardModel {
  key: AssessmentLobbyCardKey;
  to: RoutePath;
  title: string;
  size: AssessmentLobbyCardSize;
  colSpan: 1 | 2;
  layer: AssessmentLobbyLayer;
}

/** Lobby cards in Bento visual order — title + size/span/layer from `LOBBY_BENTO_LAYOUT`. */
export function useAssessmentLobbyCards(): AssessmentLobbyCardModel[] {
  const { t } = useTranslation('common');

  return useMemo(
    () =>
      LOBBY_BENTO_LAYOUT.map((slot) => ({
        key: slot.key,
        to: ASSESSMENT_LOBBY_ROUTES[slot.key],
        title: t(`assessment.${slot.key}.title`),
        size: slot.size,
        colSpan: slot.colSpan,
        layer: slot.layer,
      })),
    [t]
  );
}
