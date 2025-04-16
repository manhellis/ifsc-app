import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { connectToDatabase } from './db';
import { todoRoutes } from './routes/todo';
import { userDataRoutes } from './routes/user-data';
import { ifscDataRoutes } from './routes/ifsc-data';
import { eventsRoutes } from './routes/events';
import { fullResultsRoutes } from './routes/fullResults';
import { createEventIndices } from './models/events';
import { createFullResultsIndices } from './models/fullResults';
import { Context } from 'elysia';
import { auth } from './utils/auth';
import { authMiddleware } from './middleware/authMiddleware';


// Connect to MongoDB
connectToDatabase().then(async () => {
  console.log('Database connection established');
  
  // Create indices for new collections
  await createEventIndices();
  await createFullResultsIndices();
  console.log('Indices created for events and fullResults collections');
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Define the port
const port = Number(process.env.PORT) || 3000;
 
const betterAuthView = (context: Context) => {
    const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"]
    // validate request method
    if(BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
        return auth.handler(context.request);
    } else {
        context.error(405)
    }
}
 

// Create an Elysia app
const app = new Elysia()
  .use(swagger())
  .use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'], // Include both dev and preview URLs
    credentials: true, // Allow cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .all('/api/auth/*', betterAuthView)   
  // .mount(auth.handler)
  // .use(userDataRoutes)
  // .use(ifscDataRoutes)
  .group('/events', group => group.all('/*', authMiddleware).use(eventsRoutes))
  // .use("/fullResults", fullResultsRoutes)
  .listen(port);

console.log(`🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`View documentation at "${app.server!.url}swagger" in your browser`);

// Export type for client consumption
export type App = typeof app;