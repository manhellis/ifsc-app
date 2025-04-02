import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

// Interface for the authenticated user data
export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

// Error response when not authenticated
const authError = {
  error: 'Authentication required',
  status: 401,
};

// Authentication middleware factory
export const createAuthMiddleware = (jwtConfig: { secret: string; exp?: string }) => {
  // Create JWT plugin instance
  const jwtPlugin = jwt(jwtConfig);
  
  return new Elysia()
    .use(jwtPlugin) // Use the JWT plugin within this Elysia instance
    .derive({ as: 'global' }, async ({ cookie, set, jwt }) => {
      // Get token from cookie - safely handle undefined
      if (!cookie || !cookie.auth_token) {
        set.status = 401;
        return authError;
      }
      
      const token = String(cookie.auth_token);
      
      // Use the jwt instance from the context, which is provided by the plugin
      const payload = await jwt.verify(token);
      
      if (!payload) {
        set.status = 401;
        return authError;
      }
      
      // Return authenticated user data for use in routes
      return { 
        user: {
          userId: payload.userId as string,
          email: payload.email as string,
          name: payload.name as string
        }
      };
    });
};

