import { apiRequest } from './utils';

// Standing interfaces
export interface Standing {
  _id?: string;
  leagueId: string;
  userId: string;
  totalPoints: number;
  eventHistory: Array<{
    eventId: string;
    points: number;
    timestamp: string;
    categoryId?: string;
    categoryName?: string;
  }>;
  lastUpdated: string;
  createdAt?: string;
}

export interface StandingsResponse {
  standings: Standing[];
}

export interface UserStandingResponse {
  standing: Standing | null;
}

export interface StandingsQueryResponse {
  standings: Standing[];
  count: number;
}

// Interface for leaderboard data
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPoints: number;
  eventResults: Array<{
    eventId: string;
    points: number;
    timestamp: string;
    categoryId?: string;
    categoryName?: string;
  }>;
}

export interface LeaderboardResponse {
  rankings: LeaderboardEntry[];
  total: number;
}

export const standingsApi = {
  /**
   * Get all standings for a league
   */
  async getLeagueStandings(leagueId: string): Promise<StandingsResponse> {
    if (!leagueId) {
      throw new Error('League ID is required');
    }
    return apiRequest<StandingsResponse>(`/api/standings/league/${leagueId}`);
  },

  /**
   * Get leaderboard for a league
   */
  async getLeagueLeaderboard(
    leagueId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<LeaderboardResponse> {
    if (!leagueId) {
      throw new Error('League ID is required');
    }
    
    const { limit = 100, offset = 0 } = options || {};
    const queryParams = new URLSearchParams();
    
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return apiRequest<LeaderboardResponse>(`/api/leagues/${leagueId}/leaderboard${queryString}`);
  },

  /**
   * Get standing for a specific user in a league
   */
  async getUserStanding(leagueId: string, userId: string): Promise<UserStandingResponse> {
    if (!leagueId || !userId) {
      throw new Error('League ID and User ID are required');
    }
    return apiRequest<UserStandingResponse>(`/api/standings/league/${leagueId}/user/${userId}`);
  },

  /**
   * Query standings with filters (for admin or advanced queries)
   */
  async queryStandings(
    query: Record<string, unknown> = {},
    limit: number = 100,
    skip: number = 0
  ): Promise<StandingsQueryResponse> {
    return apiRequest<StandingsQueryResponse>('/api/standings/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        skip,
      }),
    });
  }
}; 