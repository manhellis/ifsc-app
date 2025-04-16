import { Context } from 'elysia';
import { auth } from '../utils/auth'; // your auth service instance

export const authMiddleware = async (context: Context, next: () => Promise<void>) => {
  if (!['POST', 'GET'].includes(context.request.method)) {
    context.error(405);
    return;
  }
  // Call your auth handler and await its result
  await auth.handler(context.request);
  // After authentication, proceed with next middleware/handler
  await next();
};