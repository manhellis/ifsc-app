import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface UserData {
  _id?: ObjectId;
  userId: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION = 'userData';

const getUserDataCollection = () => {
  return getDb().collection<UserData>(COLLECTION);
};

// Get user data by user ID
export async function getUserDataById(userId: string) {
  const userData = await getUserDataCollection().findOne(
    { userId: userId }
  );
  return userData?.data || '';
}

// Update or create user data
export async function updateUserData(userId: string, data: string) {
  const now = new Date();
  
  const result = await getUserDataCollection().updateOne(
    { userId: userId },
    { 
      $set: { 
        data, 
        updatedAt: now 
      },
      $setOnInsert: { 
        createdAt: now 
      }
    },
    { upsert: true }
  );
  
  return result.acknowledged;
} 