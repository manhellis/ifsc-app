import { Elysia } from 'elysia';
import { OAuth2Client } from 'google-auth-library';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';
import { createUser, getUserByGoogleId } from '../models/user';

// Google OAuth client configuration
const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:5173/api/auth/google/callback',
});

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  exp: '7d', // Token expires in 7 days
};

// Create cookie plugin with specific options
const cookiePlugin = cookie({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
});

// Create JWT plugin
const jwtPlugin = jwt(jwtConfig);

// Auth routes
export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(cookiePlugin)
  .use(jwtPlugin)
  .get('/google', async () => {
    // Generate Google OAuth URL
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent',
    });
    
    // Return the Google auth URL for the client to redirect
    return { authUrl };
  })
  .get('/google/callback', async ({ query, jwt, set, headers }) => {
    try {
      if (!query.code) {
        set.status = 400;
        return { error: 'Authorization code not provided' };
      }

      // Exchange authorization code for tokens
      const { tokens } = await client.getToken(query.code as string);
      client.setCredentials(tokens);

      // Get user info
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token as string,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        set.status = 401;
        return { error: 'Invalid authentication' };
      }

      // Extract user data
      const { sub: googleId, email, name, picture } = payload;
      
      if (!email || !googleId) {
        set.status = 400;
        return { error: 'Email or Google ID not provided' };
      }

      // Find or create user
      let user = await getUserByGoogleId(googleId);
      
      if (!user) {
        user = await createUser({
          googleId,
          email,
          name: name || email,
          picture,
        });
      }

      // Create JWT
      const token = await jwt.sign({
        userId: user._id?.toString(),
        email: user.email,
        name: user.name,
      });

      // Manually set the auth cookie using the Set-Cookie header
      if (!set.headers) { set.headers = {}; }
      (set.headers as Record<string, string>)['Set-Cookie'] = `auth_token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

      // Create redirect URL with token
      const redirectUrl = `${process.env.FRONTEND_URL || ''}/?token=${encodeURIComponent(token)}`;
      
      // Check if it's a browser request by examining Accept header
      const acceptHeader = headers.accept;
      const isHtmlRequest = typeof acceptHeader === 'string' && 
                           (acceptHeader.includes('text/html') || 
                            acceptHeader.includes('*/*'));
      
      // If it looks like a direct browser request, return HTML with auto-redirect
      if (isHtmlRequest) {
        set.headers['Content-Type'] = 'text/html';
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <script>
              // Store token in localStorage
              localStorage.setItem('auth_token', "${token}");
              // Redirect to frontend
              window.location.href = "${process.env.FRONTEND_URL || '/'}";
            </script>
          </head>
          <body>
            <p>Authentication successful. Redirecting...</p>
          </body>
          </html>
        `;
      }
      
      // For API calls, return JSON
      return { success: true, redirectUrl, token };
    } catch (error: any) {
      console.error('Google auth error:', error);
      set.status = 500;
      return { error: 'Authentication failed', details: error.message };
    }
  })
  .get('/me', async ({ jwt, cookie, set, headers }) => {
    try {
      // Try to get token from cookie first
      let tokenValue: string | undefined = cookie.auth_token;
      
      // If not in cookie, check Authorization header
      if (!tokenValue && headers.authorization) {
        const authHeader = headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          tokenValue = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
      }
      
      if (!tokenValue) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      // Decode the token value from URL encoding
      tokenValue = decodeURIComponent(tokenValue);

      // Verify and decode JWT - wrap in try/catch to handle invalid tokens gracefully
      try {
        const payload = await jwt.verify(tokenValue);
        if (!payload) {
          set.status = 401;
          return { error: 'Invalid token' };
        }

        // Return user data from token
        return { 
          user: {
            userId: payload.userId,
            email: payload.email,
            name: payload.name
          } 
        };
      } catch (verifyError) {
        console.error('Token verification error:', verifyError);
        set.status = 401;
        return { error: 'Invalid token', details: 'Token could not be verified' };
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      set.status = 401;
      return { error: 'Authentication failed' };
    }
  })
  .get('/logout', async ({ set }) => {
    try {
      // Clear auth cookie by manually setting the Set-Cookie header with expired cookie
      if (!set.headers) { set.headers = {}; }
      (set.headers as Record<string, string>)['Set-Cookie'] = `auth_token=; HttpOnly; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      
      // Return redirect URL
      const redirectUrl = process.env.FRONTEND_URL || '/';
      return { redirectUrl };
    } catch (error: any) {
      console.error('Logout error:', error);
      set.status = 500;
      return { error: 'Logout failed', details: error.message };
    }
  }); 