// src/middleware/roleMiddleware.ts
import { Elysia } from 'elysia';
import { UserPayload, authService } from '../services/auth';
import { AccountType } from '../../../shared/types/userTypes';

export const requireRole = (role: AccountType) => {
  return new Elysia()
    .use(authService)
    .guard({
      beforeHandle: ({ user, set, isAuthenticated }) => {
        if (!isAuthenticated || !user) {
          set.status = 401;
          return { error: "Not authenticated" };
        }
        if (user.accountType !== role) {
          set.status = 403;
          return { error: "Insufficient permissions" };
        }
      }
    });
};