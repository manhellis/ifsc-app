// server/src/models/leagues.ts
import { ObjectId } from "mongodb";
import { getDb } from "../db";

const leaguesCol = getDb("ifsc-data").collection<League>("leagues");
const invitesCol = getDb("ifsc-data").collection<LeagueInvitation>("leagueInvitations");

export interface League {
  _id: ObjectId;
  name: string;
  /**
   * A URL-friendly human-readable identifier generated from the league name,
   * lowercase, no spaces, max 30 chars, alphanumeric only.
   */
  slug: string;
  description?: string;
  type: "public" | "private";
  ownerId: ObjectId;
  adminIds: ObjectId[];
  memberIds: ObjectId[];
  pendingRequestIds: ObjectId[];
  inviteCode?: string;
  maxMembers?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueInvitation {
  _id: ObjectId;
  leagueId: ObjectId;
  invitedUserId: ObjectId;
  invitedBy: ObjectId;
  accepted: boolean;
  createdAt: Date;
  acceptedAt?: Date;
}

// Create a new league
export async function createLeague(data: {
  name: string;
  description?: string;
  type: "public" | "private";
  ownerId: ObjectId;
  maxMembers?: number;
}) {
  // Validate and generate slug
  const name = data.name.trim();
  if (!/^[a-zA-Z0-9 ]{3,30}$/.test(name)) {
    throw new Error(
      "League name must be 3–30 characters long and contain only letters, numbers, and spaces."
    );
  }
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30);

  const now = new Date();
  const league: Omit<League, "_id"> = {
    ...data,
    slug,
    adminIds: [data.ownerId],
    memberIds: [data.ownerId],
    pendingRequestIds: [],
    inviteCode: data.type === "private"
      ? Math.random().toString(36).substring(2, 8).toUpperCase()
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
  const res = await leaguesCol.insertOne(league as any);
  return res;
}

export async function getLeagueById(id: string) {
  return leaguesCol.findOne({ _id: new ObjectId(id) });
}

/**
 * Find a league by its slug
 */
export async function getLeagueBySlug(slug: string) {
  return leaguesCol.findOne({ slug });
}

export async function queryLeagues(
  query: Partial<League>,
  limit = 50,
  skip = 0
) {
  return leaguesCol.find(query).limit(limit).skip(skip).toArray();
}

export async function updateLeague(
  id: string,
  updates: Partial<Pick<League, "name" | "description" | "type" | "maxMembers">>
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}

export async function deleteLeague(id: string) {
  return leaguesCol.deleteOne({ _id: new ObjectId(id) });
}

// Public: request to join
export async function requestToJoinLeague(
  leagueId: string,
  userId: string
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(leagueId), memberIds: { $ne: new ObjectId(userId) } },
    { $addToSet: { pendingRequestIds: new ObjectId(userId) }, $set: { updatedAt: new Date() } }
  );
}

export async function getPendingRequests(leagueId: string) {
  const league = await getLeagueById(leagueId);
  return league?.pendingRequestIds || [];
}

export async function approveJoinRequest(
  leagueId: string,
  userId: string
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(leagueId) },
    {
      $pull: { pendingRequestIds: new ObjectId(userId) },
      $addToSet: { memberIds: new ObjectId(userId) },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function rejectJoinRequest(
  leagueId: string,
  userId: string
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(leagueId) },
    {
      $pull: { pendingRequestIds: new ObjectId(userId) },
      $set: { updatedAt: new Date() },
    }
  );
}

// Cancel a pending join request (by the user who requested)
export async function cancelJoinRequest(
  leagueId: string,
  userId: string
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(leagueId), pendingRequestIds: new ObjectId(userId) }, // Ensure user is actually pending
    {
      $pull: { pendingRequestIds: new ObjectId(userId) },
      $set: { updatedAt: new Date() },
    }
  );
}

// Find all leagues where a user has a pending request
export async function getUserPendingRequests(userId: string) {
  return leaguesCol
    .find(
      { pendingRequestIds: new ObjectId(userId) },
      { projection: { _id: 1 } } // Only return the league IDs
    )
    .toArray();
}

// Private: join via code
export async function joinPrivateLeague(
  leagueId: string,
  code: string,
  userId: string
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(leagueId), inviteCode: code },
    {
      $addToSet: { memberIds: new ObjectId(userId) },
      $set: { updatedAt: new Date() },
    }
  );
}

// Invite a user directly
export async function createInvitation(data: {
  leagueId: string;
  invitedUserId: string;
  invitedBy: string;
}) {
  const invite: Omit<LeagueInvitation, "_id"> = {
    leagueId: new ObjectId(data.leagueId),
    invitedUserId: new ObjectId(data.invitedUserId),
    invitedBy: new ObjectId(data.invitedBy),
    accepted: false,
    createdAt: new Date(),
  };
  return invitesCol.insertOne(invite as any);
}

export async function acceptInvitation(inviteId: string) {
  const inv = await invitesCol.findOne({ _id: new ObjectId(inviteId) });
  if (!inv) throw new Error("Invitation not found");
  await invitesCol.updateOne(
    { _id: inv._id },
    { $set: { accepted: true, acceptedAt: new Date() } }
  );
  return leaguesCol.updateOne(
    { _id: inv.leagueId },
    {
      $addToSet: { memberIds: inv.invitedUserId },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function removeMember(
  leagueId: string,
  userId: string
) {
  return leaguesCol.updateOne(
    { _id: new ObjectId(leagueId) },
    {
      $pull: { memberIds: new ObjectId(userId) },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function leaveLeague(
  leagueId: string,
  userId: string
) {
  return removeMember(leagueId, userId);
}

/**
 * Get all leagues where a user is a member, admin, or owner
 */
export async function getUserLeagues(userId: string) {
  const objectId = new ObjectId(userId);
  return leaguesCol.find({
    $or: [
      { memberIds: objectId },
      { adminIds: objectId },
      { ownerId: objectId }
    ]
  }).toArray();
}

/**
 * Check if a user is a member of a specific league
 */
export async function isUserInLeague(userId: string, leagueId: string): Promise<boolean> {
  const objectId = new ObjectId(userId);
  const leagueObjectId = new ObjectId(leagueId);
  
  const league = await leaguesCol.findOne(
    { 
      _id: leagueObjectId,
      memberIds: objectId 
    },
    { projection: { _id: 1 } } // Only need to know if it exists
  );
  
  return !!league; // Return true if league exists and user is a member
}