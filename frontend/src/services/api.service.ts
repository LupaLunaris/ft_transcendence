
import type {
  UserPublic,
  AuthResponse,
  MapData,
  MapSummary,
  CreateMapRequest,
  UpdateMapRequest,
  LoginRequest,
  RegisterRequest,
  ApiError,
  ApiResponse,
  PaginatedResponse,
  Grid,
  Difficulty,
  UpdateProfileRequest,
  RewardResult,
  LeaderboardEntry,
} from '@ft/shared';

interface TowerLevel {
  id: string;
  order_index: number;
  name: string;
}

interface TowerLevelFull extends TowerLevel {
  grid_json: Grid;
}

interface AdminMap {
  id: string;
  order_index: number;
  name: string;
  grid_json: Grid;
  created_at: string;
}

interface ScoreEntry {
  id: string;
  username: string;
  completion_time_ms: number;
  created_at: string;
}

interface ScoreResult {
  id: string;
  map_id: string;
  user_id: string;
  completion_time_ms: number;
  created_at: string;
  reward?: RewardResult;
}

interface FriendPublic {
  id: string;
  username: string;
  avatar: string | null;
  online_status: 'online' | 'offline' | 'in_game';
  friendship_id: string;
  created_at: string;
}

interface UserProfile extends UserPublic {
  online_status: 'online' | 'offline' | 'in_game';
  friends_count: number;
}

interface UserSearchResult {
  id: string;
  username: string;
  avatar: string | null;
}

class ApiService {
  private readonly baseUrl: string = import.meta.env.VITE_API_URL ?? '/api/v1';

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = localStorage.getItem('ft_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const json: unknown = await res.json();

    if (!res.ok) throw json as ApiError;

    return (json as ApiResponse<T>).data;
  }

  // Paginated responses are not wrapped in an extra { data: ... } layer
  private async requestPaginated<T>(path: string): Promise<PaginatedResponse<T>> {
    const token = localStorage.getItem('ft_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    const json: unknown = await res.json();

    if (!res.ok) throw json as ApiError;

    return json as PaginatedResponse<T>;
  }

  auth = {
    register: (req: RegisterRequest): Promise<AuthResponse> =>
      this.request<AuthResponse>('POST', '/auth/register', req),

    login: (req: LoginRequest): Promise<AuthResponse> =>
      this.request<AuthResponse>('POST', '/auth/login', req),

    getMe: (): Promise<UserPublic> =>
      this.request<UserPublic>('GET', '/auth/me'),

    updateProfile: (req: UpdateProfileRequest): Promise<UserPublic> =>
      this.request<UserPublic>('PUT', '/auth/profile', req),
  };

  users = {
    search: (query: string): Promise<UserSearchResult[]> =>
  this.request<UserSearchResult[]>(
    'GET',
    `/users/search?query=${encodeURIComponent(query)}`
  ),
	getById: (id: string): Promise<UserProfile> =>
		this.request<UserProfile>('GET', `/users/${id}`),
	};

	friends = {
	getList: (): Promise<FriendPublic[]> =>
		this.request<FriendPublic[]>('GET', '/friends'),

	add: (userId: string): Promise<FriendPublic> =>
		this.request<FriendPublic>('POST', `/friends/${userId}`),

	remove: (userId: string): Promise<{ message: string }> =>
		this.request<{ message: string }>('DELETE', `/friends/${userId}`),
	};

  maps = {
    getPublished: (page = 1, difficulty?: Difficulty): Promise<PaginatedResponse<MapSummary>> => {
      const params = new URLSearchParams({ page: String(page) });
      if (difficulty) params.set('difficulty', difficulty);
      return this.requestPaginated<MapSummary>(`/maps?${params}`);
    },

    getById: (id: string): Promise<MapData> =>
      this.request<MapData>('GET', `/maps/${id}`),

    getMine: (): Promise<MapData[]> =>
      this.request<MapData[]>('GET', '/maps/my'),

    create: (req: CreateMapRequest): Promise<MapData> =>
      this.request<MapData>('POST', '/maps', req),

    update: (id: string, req: UpdateMapRequest): Promise<MapData> =>
      this.request<MapData>('PUT', `/maps/${id}`, req),

    delete: (id: string): Promise<void> =>
      this.request<void>('DELETE', `/maps/${id}`),

    markComplete: (id: string): Promise<MapData> =>
      this.request<MapData>('POST', `/maps/${id}/complete`),

    publish: (id: string): Promise<MapData> =>
      this.request<MapData>('POST', `/maps/${id}/publish`),

    unpublish: (id: string): Promise<MapData> =>
      this.request<MapData>('POST', `/maps/${id}/unpublish`),
  };

  tower = {
    getList: (): Promise<TowerLevel[]> =>
      this.request<TowerLevel[]>('GET', '/tower'),

    getLevel: (order_index: number): Promise<TowerLevelFull> =>
      this.request<TowerLevelFull>('GET', `/tower/${order_index}`),

  start: (
    order_index: number,
  ): Promise<{ run_token: string; started_at: number }> =>
    this.request<{ run_token: string; started_at: number }>(
      'POST',
      `/tower/${order_index}/start`,
    ),

  complete: (
    order_index: number,
    run_token: string,
  ): Promise<{ tower_progress: number; diamonds: number }> =>
    this.request<{ tower_progress: number; diamonds: number }>(
      'POST',
      `/tower/${order_index}/complete`,
      { run_token },
    ),
  };

  admin = {
    getTowerLevels: (): Promise<AdminMap[]> =>
      this.request<AdminMap[]>('GET', '/admin/tower'),

    updateTowerLevel: (
      order_index: number,
      data: { name?: string; grid_json?: string },
    ): Promise<AdminMap> =>
      this.request<AdminMap>('PUT', `/admin/tower/${order_index}`, data),
  };

  scores = {
    start: (
      map_id: string,
    ): Promise<{ run_token: string; started_at: number }> =>
      this.request<{ run_token: string; started_at: number }>(
        'POST',
        '/scores/start',
        { map_id },
      ),

    submit: (
      run_token: string,
      completion_time_ms: number,
    ): Promise<ScoreResult> =>
      this.request<ScoreResult>('POST', '/scores', {
        run_token,
        completion_time_ms,
    }),

    getLeaderboard: (map_id: string): Promise<ScoreEntry[]> =>
      this.request<ScoreEntry[]>('GET', `/scores/leaderboard/${map_id}`),

    getMapPointsLeaderboard: (map_id: string): Promise<LeaderboardEntry[]> =>
      this.request<LeaderboardEntry[]>('GET', `/scores/leaderboard/${map_id}/points`),

    getGlobalLeaderboard: (): Promise<LeaderboardEntry[]> =>
      this.request<LeaderboardEntry[]>('GET', '/scores/leaderboard/global'),
  };
}

export const api = new ApiService();
export type { UpdateProfileRequest, TowerLevel, TowerLevelFull, AdminMap, ScoreEntry, ScoreResult, FriendPublic, UserProfile, UserSearchResult };
