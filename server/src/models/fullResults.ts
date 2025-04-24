import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { FullResult } from '../../../shared/types';

// Get fullResults collection
export const getFullResultsCollection = () => {
  return getDb("ifsc-data").collection<FullResult>('fullResults_2');
};

// Get full results for an event
export async function getFullResults(eventId: string): Promise<FullResult[]> {
  const numericId = parseInt(eventId, 10);
  if (isNaN(numericId)) {
    return [];
  }
  
  return await getFullResultsCollection().find({ id: numericId }).toArray();
}

// Create indices for efficient queries (run once during app initialization)
export const createFullResultsIndices = async () => {
  const collection = getFullResultsCollection();
  await collection.createIndex({ event: 1 });
  await collection.createIndex({ dcat: 1 });
  await collection.createIndex({ status: 1 });
};

// Get all fullResults with pagination
export async function getAllFullResults(limit = 100, skip = 0) {
  return await getFullResultsCollection().find({})
    .sort({ ranking_as_of: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Get fullResult by ID
export async function getFullResultById(id: number) {
//   if (!ObjectId.isValid(id)) {
//     return null;
//   }
  return await getFullResultsCollection().find({ id: id }).toArray();
}

// Get fullResults by event
export async function getFullResultsByEvent(eventName: string, limit = 100, skip = 0) {
  return await getFullResultsCollection().find({ event: eventName })
    .sort({ ranking_as_of: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Query fullResults with filters
export async function getFullResultsByQuery(query: any, limit = 100, skip = 0) {
  return await getFullResultsCollection().find(query)
    .sort({ ranking_as_of: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

// Create new fullResult
export async function createFullResult(fullResult: Omit<FullResult, '_id'>) {
  const newId = new ObjectId();
  const result = await getFullResultsCollection().insertOne({
    ...fullResult,
    _id: newId.toString()
  } as FullResult);
  
  return { 
    acknowledged: result.acknowledged,
    resultId: result.insertedId.toString()
  };
}

// Update fullResult
export async function updateFullResult(id: string, update: Partial<FullResult>) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, matchedCount: 0, modifiedCount: 0 };
  }
  
  const result = await getFullResultsCollection().updateOne(
    { _id: id },
    { $set: update }
  );
  
  return {
    acknowledged: result.acknowledged,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  };
}

// Delete fullResult
export async function deleteFullResult(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  
  const result = await getFullResultsCollection().deleteOne({ _id: id });
  
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount
  };
}

// Get fullResult by id and cid
export async function getFullResultByIdAndCid(id: number, cid: number) {
  return await getFullResultsCollection().findOne({ id: id, cid: cid });
} 