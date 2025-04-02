import { Elysia } from 'elysia';
import { 
  getAllIFSCDocuments, 
  getIFSCDocumentById, 
  getIFSCDocumentsByQuery,
  createIFSCDocument,
  updateIFSCDocument,
  deleteIFSCDocument
} from '../models/ifscData';
import { requireAuth, type AuthContext } from '../services/auth';

// IFSC data routes
export const ifscDataRoutes = new Elysia({ prefix: '/ifsc-data' })
  .use(requireAuth)
  
  // Get all documents with pagination
  .get('/', async ({ query, user, isAuthenticated, set }: AuthContext & { query: any, set: any }) => {
    try {
      // Check if user is authenticated and user object exists
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Parse pagination parameters
      const limit = query.limit ? parseInt(query.limit) : 100;
      const skip = query.skip ? parseInt(query.skip) : 0;
      
      // Get documents from database
      const documents = await getAllIFSCDocuments(limit, skip);
      return { documents, count: documents.length };
    } catch (error) {
      console.error('Error fetching IFSC documents:', error);
      set.status = 500;
      return { error: 'Failed to fetch IFSC documents' };
    }
  })
  
  // Get document by ID
  .get('/:id', async ({ params, user, isAuthenticated, set }: AuthContext & { params: { id: string }, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Get document by ID
      const document = await getIFSCDocumentById(params.id);
      
      if (!document) {
        set.status = 404;
        return { error: 'Document not found' };
      }
      
      return { document };
    } catch (error) {
      console.error('Error fetching IFSC document:', error);
      set.status = 500;
      return { error: 'Failed to fetch IFSC document' };
    }
  })
  
  // Query documents with search parameters and pagination
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
      
      // Get documents matching query
      const documents = await getIFSCDocumentsByQuery(query, limit, skip);
      return { documents, count: documents.length };
    } catch (error) {
      console.error('Error querying IFSC documents:', error);
      set.status = 500;
      return { error: 'Failed to query IFSC documents' };
    }
  })
  
  // Create new document
  .post('/', async ({ body, user, isAuthenticated, set }: AuthContext & { body: any, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Validate request body
      if (!body || typeof body !== 'object' || !body.title) {
        set.status = 400;
        return { error: 'Invalid request body. Document must include a title' };
      }
      
      // Create document with required fields
      const newDocument = {
        title: body.title,
        content: body.content || {},
        tags: Array.isArray(body.tags) ? body.tags : []
      };
      
      // Save document to database
      const result = await createIFSCDocument(newDocument);
      
      if (result.acknowledged) {
        return { 
          success: true, 
          message: 'Document created successfully',
          documentId: result.documentId
        };
      } else {
        set.status = 500;
        return { error: 'Failed to create document' };
      }
    } catch (error) {
      console.error('Error creating IFSC document:', error);
      set.status = 500;
      return { error: 'Failed to create IFSC document' };
    }
  })
  
  // Update document
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
      
      // Update document fields
      const update = {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.tags && { tags: body.tags })
      };
      
      // Update document in database
      const result = await updateIFSCDocument(params.id, update);
      
      if (result.acknowledged && result.matchedCount > 0) {
        return { 
          success: true, 
          message: 'Document updated successfully',
          modifiedCount: result.modifiedCount
        };
      } else if (result.matchedCount === 0) {
        set.status = 404;
        return { error: 'Document not found' };
      } else {
        set.status = 500;
        return { error: 'Failed to update document' };
      }
    } catch (error) {
      console.error('Error updating IFSC document:', error);
      set.status = 500;
      return { error: 'Failed to update IFSC document', details: String(error) };
    }
  })
  
  // Delete document
  .delete('/:id', async ({ params, user, isAuthenticated, set }: AuthContext & { params: { id: string }, set: any }) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        set.status = 401;
        return { error: 'Not authenticated' };
      }
      
      // Delete document from database
      const result = await deleteIFSCDocument(params.id);
      
      if (result.acknowledged && result.deletedCount > 0) {
        return { 
          success: true, 
          message: 'Document deleted successfully' 
        };
      } else if (result.deletedCount === 0) {
        set.status = 404;
        return { error: 'Document not found' };
      } else {
        set.status = 500;
        return { error: 'Failed to delete document' };
      }
    } catch (error) {
      console.error('Error deleting IFSC document:', error);
      set.status = 500;
      return { error: 'Failed to delete IFSC document', details: String(error) };
    }
  }); 