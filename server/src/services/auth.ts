import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';
import { AccountType } from '../../../shared/types/userTypes';

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
};

// Create cookie plugin with specific options
const cookiePlugin = cookie({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

// Create JWT plugin
const jwtPlugin = jwt(jwtConfig);

// Define user payload type
export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  exp?: number;
  accountType: AccountType;
}

// Auth service with Elysia instance
export const authService = new Elysia()
  .use(cookiePlugin)
  .use(jwtPlugin)
  .derive({ as: 'global' }, async ({ cookie, jwt, set, headers }) => {
    // Get token from cookie or Authorization header
    let tokenValue: string | undefined = cookie.auth_token;
    
    if (!tokenValue && headers.authorization) {
      const authHeader = headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        tokenValue = authHeader.substring(7);
      }
    }
    
    if (!tokenValue) {
      return { user: null, isAuthenticated: false };
    }
    
    // Decode the token value from URL encoding
    tokenValue = decodeURIComponent(tokenValue);
    
    // Verify and decode JWT
    try {
      const payload = await jwt.verify(tokenValue);
      if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
        return { user: null, isAuthenticated: false };
      }
      
      // Return the user payload
      return { 
        user: payload as unknown as UserPayload,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return { user: null, isAuthenticated: false };
    }
  });

// Helper functions to use in routes
export const requireAuth = new Elysia()
  .use(authService)
  .guard({
    beforeHandle: ({ isAuthenticated, set }) => {
      if (!isAuthenticated) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
    }
  });

// Export types for context
export type AuthContext = {
  user: UserPayload;
  isAuthenticated: boolean;
} 