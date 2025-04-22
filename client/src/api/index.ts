import { Event } from '../../../shared/types/events';
import { FullResult } from '../../../shared/types/fullResults';

// Define types for registrations
interface Category {
  id: number;
  name: string;
}

interface Athlete {
  athlete_id: number;
  firstname: string;
  lastname: string;
  name: string;
  gender: number;
  federation: string;
  federation_id: number;
  country: string;
  d_cats: Category[];
}

// Base API request function with common configuration
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultOptions: RequestInit = {
    credentials: 'include', // Include auth cookies with all requests
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Events API
export const eventsApi = {
  /**
   * Fetch all events
   */
  async fetchAllEvents(): Promise<{ events: Event[] }> {
    return apiRequest<{ events: Event[] }>('/api/events');
  },

  /**
   * Fetch a single event by ID
   */
  async fetchEventById(eventId: string): Promise<{ event: Event }> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<{ event: Event }>(`/api/events/${eventId}`);
  },
  async fetchUpcomingEvents(): Promise<{ events: Event[] }> {
    return apiRequest<{ events: Event[] }>('/api/events/upcoming');
  },
  async fetchEventNameById(eventId: string): Promise<{ events: Event[] }> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<{ events: Event[] }>('/api/events/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { id: eventId, type: 'event' }, limit: 1 }),
    });
  },
  
  /**
   * Query events with custom criteria
   */
  async queryEvents(query: Record<string, unknown>, limit: number = 100, skip: number = 0): Promise<{ events: Event[], count: number }> {
    return apiRequest<{ events: Event[], count: number }>('/api/events/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        skip
      }),
    });
  },
};

// Registrations API
export const registrationsApi = {
  /**
   * Fetch athlete registrations for an upcoming event
   */
  async fetchUpcomingRegistrations(eventId: string): Promise<Athlete[]> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<Athlete[]>(`/api/upcoming/${eventId}`);
  },
};

// Results API
export const resultsApi = {
  /**
   * Fetch all results
   */
  async fetchAllResults(): Promise<{ results: FullResult[] }> {
    return apiRequest<{ results: FullResult[] }>('/api/results');
  },

  /**
   * Fetch a single result by ID
   */
  async fetchResultById(resultId: string): Promise<{ results: FullResult[] }> {
    if (!resultId) {
      throw new Error('Result ID is required');
    }
    return apiRequest<{ results: FullResult[] }>(`/api/results/${resultId}`);
  },

  /**
   * Fetch a single result by ID and category ID
   */
  async fetchResultByIdAndCid(resultId: string, categoryId: string): Promise<{ result: FullResult }> {
    if (!resultId) {
      throw new Error('Result ID is required');
    }
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    return apiRequest<{ result: FullResult }>(`/api/results/${resultId}/${categoryId}`);
  },

  /**
   * Fetch results by event name
   */
  async fetchResultsByEvent(eventName: string): Promise<{ results: FullResult[] }> {
    if (!eventName) {
      throw new Error('Event name is required');
    }
    return apiRequest<{ results: FullResult[] }>(`/api/results/event/${encodeURIComponent(eventName)}`);
  },
}; 

// League API
export interface League {
  _id: string;
  name: string;
  type: "public" | "private";
  adminIds?: string[]; // Made optional as they might not be included in all responses
  memberIds?: string[]; // Made optional
  inviteCode?: string;
  slug?: string;
  description?: string; // Added description here, seems it was missing but used in query response
  isCurrentUserAdminOrOwner?: boolean; // Add the new optional flag
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
  leagueId?: string; // Backend sends ObjectId string
  slug?: string;     // Backend sends generated slug
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
    // Use apiRequest which handles errors and JSON parsing.
    // The backend returns { success: boolean, message?: string }, so the Promise type matches.
    return apiRequest<{ success: boolean, message?: string }>(`/api/leagues/${leagueId}/cancel-join-request`, {
      method: "POST",
    });
  },
};