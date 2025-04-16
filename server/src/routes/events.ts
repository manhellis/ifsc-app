import { Elysia } from 'elysia';
import { 
  getAllEvents, 
  getEventById,
  getEventByNumericId,
  getEventsByQuery,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents // Import the new function
} from '../models/events';

// Events routes
export const eventsRoutes = new Elysia()
  
  // Get all events with pagination
  .get('/', async ({ query, set }: { query: any, set: any }) => {
    try {
      // Parse pagination parameters
      const limit = query.limit ? parseInt(query.limit) : 100;
      const skip = query.skip ? parseInt(query.skip) : 0;
      
      // Get events from database
      const events = await getAllEvents(limit, skip);
      return { events, count: events.length };
    } catch (error) {
      console.error('Error fetching events:', error);
      set.status = 500;
      return { error: 'Failed to fetch events' };
    }
  })
  
  // Get event by ID
  .get('/:id', async ({ params, set }: { params: { id: string }, set: any }) => {
    try {
      // Try to parse as numeric ID first
      const numericId = parseInt(params.id);
      let event = null;
      
      if (!isNaN(numericId)) {
        event = await getEventByNumericId(numericId);
      }
      
      // If not found by numeric ID, try ObjectId
      if (!event) {
        event = await getEventById(params.id);
      }
      
      if (!event) {
        set.status = 404;
        return { error: 'Event not found' };
      }
      
      return { event };
    } catch (error) {
      console.error('Error fetching event:', error);
      set.status = 500;
      return { error: 'Failed to fetch event' };
    }
  })
  
  // Query events
  .post('/query', async ({ body, set }: { body: any, set: any }) => {
    try {
      // Validate request body
      if (!body || typeof body !== 'object') {
        set.status = 400;
        return { error: 'Invalid request body' };
      }
      
      // Extract query and pagination parameters
      const { query = {}, limit = 100, skip = 0 } = body;
      
      // Get events matching query
      const events = await getEventsByQuery(query, limit, skip);
      return { events, count: events.length };
    } catch (error) {
      console.error('Error querying events:', error);
      set.status = 500;
      return { error: 'Failed to query events' };
    }
  })
  
  // // Create new event
  // .post('/', async ({ body, user, set }: { body: any, user: UserPayload, set: any }) => {
  //   try {
  //     // Validate request body
  //     if (!body || typeof body !== 'object' || !body.name) {
  //       set.status = 400;
  //       return { error: 'Invalid request body. Event must include a name' };
  //     }
      
  //     // Create event with required fields
  //     const result = await createEvent(body);
      
  //     if (result.acknowledged) {
  //       return { 
  //         success: true, 
  //         message: 'Event created successfully',
  //         eventId: result.eventId
  //       };
  //     } else {
  //       set.status = 500;
  //       return { error: 'Failed to create event' };
  //     }
  //   } catch (error) {
  //     console.error('Error creating event:', error);
  //     set.status = 500;
  //     return { error: 'Failed to create event' };
  //   }
  // })
  
  // // Update event
  // .put('/:id', async ({ params, body, set }: { params: { id: string }, body: any, set: any }) => {
  //   try {
  //     // Validate request body
  //     if (!body || typeof body !== 'object') {
  //       set.status = 400;
  //       return { error: 'Invalid request body' };
  //     }
      
  //     // Update event in database
  //     const result = await updateEvent(params.id, body);
      
  //     if (result.acknowledged && result.matchedCount > 0) {
  //       return { 
  //         success: true, 
  //         message: 'Event updated successfully',
  //         modifiedCount: result.modifiedCount
  //       };
  //     } else if (result.matchedCount === 0) {
  //       set.status = 404;
  //       return { error: 'Event not found' };
  //     } else {
  //       set.status = 500;
  //       return { error: 'Failed to update event' };
  //     }
  //   } catch (error) {
  //     console.error('Error updating event:', error);
  //     set.status = 500;
  //     return { error: 'Failed to update event', details: String(error) };
  //   }
  // })
  
  // Delete event
  .delete('/:id', async ({ params, set }: { params: { id: string }, set: any }) => {
    try {
      // Delete event from database
      const result = await deleteEvent(params.id);
      
      if (result.acknowledged && result.deletedCount > 0) {
        return { 
          success: true, 
          message: 'Event deleted successfully' 
        };
      } else if (result.deletedCount === 0) {
        set.status = 404;
        return { error: 'Event not found' };
      } else {
        set.status = 500;
        return { error: 'Failed to delete event' };
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      set.status = 500;
      return { error: 'Failed to delete event', details: String(error) };
    }
  })
  
  // Get upcoming events with pagination
  .get('/upcoming', async ({ query, set }: { query: any, set: any }) => {
    try {
      // Parse pagination parameters
      const limit = query.limit ? parseInt(query.limit) : 100;
      const skip = query.skip ? parseInt(query.skip) : 0;

      // Get upcoming events from the model
      const events = await getUpcomingEvents(limit, skip);
      return { events, count: events.length };
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      set.status = 500;
      return { error: 'Failed to fetch upcoming events' };
    }
  });
