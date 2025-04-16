import { Elysia, Context } from 'elysia';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../db';
const db = getDb();
export const auth = betterAuth({
  database: mongodbAdapter(db),
  trustedOrigins: ['http://localhost:5173', 'http://localhost:4173'],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});




