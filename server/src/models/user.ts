import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { AccountType } from '@shared/types/userTypes';



export interface User {
  _id?: ObjectId;
  googleId?: string;
  email: string;
  name: string;
  picture?: string;
  accountType: AccountType;
  userData?: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION = 'users';

const getUserCollection = () => {
  return getDb().collection<User>(COLLECTION);
};

// Create a new user
export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  const user: Omit<User, '_id'> = {
    googleId: userData.googleId || '',
    email: userData.email,
    name: userData.name,
    picture: userData.picture,
    accountType: userData.accountType || AccountType.USER,
    userData: userData.userData,
    passwordHash: userData.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getUserCollection().insertOne(user as User);
  return { ...user, _id: result.insertedId };
}

// Retrieve a user by Google ID
export async function getUserByGoogleId(googleId: string) {
  return await getUserCollection().findOne({ googleId });
}

// Retrieve a user by email
export async function getUserByEmail(email: string) {
  return await getUserCollection().findOne({ email });
}

// Update a user's details
export async function updateUser(id: string, updateData: Partial<Omit<User, '_id' | 'createdAt'>>) {
  const result = await getUserCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updateData, updatedAt: new Date() } }
  );
  
  if (result.modifiedCount > 0) {
    return await getUserCollection().findOne({ _id: new ObjectId(id) });
  }
  return null;
}

// Get user data by user ID
export async function getUserDataById(userId: string) {
  const user = await getUserCollection().findOne(
    { _id: new ObjectId(userId) },
    { projection: { userData: 1 } }
  );
  return user?.userData || '';
}

// Update user data
export async function updateUserData(userId: string, userData: string) {
  const result = await getUserCollection().updateOne(
    { _id: new ObjectId(userId) },
    { $set: { userData, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}
