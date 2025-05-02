import { Event } from '../../../shared/types/events';
import { apiRequest } from './utils';

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
  /**
   * Fetch recent events from the current year up to today
   */
  async fetchRecentEvents(): Promise<{ events: Event[] }> {
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    
    const query = {
      local_start_date: {
        $gte: startOfYear,
        $lte: today
      }
    };
    
    return apiRequest<{ events: Event[], count: number }>('/api/events/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 100,
        skip: 0
      }),
    });
  },
  async fetchEventNameById(eventId: number): Promise<{ name: string }> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<{ name: string }>(`/api/events/name/${eventId}`);
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

  /**
   * Lock an event (admin only)
   */
  async lockEvent(eventId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<{ success: boolean; message?: string; error?: string }>(`/api/events/${eventId}/lock`, {
      method: 'PUT',
    });
  },

  /**
   * Unlock an event (admin only)
   */
  async unlockEvent(eventId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    return apiRequest<{ success: boolean; message?: string; error?: string }>(`/api/events/${eventId}/unlock`, {
      method: 'PUT',
    });
  },
}; 