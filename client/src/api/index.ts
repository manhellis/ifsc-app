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
  adminIds: string[];
  memberIds: string[];
  inviteCode?: string;
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
      
      // Use a safe parser so we don't blow up on non‑JSON bodies
      const raw = await response.text();
      let responseData: any = {};
      try {
        responseData = raw ? JSON.parse(raw) : {};
      } catch (parseErr) {
        console.error("League creation: failed to parse JSON. Raw response:", raw);
        responseData = { error: raw };
      }
      
      if (!response.ok) {
        return {
          success: false,
          error: responseData.error || `Server returned ${response.status}: ${response.statusText}`
        };
      }
      
      if (!responseData.success) {
        return {
          success: false,
          error: responseData.error || 'Unknown error occurred'
        };
      }
      
      // Generate slug for frontend navigation, just like on the server
      const slug = data.name.trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 30);
      
      return {
        success: true,
        leagueId: responseData.leagueId,
        slug
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
  
  /**
   * Request to join a public league
   */
  async requestToJoin(leagueId: string): Promise<void> {
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
};