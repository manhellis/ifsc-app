import axios from 'axios';
import { getFullResultsCollection } from './fullResults';
import { getEventByNumericId, updateEvent } from './events';
import { Event, Dcat } from '../../../shared/types/events';

// Base URL for IFSC API
const IFSC_API_BASE_URL = 'https://ifsc.results.info';

/**
 * Fetches and stores full results for an event
 * 
 * @param eventId Numeric event ID
 * @returns Promise resolving to an object with success status and count of fetched categories
 */
export async function fetchAndStoreFullResults(eventId: string): Promise<{ 
  success: boolean, 
  categoriesProcessed: number 
}> {
  try {
    const numericEventId = parseInt(eventId, 10);
    
    // Step 1: Check for existing event document
    const existingEvent = await getEventByNumericId(numericEventId);
    
    // Step 2 & 3: Check if any category is not finished
    if (existingEvent && Array.isArray(existingEvent.dcats)) {
      const hasUnfinishedCategories = existingEvent.dcats.some(
        (category: Dcat) => category.status !== "finished"
      );
      
      if (hasUnfinishedCategories) {
        // Fetch latest version of the event
        const updatedEventResponse = await axios.get(`${IFSC_API_BASE_URL}/api/v1/events/${eventId}/`, {
          headers: {
            'referer': 'https://ifsc.results.info/'
          }
        });
        
        if (updatedEventResponse.data) {
          // Update the event document
          await updateEvent(existingEvent._id, updatedEventResponse.data);
          
          // Log the replacement
          console.log(`[${new Date().toISOString()}] Updated event ${eventId} due to unfinished categories`);
        }
      }
    }
    
    // Step 4: Proceed with full results fetching (original logic)
    // Fetch event data from IFSC API
    const eventResponse = await axios.get(`${IFSC_API_BASE_URL}/api/v1/events/${eventId}/`, {
      headers: {
        'referer': 'https://ifsc.results.info/'
      }
    });
    const eventData = eventResponse.data;
    
    if (!eventData || !Array.isArray(eventData.d_cats)) {
      return { success: false, categoriesProcessed: 0 };
    }
    
    // Process each category that has full results
    let categoriesProcessed = 0;
    const collection = getFullResultsCollection();
    
    for (const category of eventData.d_cats) {
      // Skip categories without full results URL
      if (!category.full_results_url) continue;
      
      // Check if document already exists in database
      const existingDoc = await collection.findOne({ 
        id: parseInt(eventId, 10), 
        cid: category.dcat_id 
      });
      
      if (existingDoc) {
        // Document already exists, skip to next category
        categoriesProcessed++;
        continue;
      }
      
      // Build absolute URL and fetch category results
      const fullResultsUrl = `${IFSC_API_BASE_URL}${category.full_results_url}`;
      const resultsResponse = await axios.get(fullResultsUrl, {
        headers: {
          'referer': 'https://ifsc.results.info/'
        }
      });
      const resultsData = resultsResponse.data;
      
      if (!resultsData) continue;
      
      // Prepare document for insertion
      const resultDoc = {
        id: parseInt(eventId, 10),
        cid: category.dcat_id,
        ...resultsData
      };
      
      // Upsert into database
      await collection.updateOne(
        { id: resultDoc.id, cid: resultDoc.cid },
        { $set: resultDoc },
        { upsert: true }
      );
      
      categoriesProcessed++;
    }
    
    return { success: true, categoriesProcessed };
  } catch (error) {
    console.error('Error fetching and storing full results:', error);
    return { success: false, categoriesProcessed: 0 };
  }
} 