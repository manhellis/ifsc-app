import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface IFSCDocument {
  _id?: ObjectId;
  title: string;
  content: any; // Using 'any' type to allow for different document structures
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION = 'events';

const getIFSCDataCollection = () => {
    const db = getDb()
  return db.collection<IFSCDocument>(COLLECTION);
};

// Get all IFSC documents
export async function getAllIFSCDocuments(limit = 100, skip = 0) {
  const documents = await getIFSCDataCollection()
    .find({})
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  
  return documents;
}

// Get IFSC document by ID
export async function getIFSCDocumentById(id: string) {
  try {
    const objectId = new ObjectId(id);
    return await getIFSCDataCollection().findOne({ _id: objectId });
  } catch (error) {
    console.error('Invalid ID format or document not found:', error);
    return null;
  }
}

// Get IFSC documents by query
export async function getIFSCDocumentsByQuery(query: any, limit = 100, skip = 0) {
  const documents = await getIFSCDataCollection()
    .find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  
  return documents;
}

// Create new IFSC document
export async function createIFSCDocument(document: Omit<IFSCDocument, '_id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  
  const newDocument = {
    ...document,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await getIFSCDataCollection().insertOne(newDocument as IFSCDocument);
  
  return {
    acknowledged: result.acknowledged,
    documentId: result.insertedId
  };
}

// Update IFSC document
export async function updateIFSCDocument(id: string, update: Partial<Omit<IFSCDocument, '_id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const objectId = new ObjectId(id);
    const now = new Date();
    
    const result = await getIFSCDataCollection().updateOne(
      { _id: objectId },
      { 
        $set: { 
          ...update,
          updatedAt: now 
        }
      }
    );
    
    return {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    console.error('Error updating IFSC document:', error);
    return {
      acknowledged: false,
      matchedCount: 0,
      modifiedCount: 0,
      error: String(error)
    };
  }
}

// Delete IFSC document
export async function deleteIFSCDocument(id: string) {
  try {
    const objectId = new ObjectId(id);
    const result = await getIFSCDataCollection().deleteOne({ _id: objectId });
    
    return {
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error('Error deleting IFSC document:', error);
    return {
      acknowledged: false,
      deletedCount: 0,
      error: String(error)
    };
  }
} 