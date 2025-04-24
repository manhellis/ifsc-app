import { apiRequest } from './utils';

// Scoring API interfaces
export interface ScoreEventResponse {
  success: boolean;
  processed?: number;
  leagues?: number;
  message?: string;
  error?: string;
}

export interface FetchFullResultsResponse {
  success: boolean;
  categoriesProcessed: number;
  message?: string;
  error?: string;
}

export interface EventScoreStatus {
  eventId: string;
  eventName?: string;
  predictionsTotal: number;
  predictionsScored: number;
  isFullyScored: boolean;
  lastScored?: string;
}

export interface EventScoreStatusResponse {
  status: EventScoreStatus;
}

export interface EventsScoreStatusResponse {
  events: EventScoreStatus[];
  count: number;
}

export const scoringApi = {
  /**
   * Score an event (admin only)
   * Processes all unfinished predictions for an event across all leagues
   */
  async scoreEvent(eventId: string): Promise<ScoreEventResponse> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<ScoreEventResponse>('/api/score-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
      }),
    });
  },

  /**
   * Fetch full results for an event from IFSC API (admin only)
   */
  async fetchFullResults(eventId: string): Promise<FetchFullResultsResponse> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<FetchFullResultsResponse>('/api/fetch-full-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
      }),
    });
  },

  /**
   * Get scoring status for a specific event
   */
  async getEventScoreStatus(eventId: string): Promise<EventScoreStatusResponse> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<EventScoreStatusResponse>(`/api/scoring/status/${eventId}`);
  },

  /**
   * Get scoring status for multiple events
   */
  async getEventsScoreStatus(
    query: Record<string, unknown> = {},
    limit: number = 100,
    skip: number = 0
  ): Promise<EventsScoreStatusResponse> {
    return apiRequest<EventsScoreStatusResponse>('/api/scoring/events-status', {
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