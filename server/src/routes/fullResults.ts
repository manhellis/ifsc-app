import { Elysia } from 'elysia';
import { 
  getAllFullResults, 
  getFullResultById,
  getFullResultsByEvent, 
  getFullResultsByQuery,
  createFullResult,
  updateFullResult,
  deleteFullResult,
  getFullResultByIdAndCid
} from '../models/fullResults';
import { requireAuth, type AuthContext } from '../utils/auth';

// FullResults routes
export const fullResultsRoutes = new Elysia({ prefix: '/results' })
  .use(requireAuth)
  
  // Get all results with pagination
  .get('/', async ({ query, user, isAuthenticated, set }: AuthContext & { query: any, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Parse pagination parameters
      const limit = query.limit ? parseInt(query.limit) : 100;
      const skip = query.skip ? parseInt(query.skip) : 0;
      
      // Get results from database
      const results = await getAllFullResults(limit, skip);
      return { results, count: results.length };
    } catch (error) {
      console.error('Error fetching results:', error);
      set.status = 500;
      return { error: 'Failed to fetch results' };
    }
  })
  
  // Get results by event
  .get('/event/:eventName', async ({ params, query, user, isAuthenticated, set }: AuthContext & { params: { eventName: string }, query: any, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Parse pagination parameters
      const limit = query.limit ? parseInt(query.limit) : 100;
      const skip = query.skip ? parseInt(query.skip) : 0;
      
      // Get results for the event
      const results = await getFullResultsByEvent(params.eventName, limit, skip);
      return { results, count: results.length };
    } catch (error) {
      console.error('Error fetching results by event:', error);
      set.status = 500;
      return { error: 'Failed to fetch results by event' };
    }
  })
  
  // Get result by ID and CID
  .get('/:id/:cid', async ({ params, user, isAuthenticated, set }: AuthContext & { params: { id: string, cid: string }, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Get result by ID and CID
      const id = parseInt(params.id, 10);
      const cid = parseInt(params.cid, 10);
      
      if (isNaN(id) || isNaN(cid)) {
        set.status = 400;
        return { error: 'Invalid ID or CID parameter' };
      }
      
      const result = await getFullResultByIdAndCid(id, cid);
      
      if (!result) {
        set.status = 404;
        return { error: 'Result not found' };
      }
      
      return { result };
    } catch (error) {
      console.error('Error fetching result by ID and CID:', error);
      set.status = 500;
      return { error: 'Failed to fetch result' };
    }
  })
  
  // Get result by ID
  .get('/:id', async ({ params, user, isAuthenticated, set }: AuthContext & { params: { id: string}, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Get result by ID
      const id = parseInt(params.id,10);
      const results = await getFullResultById(id);
      
      if (!results) {
        set.status = 404;
        return { error: 'Result not found' };
      }
      
      return { results };
    } catch (error) {
      console.error('Error fetching result:', error);
      set.status = 500;
      return { error: 'Failed to fetch result' };
    }
  })
  
  // Query results
  .post('/query', async ({ body, user, isAuthenticated, set }: AuthContext & { body: any, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Validate request body
      if (!body || typeof body !== 'object') {
        set.status = 400;
        return { error: 'Invalid request body' };
      }
      
      // Extract query and pagination parameters
      const { query = {}, limit = 100, skip = 0 } = body;
      
      // Get results matching query
      const results = await getFullResultsByQuery(query, limit, skip);
      return { results, count: results.length };
    } catch (error) {
      console.error('Error querying results:', error);
      set.status = 500;
      return { error: 'Failed to query results' };
    }
  })
  
  // Create new result
  .post('/', async ({ body, user, isAuthenticated, set }: AuthContext & { body: any, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Validate request body
      if (!body || typeof body !== 'object' || !body.event || !body.dcat) {
        set.status = 400;
        return { error: 'Invalid request body. Result must include event and dcat' };
      }
      
      // Create result
      const result = await createFullResult(body);
      
      if (result.acknowledged) {
        return { 
          success: true, 
          message: 'Result created successfully',
          resultId: result.resultId
        };
      } else {
        set.status = 500;
        return { error: 'Failed to create result' };
      }
    } catch (error) {
      console.error('Error creating result:', error);
      set.status = 500;
      return { error: 'Failed to create result' };
    }
  })
  
  // Update result
  .put('/:id', async ({ params, body, user, isAuthenticated, set }: AuthContext & { params: { id: string }, body: any, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Validate request body
      if (!body || typeof body !== 'object') {
        set.status = 400;
        return { error: 'Invalid request body' };
      }
      
      // Update result in database
      const result = await updateFullResult(params.id, body);
      
      if (result.acknowledged && result.matchedCount > 0) {
        return { 
          success: true, 
          message: 'Result updated successfully',
          modifiedCount: result.modifiedCount
        };
      } else if (result.matchedCount === 0) {
        set.status = 404;
        return { error: 'Result not found' };
      } else {
        set.status = 500;
        return { error: 'Failed to update result' };
      }
    } catch (error) {
      console.error('Error updating result:', error);
      set.status = 500;
      return { error: 'Failed to update result', details: String(error) };
    }
  })
  
  // Delete result
  .delete('/:id', async ({ params, user, isAuthenticated, set }: AuthContext & { params: { id: string }, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Delete result from database
      const result = await deleteFullResult(params.id);
      
      if (result.acknowledged && result.deletedCount > 0) {
        return { 
          success: true, 
          message: 'Result deleted successfully' 
        };
      } else if (result.deletedCount === 0) {
        set.status = 404;
        return { error: 'Result not found' };
      } else {
        set.status = 500;
        return { error: 'Failed to delete result' };
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      set.status = 500;
      return { error: 'Failed to delete result', details: String(error) };
    }
  }); 