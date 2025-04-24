import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { BasePrediction, PodiumPrediction } from '../../../shared/types/Prediction';

// Define a union type for all prediction types
type Prediction = PodiumPrediction; // Add other prediction types to the union as they are created

// Get predictions collection
const getPredictionsCollection = () => {
  return getDb("ifsc-data").collection<Prediction>('predictions');
};

// Create indices for efficient queries (run once during app initialization)
export const createPredictionIndices = async () => {
  const collection = getPredictionsCollection();
  await collection.createIndex({ leagueId: 1 });
  await collection.createIndex({ eventId: 1 });
  await collection.createIndex({ userId: 1 });
  await collection.createIndex({ type: 1 });
};

// Create new prediction
export async function createPrediction(prediction: Omit<Prediction, '_id'>) {
  const newId = new ObjectId();
  const result = await getPredictionsCollection().insertOne({
    ...prediction,
    _id: newId.toString(),
    event_finished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Prediction);

  return { 
    acknowledged: result.acknowledged,
    predictionId: result.insertedId.toString()
  };
}

// Get prediction by ID
export async function getPredictionById(id: string): Promise<Prediction | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return await getPredictionsCollection().findOne({ _id: id });
}

// Update prediction only if not locked
export async function updatePrediction(id: string, update: Partial<Prediction>) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, matchedCount: 0, modifiedCount: 0 };
  }

  // Retrieve the current prediction to check lock status
  const currentPrediction = await getPredictionById(id);
  if (!currentPrediction) {
    throw new Error("Prediction not found.");
  }
  if (currentPrediction.locked) {
    throw new Error("Cannot update prediction; it is locked.");
  }

  const result = await getPredictionsCollection().updateOne(
    { _id: id },
    { $set: { ...update, updatedAt: new Date().toISOString() } }
  );

  return {
    acknowledged: result.acknowledged,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  };
}

// Delete prediction only if not locked
export async function deletePrediction(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }

  // Retrieve the current prediction to check lock status
  const currentPrediction = await getPredictionById(id);
  if (!currentPrediction) {
    throw new Error("Prediction not found.");
  }
  if (currentPrediction.locked) {
    throw new Error("Cannot delete prediction; it is locked.");
  }

  const result = await getPredictionsCollection().deleteOne({ _id: id });
  
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount
  };
}

// Lock a prediction
export async function lockPrediction(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, modifiedCount: 0 };
  }

  const result = await getPredictionsCollection().updateOne(
    { _id: id },
    { $set: { locked: true, updatedAt: new Date().toISOString() } }
  );

  return {
    acknowledged: result.acknowledged,
    modifiedCount: result.modifiedCount
  };
}

// Query predictions with filters (for example, by league, event, or user)
export async function getPredictionsByQuery(query: any, limit = 100, skip = 0) {
  return await getPredictionsCollection().find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}