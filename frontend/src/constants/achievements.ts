import type { AchievementCode } from '@ft/shared';

export const ACHIEVEMENT_LABEL: Record<AchievementCode, string> = {
  FIRST_ESCAPE: 'first_escape',
  FIRST_CREATOR: 'first_creator',
  EXPLORER: 'explorer',
  DUEL_CHAMPION: 'duel_champion',
};

// Ordre d'affichage stable, y compris pour les achievements pas encore débloqués.
export const ALL_ACHIEVEMENT_CODES: AchievementCode[] = [
  'FIRST_ESCAPE',
  'FIRST_CREATOR',
  'EXPLORER',
  'DUEL_CHAMPION',
];
