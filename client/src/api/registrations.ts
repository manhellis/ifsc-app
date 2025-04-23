import { apiRequest } from './utils';

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

export type { Athlete, Category }; 