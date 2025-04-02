import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface Todo {
  _id?: ObjectId;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Collection name
const COLLECTION = 'todos';

// Get todos collection
const getTodosCollection = () => {
  return getDb().collection<Todo>(COLLECTION);
};

// Create a new todo
export async function createTodo(todoData: Omit<Todo, '_id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  const todo: Omit<Todo, '_id'> = {
    ...todoData,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await getTodosCollection().insertOne(todo as Todo);
  return { ...todo, _id: result.insertedId };
}

// Get all todos
export async function getAllTodos() {
  return await getTodosCollection().find().toArray();
}

// Get todo by ID
export async function getTodoById(id: string) {
  return await getTodosCollection().findOne({ _id: new ObjectId(id) });
}

// Update todo
export async function updateTodo(id: string, todoData: Partial<Omit<Todo, '_id' | 'createdAt'>>) {
  const result = await getTodosCollection().updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...todoData,
        updatedAt: new Date()
      } 
    }
  );
  return result.modifiedCount > 0;
}

// Delete todo
export async function deleteTodo(id: string) {
  const result = await getTodosCollection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
} 