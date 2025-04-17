import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";

import {
  createLeague,
  getLeagueById,
  queryLeagues,
  updateLeague,
  deleteLeague,
  requestToJoinLeague,
  getPendingRequests,
  approveJoinRequest,
  rejectJoinRequest,
  joinPrivateLeague,
  createInvitation,
  acceptInvitation,
  removeMember,
  leaveLeague,
  League,
  getLeagueBySlug,
} from "../models/leagues";

// Define types for the request bodies and context
type Context = {
  userId: string;
  league?: League;
};

export const leaguesRoutes = new Elysia()

  // Create a league
  .post(
    "/",
    async ({ body, set, context }: { 
      body: { name: string; description?: string; type: "public" | "private"; maxMembers?: number }; 
      set: { status: number }; 
      context: Context 
    }) => {
      console.log("Received create league request:", body, "Context:", context);
      const { name, description, type, maxMembers } = body;
      const userId = context.userId // || "000000000000000000000000";
      
      try {
        // First validate the name format here
        const trimmedName = name?.trim();
        if (!trimmedName) {
          set.status = 400;
          return { error: "League name is required", success: false };
        }
        
        if (!/^[a-zA-Z0-9 ]{3,30}$/.test(trimmedName)) {
          set.status = 400;
          return { error: "League name must be 3–30 characters long and contain only letters, numbers, and spaces", success: false };
        }
        
        // Check if maxMembers is valid
        if (maxMembers !== undefined && (maxMembers < 2 || maxMembers > 1000)) {
          set.status = 400;
          return { error: "Max members must be between 2 and 1000", success: false };
        }
        
        const res = await createLeague({
          name: trimmedName,
          description,
          type,
          ownerId: new ObjectId(userId),
          maxMembers,
        });
        
        if (res.acknowledged) {
          console.log(`[LEAGUE CREATED] id=${res.insertedId}, name="${name}", type=${type}, by user=${userId}`);
          const slug = trimmedName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "").slice(0, 30);
          return { leagueId: res.insertedId, slug, success: true };
        }
        
        set.status = 500;
        return { error: "Failed to create league", success: false };
      } catch (err) {
        console.error(`[LEAGUE CREATION ERROR] ${err instanceof Error ? err.message : 'Unknown error'}`);
        set.status = err instanceof Error && err.message.includes("name") ? 400 : 500;
        return { 
          error: err instanceof Error ? err.message : "Server error occurred", 
          success: false 
        };
      }
    }
  )

  // Get league
  .get(
    "/:id",
    ({ context }: { context: Context }) => {
      const { league } = context;
      // hide inviteCode if not admin
      if (league && league.adminIds.some((id: ObjectId) => id.equals(context.userId)))
        return { league };
      if (league) {
        const safeLeague = { ...league };
        delete safeLeague.inviteCode;
        return { league: safeLeague };
      }
      return { error: "League not found" };
    }
  )

  // Get league by slug
  .get(
    "/slug/:slug",
    async ({ params }: { params: { slug: string } }) => {
      const league = await getLeagueBySlug(params.slug);
      return { league };
    }
  )

  // Query leagues (moved to /query)
  .post(
    "/query",
    async ({ body }: { body: { query?: any; limit?: number; skip?: number; type?: "public" | "private" } }) => {
      const { query = {}, limit = 50, skip = 0, type } = body;
      if (type) {
        query.type = type;
      }
      const leagues = await queryLeagues(query, limit, skip);
      return { leagues, count: leagues.length };
    }
  )

  // Update league
  .put(
    "/:id",
    async ({ params, body, set, context }: { 
      params: { id: string }; 
      body: Partial<Pick<League, "name" | "description" | "type" | "maxMembers">>; 
      set: { status: number };
      context: Context
    }) => {
      const res = await updateLeague(params.id, body);
      if (res.matchedCount) {
        console.log(`[LEAGUE UPDATED] id=${params.id}, changes=${JSON.stringify(body)}, by user=${context.userId}`);
        return { success: true };
      }
      set.status = 404;
      return { error: "League not found or no changes" };
    }
  )

  // Delete league
  .delete(
    "/:id",
    async ({ params, set, context }: { params: { id: string }; set: { status: number }; context: Context }) => {
      const res = await deleteLeague(params.id);
      if (res.deletedCount) {
        console.log(`[LEAGUE DELETED] id=${params.id}, by user=${context.userId}`);
        return { success: true };
      }
      set.status = 404;
      return { error: "League not found" };
    }
  )

  //
  // --- Public join flow ---
  //

  // Request to join public league
  .post(
    "/:id/join-request",
    async ({ params, context, set }: { 
      params: { id: string }; 
      context: Context; 
      set: { status: number } 
    }) => {
      if (!context.league || context.league.type !== "public") {
        set.status = 400;
        return { error: "Not a public league" };
      }
      await requestToJoinLeague(params.id, context.userId);
      return { success: true };
    }
  )

  // List pending requests (admin only)
  .get(
    "/:id/pending-requests",
    async ({ params }: { params: { id: string } }) => {
      const pending = await getPendingRequests(params.id);
      return { pending };
    }
  )

  // Approve a join request
  .post(
    "/:id/approve/:userId",
    async ({ params }: { params: { id: string; userId: string } }) => {
      await approveJoinRequest(params.id, params.userId);
      return { success: true };
    }
  )

  // Reject a join request
  .post(
    "/:id/reject/:userId",
    async ({ params }: { params: { id: string; userId: string } }) => {
      await rejectJoinRequest(params.id, params.userId);
      return { success: true };
    }
  )

  //
  // --- Private join flow ---
  //

  // Join via invite code
  .post(
    "/:id/join-private",
    async ({ params, body, set, context }: { 
      params: { id: string }; 
      body: { inviteCode: string }; 
      set: { status: number }; 
      context: Context 
    }) => {
      if (!context.league || context.league.type !== "private") {
        set.status = 400;
        return { error: "Not a private league" };
      }
      const { inviteCode } = body;
      const res = await joinPrivateLeague(params.id, inviteCode, context.userId);
      if (res.matchedCount) return { success: true };
      set.status = 400;
      return { error: "Invalid invite code" };
    }
  )

  // Generate or return existing invite code (admin only)
  .post(
    "/:id/invite",
    ({ context, set }: { context: Context; set: { status: number } }) => {
      if (!context.league || !context.league.inviteCode) {
        set.status = 400;
        return { error: "League not found or no invite code available" };
      }
      return { inviteCode: context.league.inviteCode };
    }
  )

  // Direct invitation workflow
  .post(
    "/:id/invite-accept",
    async ({ body, set }: { body: { invitationId: string }; set: { status: number } }) => {
      const { invitationId } = body;
      try {
        await acceptInvitation(invitationId);
        return { success: true };
      } catch {
        set.status = 400;
        return { error: "Invalid invitation" };
      }
    }
  )

  // Create an invitation to a private league
  .post(
    "/:id/invite-user",
    async ({ params, body, context, set }: { params: { id: string }; body: { invitedUserId: string }; context: Context; set: { status: number } }) => {
      const { invitedUserId } = body;
      const res = await createInvitation({
        leagueId: params.id,
        invitedUserId,
        invitedBy: context.userId
      });
      if (res.acknowledged) {
        return { invitationId: res.insertedId };
      }
      set.status = 500;
      return { error: "Failed to create invitation" };
    }
  )

  //
  // --- Membership removal ---
  //

  // Remove a member (admin only)
  .post(
    "/:id/remove/:userId",
    async ({ params }: { params: { id: string; userId: string } }) => {
      await removeMember(params.id, params.userId);
      return { success: true };
    }
  )

  // Leave league (self)
  .post(
    "/:id/leave",
    async ({ params, context }: { params: { id: string }; context: Context }) => {
      await leaveLeague(params.id, context.userId);
      return { success: true };
    }
  );