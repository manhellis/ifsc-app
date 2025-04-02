import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectToDatabase } from './db';
import { todoRoutes } from './routes/todo';
import { authRoutes } from './routes/auth';

// Connect to MongoDB
connectToDatabase().then(() => {
  console.log('Database connection established');
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Define the port
const port = Number(process.env.PORT) || 3000;

// Create an Elysia app
const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'], // Include both dev and preview URLs
    credentials: true, // Allow cookies
  }))
  .get('/', ({ set }: { set: { redirect: string } }) => {
    // For API calls through the proxy, don't redirect but return URL
    return { redirectUrl: '/auth/google' };
  })
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(todoRoutes)
  .use(authRoutes)
  .listen(port);

console.log(`🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`);

// Export type for client consumption
export type App = typeof app; 