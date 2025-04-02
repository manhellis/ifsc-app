import { Elysia, t } from 'elysia';
import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import { 
  getAllTodos, 
  createTodo, 
  getTodoById, 
  updateTodo, 
  deleteTodo 
} from '../models/todo';
import { createAuthMiddleware, AuthUser } from '../utils/auth';

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  exp: '7d',
};

// Create an auth middleware to protect routes
const authMiddleware = createAuthMiddleware(jwtConfig);

// Define a type for context with auth user
type AuthContext = {
  user: AuthUser;
};

export const todoRoutes = new Elysia({ prefix: '/todos' })
  .use(cookie())
  // Apply auth middleware to protect routes
  .use(authMiddleware)

  // Get all todos
  .get('/', async ({ user }: AuthContext) => {
    return await getAllTodos();
  })
  
  // Get todo by ID
  .get('/:id', async ({ params: { id }, user }: AuthContext & { params: { id: string } }) => {
    const todo = await getTodoById(id);
    if (!todo) {
      return new Response('Todo not found', { status: 404 });
    }
    return todo;
  })
  
  // Create todo
  .post('/', 
    async ({ body, user }: AuthContext & { body: { title: string; completed: boolean } }) => {
      return await createTodo(body);
    },
    {
      body: t.Object({
        title: t.String(),
        completed: t.Boolean({ default: false })
      })
    }
  )
  
  // Update todo
  .put('/:id', 
    async ({ params: { id }, body, user }: AuthContext & { 
      params: { id: string }, 
      body: { title?: string; completed?: boolean } 
    }) => {
      const success = await updateTodo(id, body);
      if (!success) {
        return new Response('Todo not found', { status: 404 });
      }
      return { success: true };
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        completed: t.Optional(t.Boolean())
      })
    }
  )
  
  // Delete todo
  .delete('/:id', async ({ params: { id }, user }: AuthContext & { params: { id: string } }) => {
    const success = await deleteTodo(id);
    if (!success) {
      return new Response('Todo not found', { status: 404 });
    }
    return { success: true };
  }); 