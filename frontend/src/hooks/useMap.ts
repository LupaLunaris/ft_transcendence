//jpaulis
import type { MapData, MapSummary, PaginatedResponse, Difficulty } from '@ft/shared';
import { api } from '@/services/api.service';
import { useApi } from './useApi';

export function useMap(id: string | undefined): {
  map: MapData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const result = useApi<MapData>(() => {
    if (!id) return Promise.reject(new Error('No map id'));
    return api.maps.getById(id);
  });
  return { map: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
}

export function usePublishedMaps(
  page: number,
  difficulty?: Difficulty,
): {
  maps: MapSummary[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = useApi<PaginatedResponse<MapSummary>>(
    () => api.maps.getPublished(page, difficulty),
  );

  return {
    maps: data?.data ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    refetch,
  };
}

export function useMyMaps(): {
  maps: MapData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = useApi<MapData[]>(() => api.maps.getMine());

  return {
    maps: data ?? [],
    loading,
    error,
    refetch,
  };
}
