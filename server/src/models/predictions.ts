import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { Prediction } from '../../../shared/types';

// Get predictions collection
const getPredictionsCollection = () => {
  return getDb("ifsc-data").collection<Prediction>('predictions');
};

// Create indices for efficient queries (run once during app initialization)
export const createPredictionIndices = async () => {
  const collection = getPredictionsCollection();
  await collection.createIndex({ cid: 1 });
  await collection.createIndex({ athlete_id: 1 });
  await collection.createIndex({ event_date: 1 });
};

// Create new prediction
export async function createPrediction(prediction: Omit<Prediction, '_id'>) {
  const newId = new ObjectId();
  const result = await getPredictionsCollection().insertOne({
    ...prediction,
    _id: newId.toString()
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

// Update prediction only if event not finished
export async function updatePrediction(id: string, update: Partial<Prediction>) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, matchedCount: 0, modifiedCount: 0 };
  }

  // Retrieve the current prediction to check event status
  const currentPrediction = await getPredictionById(id);
  if (!currentPrediction) {
    throw new Error("Prediction not found.");
  }
  if (currentPrediction.event_finished) {
    throw new Error("Cannot update prediction; the event has already finished.");
  }

  const result = await getPredictionsCollection().updateOne(
    { _id: id },
    { $set: { ...update, updated_at: new Date().toISOString() } }
  );

  return {
    acknowledged: result.acknowledged,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  };
}

// Delete prediction only if event not finished
export async function deletePrediction(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }

  // Retrieve the current prediction to check event status
  const currentPrediction = await getPredictionById(id);
  if (!currentPrediction) {
    throw new Error("Prediction not found.");
  }
  if (currentPrediction.event_finished) {
    throw new Error("Cannot delete prediction; the event has already finished.");
  }

  const result = await getPredictionsCollection().deleteOne({ _id: id });
  
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount
  };
}

// Archive (mark as finished) a prediction once its event has passed
export async function archivePrediction(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, modifiedCount: 0 };
  }

  const result = await getPredictionsCollection().updateOne(
    { _id: id },
    { $set: { event_finished: true, updated_at: new Date().toISOString() } }
  );

  return {
    acknowledged: result.acknowledged,
    modifiedCount: result.modifiedCount
  };
}

// Query predictions with filters (for example, by athlete or event)
export async function getPredictionsByQuery(query: any, limit = 100, skip = 0) {
  return await getPredictionsCollection().find(query)
    .sort({ event_date: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}