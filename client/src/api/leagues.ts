import { apiRequest } from './utils';

// League API interfaces
export interface League {
  _id: string;
  name: string;
  type: "public" | "private";
  adminIds?: string[];
  memberIds?: string[];
  inviteCode?: string;
  slug?: string;
  description?: string;
  isCurrentUserAdminOrOwner?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
  memberCount?: number;
}

export interface Ranking {
  userId: string;
  userName: string;
  avatarUrl?: string;
  eventResults: { eventName: string; points: number }[];
  totalPoints: number;
}

export interface LeagueCreateResponse {
  leagueId?: string;
  error?: string;
  success: boolean;
  slug?: string;
}

// Define a more accurate response type for the create operation
interface LeagueCreateApiResponse {
  success: boolean;
  leagueId?: string;
  slug?: string;
  error?: string;
}

export const leagueApi = {
  /**
   * Create a new league
   */
  async createLeague(data: {
    name: string;
    description?: string;
    type: "public" | "private";
    maxMembers?: number;
  }): Promise<LeagueCreateResponse> {
    try {
      const response = await fetch('/api/leagues', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const raw = await response.text();

      // Initialize with a default error state in case of parsing failure
      let responseData: LeagueCreateApiResponse = { success: false, error: "Failed to parse server response" };
      try {
        // Attempt to parse only if raw is not empty
        if (raw) {
            const parsed = JSON.parse(raw);
            // Basic check if parsed data looks like our expected structure
            if (typeof parsed === 'object' && parsed !== null && typeof parsed.success === 'boolean') {
                 responseData = parsed as LeagueCreateApiResponse; // Assume structure matches if basic checks pass
            } else {
                 // If parsing succeeds but doesn't match expected structure, use raw as error
                 console.error("League creation: parsed JSON unexpected format. Raw:", raw);
                 responseData = { success: false, error: `Unexpected response format: ${raw.slice(0, 100)}` };
            }
        } else {
             // Handle empty response body, maybe it's an unexpected success/failure?
             responseData = { success: false, error: "Server returned an empty response." };
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_parseErr) { // Prefix unused variable with _
        console.error("League creation: failed to parse JSON. Raw response:", raw);
        // Use the raw response as the error message if JSON parsing fails
        responseData = { success: false, error: raw };
      }

      // Check HTTP status first
      if (!response.ok) {
        return {
          success: false,
          // Use error from parsed data if available, otherwise construct from status
          error: responseData?.error || `Server returned ${response.status}: ${response.statusText}`
        };
      }

      // Now check the success flag from the parsed data body
      if (!responseData.success) {
        return {
          success: false,
          error: responseData.error || 'Unknown error occurred' // Use error from data
        };
      }

      // On success, return the data from the response body
      // We return the backend slug here, no need to regenerate on client
      return {
        success: true,
        leagueId: responseData.leagueId,
        slug: responseData.slug // Use slug from backend response
      };
    } catch (error) {
      console.error("League creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  /**
   * Fetch a single league by ID
   */
  async getLeagueById(leagueId: string): Promise<{ league: League }> {
    return apiRequest<{ league: League }>(`/api/leagues/${leagueId}`);
  },

  /**
   * Fetch a single league by slug
   */
  async getLeagueBySlug(slug: string): Promise<{ league: League }> {
    return apiRequest<{ league: League }>(`/api/leagues/slug/${slug}`);
  },
  
  /**
   * Fetch leagues by type (public or private)
   */
  async queryLeagues(params: { type?: "public" | "private" }): Promise<{ leagues: League[] }> {
    return apiRequest<{ leagues: League[] }>(`/api/leagues/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },
  async getPublicLeagues(): Promise<{ leagues: League[] }> {
    return apiRequest<{ leagues: League[] }>(`/api/leagues/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: {}, type: "public" }),
    });
  },
  
  /**
   * Request to join a public league
   */
  async requestToJoin(leagueId: string): Promise<void> {
    if (!leagueId || !/^[0-9a-fA-F]{24}$/.test(leagueId)) {
      throw new Error('Invalid league ID format: must be a 24 character hex string');
    }
    return apiRequest<void>(`/api/leagues/${leagueId}/join-request`, {
      method: "POST",
    });
  },
  
  /**
   * Join a private league with an invite code
   */
  async joinPrivateLeague(leagueId: string, inviteCode: string): Promise<void> {
    return apiRequest<void>(`/api/leagues/${leagueId}/join-private`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
  },
  
  /**
   * Fetch the leaderboard for a league
   */
  async getLeagueLeaderboard(leagueId: string): Promise<Ranking[]> {
    return apiRequest<Ranking[]>(`/api/leagues/${leagueId}/leaderboard`);
  },

  /**
   * Toggle league privacy between public and private
   */
  async toggleLeaguePrivacy(leagueId: string, type: "public" | "private"): Promise<void> {
    return apiRequest<void>(`/api/leagues/${leagueId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
  },

  /**
   * Create an invitation for a private league
   */
  async createLeagueInvitation(leagueId: string, invitedUserId: string): Promise<{ invitationId: string }> {
    return apiRequest<{ invitationId: string }>(`/api/leagues/${leagueId}/invite-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitedUserId }),
    });
  },

  /**
   * Remove a member from the league
   */
  async removeMember(leagueId: string, userId: string): Promise<void> {
    return apiRequest<void>(`/api/leagues/${leagueId}/remove/${userId}`, {
      method: "POST",
    });
  },

  /**
   * Leave the league
   */
  async leaveLeague(leagueId: string): Promise<void> {
    return apiRequest<void>(`/api/leagues/${leagueId}/leave`, {
      method: "POST",
    });
  },

  /**
   * Get IDs of leagues the current user has pending join requests for.
   */
  async getMyPendingRequests(): Promise<{ pendingLeagueIds: string[] }> {
    return apiRequest<{ pendingLeagueIds: string[] }>(`/api/leagues/my-pending-requests`);
  },

  /**
   * Cancel a pending join request for a specific league.
   */
  async cancelJoinRequest(leagueId: string): Promise<{ success: boolean, message?: string }> {
    if (!leagueId) {
      throw new Error('League ID is required');
    }
    return apiRequest<{ success: boolean, message?: string }>(`/api/leagues/${leagueId}/cancel-join-request`, {
      method: "POST",
    });
  },

  /**
   * Get all leagues where the current user is a member, admin, or owner
   */
  async getMyLeagues(): Promise<{ leagues: League[] }> {
    return apiRequest<{ leagues: League[] }>('/api/leagues/my-leagues');
  },

  /**
   * Approve a pending join request
   */
  async approveJoinRequest(leagueId: string, userId: string): Promise<void> {
    return apiRequest<void>(`/api/leagues/${leagueId}/approve/${userId}`, {
      method: "POST",
    });
  },

  /**
   * Reject a pending join request
   */
  async rejectJoinRequest(leagueId: string, userId: string): Promise<void> {
    return apiRequest<void>(`/api/leagues/${leagueId}/reject/${userId}`, {
      method: "POST",
    });
  }
}; 