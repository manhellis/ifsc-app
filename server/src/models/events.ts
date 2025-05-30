import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { Event } from '../../../shared/types';

// Get events collection
const getEventsCollection = () => {
  return getDb().collection<Event>('events');
};

// Create indices for efficient queries (run once during app initialization)
export const createEventIndices = async () => {
  const collection = getEventsCollection();
  await collection.createIndex({ name: 1 });
  await collection.createIndex({ id: 1 }, { unique: true });
};

// Get all events with pagination
export async function getAllEvents(limit = 100, skip = 0) {
  return await getEventsCollection().find({})
    .sort({ starts_at: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Get event by ID
export async function getEventById(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return await getEventsCollection().findOne({ _id: id });
}

// Get event by numeric ID
export async function getEventByNumericId(id: number) {
  return await getEventsCollection().findOne({ id: id });
}

// Query events with filters
export async function getEventsByQuery(query: any, limit = 100, skip = 0) {
  // Create a new query object with the league_id filter
  const filteredQuery = {
    ...query,
    league_id: 1
  };
  
  return await getEventsCollection().find(filteredQuery)
    .sort({ starts_at: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Create new event
export async function createEvent(event: Omit<Event, '_id'>) {
  const newId = new ObjectId();
  const result = await getEventsCollection().insertOne({
    ...event,
    _id: newId.toString()
  } as Event);
  
  return { 
    acknowledged: result.acknowledged,
    eventId: result.insertedId.toString()
  };
}

// Update event
export async function updateEvent(id: string, update: Partial<Event>) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, matchedCount: 0, modifiedCount: 0 };
  }
  
  const result = await getEventsCollection().updateOne(
    { _id: id },
    { $set: update }
  );
  
  return {
    acknowledged: result.acknowledged,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  };
}

// Delete event
export async function deleteEvent(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  
  const result = await getEventsCollection().deleteOne({ _id: id });
  
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount
  };
}

// Get upcoming events (events with a start date in the future), sorted by start date ascending
export async function getUpcomingEvents(limit = 100, skip = 0) {
  return await getEventsCollection().find({
    // Filter for events where the start date is greater than or equal to yesterday
    starts_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    league_id: 1
  })
    .sort({ starts_at: 1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Get event name by ID
export async function fetchEventNameById(id: number) {
  const event = await getEventsCollection().findOne(
    { id: id },
    { projection: { name: 1, _id: 0 } }
  );
  return event ? event.name : null;
}