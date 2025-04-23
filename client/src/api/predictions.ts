import { PodiumPrediction } from '../../../shared/types/Prediction';
import { apiRequest } from './utils';

// Predictions API interfaces
export interface PredictionResponse {
  prediction: PodiumPrediction;
}

export interface PredictionCreateResponse {
  success: boolean;
  message?: string;
  predictionId?: string;
  error?: string;
}

export interface PredictionUpdateResponse {
  success: boolean;
  message?: string;
  modifiedCount?: number;
  error?: string;
}

export interface PredictionDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PredictionQueryResponse {
  predictions: PodiumPrediction[];
  count: number;
}

export const predictionsApi = {
  /**
   * Create a new prediction
   */
  async createPrediction(prediction: Omit<PodiumPrediction, '_id'>): Promise<PredictionCreateResponse> {
    return apiRequest<PredictionCreateResponse>('/api/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prediction),
    });
  },

  /**
   * Get a prediction by ID
   */
  async getPredictionById(id: string): Promise<PredictionResponse> {
    if (!id) {
      throw new Error('Prediction ID is required');
    }
    return apiRequest<PredictionResponse>(`/api/predictions/${id}`);
  },

  /**
   * Update a prediction
   */
  async updatePrediction(id: string, update: Partial<PodiumPrediction>): Promise<PredictionUpdateResponse> {
    if (!id) {
      throw new Error('Prediction ID is required');
    }
    return apiRequest<PredictionUpdateResponse>(`/api/predictions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
  },

  /**
   * Delete a prediction
   */
  async deletePrediction(id: string): Promise<PredictionDeleteResponse> {
    if (!id) {
      throw new Error('Prediction ID is required');
    }
    return apiRequest<PredictionDeleteResponse>(`/api/predictions/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Lock a prediction (admin only)
   */
  async lockPrediction(id: string): Promise<PredictionUpdateResponse> {
    if (!id) {
      throw new Error('Prediction ID is required');
    }
    return apiRequest<PredictionUpdateResponse>(`/api/predictions/${id}/lock`, {
      method: 'PUT',
    });
  },

  /**
   * Query predictions with filters
   */
  async queryPredictions(
    query: Record<string, unknown> = {}, 
    limit: number = 100, 
    skip: number = 0
  ): Promise<PredictionQueryResponse> {
    return apiRequest<PredictionQueryResponse>('/api/predictions/query', {
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
  },
}; 