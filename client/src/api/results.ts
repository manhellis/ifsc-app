import { FullResult } from '../../../shared/types/fullResults';
import { apiRequest } from './utils';

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