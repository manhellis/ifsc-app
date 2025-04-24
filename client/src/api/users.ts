import { AccountType } from '@shared/types/userTypes';
import { apiRequest } from './utils';

// Public user info interface
export interface PublicUserInfo {
  id: string;
  name: string;
  picture: string | null;
  accountType: AccountType;
}

// Users API
export const usersApi = {
  /**
   * Fetch public information for a user by ID
   */
  async getUserById(userId: string): Promise<PublicUserInfo> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const response = await apiRequest<PublicUserInfo>(`/api/users/${userId}`);
    return response;
  },

  /**
   * Fetch public information for multiple users at once
   */
  async getUsersByIds(userIds: string[]): Promise<PublicUserInfo[]> {
    if (!userIds || userIds.length === 0) {
      throw new Error('At least one user ID is required');
    }
    return apiRequest<PublicUserInfo[]>('/api/users/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds }),
    });
  }
};
