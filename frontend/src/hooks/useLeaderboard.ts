import type { LeaderboardEntry } from '@ft/shared';
import { api } from '@/services/api.service';
import { useApi } from './useApi';

export function useMapLeaderboard(mapId: string | undefined): {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useApi<LeaderboardEntry[]>(() => {
    if (!mapId) return Promise.reject(new Error('No map id'));
    return api.scores.getMapPointsLeaderboard(mapId);
  });
  return { entries: data ?? [], loading, error };
}

export function useGlobalLeaderboard(): {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useApi<LeaderboardEntry[]>(() => api.scores.getGlobalLeaderboard());
  return { entries: data ?? [], loading, error };
}
