import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ASSESSMENT_LOBBY_CARD_KEYS,
  ASSESSMENT_LOBBY_ROUTES,
  type AssessmentLobbyCardKey,
} from '../config/assessmentLobby';
import type { RoutePath } from '../config/routes';

export interface AssessmentLobbyCardModel {
  key: AssessmentLobbyCardKey;
  to: RoutePath;
  title: string;
}

/** Lobby card copy for Assessment hub — title only; the card link is the sole affordance. */
export function useAssessmentLobbyCards(): AssessmentLobbyCardModel[] {
  const { t } = useTranslation('common');

  return useMemo(
    () =>
      ASSESSMENT_LOBBY_CARD_KEYS.map((key) => ({
        key,
        to: ASSESSMENT_LOBBY_ROUTES[key],
        title: t(`assessment.${key}.title`),
      })),
    [t]
  );
}
