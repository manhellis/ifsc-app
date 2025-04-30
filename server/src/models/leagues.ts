// server/src/models/leagues.ts
import { ObjectId } from "mongodb";
import { getDb } from "../db";

const leaguesCol = getDb().collection<League>("leagues");
const invitesCol = getDb().collection<LeagueInvitation>("leagueInvitations");

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
  inviteCode: string;
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
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
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
  updates: Partial<Pick<League, "name" | "description" | "type" | "maxMembers" | "slug" | "inviteCode">>
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

/**
 * Find a league by its invite code
 */
export async function getLeagueByInviteCode(inviteCode: string) {
  return leaguesCol.findOne({ inviteCode });
}

/**
 * Check if an invite code is valid and return the associated league
 */
export async function validateInviteCode(inviteCode: string) {
  const league = await getLeagueByInviteCode(inviteCode);
  return {
    valid: !!league,
    league: league || null
  };
}

/**
 * Check if an invite code is already in use by another league
 * @param inviteCode - The invite code to check
 * @param excludeLeagueId - Optional league ID to exclude from the check (useful when regenerating codes)
 * @returns boolean - True if the code is already in use
 */
export async function isInviteCodeInUse(inviteCode: string, excludeLeagueId?: string) {
  const query: any = { inviteCode };
  
  // If we're regenerating a code for a specific league, we should exclude that league from the check
  if (excludeLeagueId) {
    query._id = { $ne: new ObjectId(excludeLeagueId) };
  }
  
  const existingLeague = await leaguesCol.findOne(query, { projection: { _id: 1 } });
  return !!existingLeague;
}

/**
 * Generate a unique invite code that isn't already in use
 * @param length - Length of the code (default: 6)
 * @param excludeLeagueId - Optional league ID to exclude from uniqueness checks
 */
export async function generateUniqueInviteCode(length: number = 6, excludeLeagueId?: string): Promise<string> {
  // Try up to 10 times to generate a unique code
  for (let attempts = 0; attempts < 10; attempts++) {
    const code = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    const inUse = await isInviteCodeInUse(code, excludeLeagueId);
    
    if (!inUse) {
      return code;
    }
  }
  
  // If we failed to generate a unique code after 10 attempts, add a timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 2 + (length - 4)).toUpperCase();
  return randomPart + timestamp;
}

/**
 * Join a league using an invite code
 * @param inviteCode - The invite code for the league
 * @param userId - The ID of the user joining
 * @returns Object with success status and league info (if successful)
 */
export async function joinLeagueByInviteCode(inviteCode: string, userId: string): Promise<{
  success: boolean;
  leagueId?: string;
  error?: string;
}> {
  try {
    // First verify the invite code is valid
    const { valid, league } = await validateInviteCode(inviteCode);
    
    if (!valid || !league) {
      return { success: false, error: "Invalid invite code" };
    }
    
    // Check if user is already a member
    const userObjectId = new ObjectId(userId);
    if (league.memberIds.some(id => id.equals(userObjectId))) {
      return { success: false, error: "You are already a member of this league" };
    }
    
    // Add the user to the league
    const result = await leaguesCol.updateOne(
      { _id: league._id },
      { 
        $addToSet: { memberIds: userObjectId },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (result.modifiedCount === 0) {
      return { success: false, error: "Failed to join league" };
    }
    
    return { 
      success: true, 
      leagueId: league._id.toString() 
    };
  } catch (error) {
    console.error("Error joining league by invite code:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}