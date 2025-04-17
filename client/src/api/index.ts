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