import { Elysia } from 'elysia';
import { getUserDataById, updateUserData } from '../models/userData';
import { requireAuth, type AuthContext } from '../services/auth';

// User data routes
export const userDataRoutes = new Elysia({ prefix: '/user-data' })
  .use(requireAuth)
  .get('/', async ({ user, isAuthenticated, set }: AuthContext & { set: any }) => {
    try {
      // Check if user is authenticated and user object exists
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Get user data from database
      const userData = await getUserDataById(user.userId);
      return { userData };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { error: 'Failed to fetch user data' };
    }
  })
  .put('/', async ({ body, user, isAuthenticated, set }: AuthContext & { body: any, set: any }) => {
    // Check if user is authenticated and user object exists
    if (!isAuthenticated || !user) {
      set.status = 401;
      return { error: 'Not authenticated' };
    }
    
    // Validate request body
    if (!body || typeof body !== 'object' || typeof body.userData !== 'string') {
      set.status = 400;
      return { error: 'Invalid request body. Expected { userData: string }' };
    }

    try {
      // Update user data in database
      const updated = await updateUserData(user.userId, body.userData);
      
      if (updated) {
        return { success: true, message: 'User data updated successfully' };
      } else {
        set.status = 500;
        return { error: 'Failed to update user data' };
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      set.status = 500;
      return { error: 'Failed to update user data' };
    }
  }); 