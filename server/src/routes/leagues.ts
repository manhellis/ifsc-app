import { Elysia, t, type Context as ElysiaContext } from "elysia";
import { ObjectId, WithId } from "mongodb";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";

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
    cancelJoinRequest,
    getUserPendingRequests,
    getUserLeagues,
    generateUniqueInviteCode,
} from "../models/leagues";
import { getUsersByIds } from "../models/user";
import { getStandingsByLeagueId } from "../models/standings";
import { ensureAuth, JWTPayload } from "src/services/auth";

// Define a type for the context decorated by ensureAuth
type AuthContext = ElysiaContext & {
    user: JWTPayload | null; // ensureAuth adds user, might be null if optional
    store: {};
    params: any; // Generic params for broader use before specific route parsing
    set: ElysiaContext["set"];
};

// Define a type for the context expected by handlers within the /:id group
type LeagueRouteContext = AuthContext & {
    params: { id: string };
    user: JWTPayload; // We'll ensure user is not null in middleware where needed
};

// Define a context type for after loadLeague middleware has run
type ContextWithLoadedLeague = AuthContext & {
    params: { id: string };
    store: { // Specify the store contents
        league: WithId<League>;
        user: JWTPayload;
    };
};

// Context after league has been loaded
// DEPRECATED: Use ContextWithLoadedLeague or specific admin/owner types
// type ContextWithLeague = LeagueRouteContext & {
//    league: WithId<League>;
// };

// Context after league loaded and admin check passed
// TODO: Update these if they rely on direct context properties vs store
type AdminContextWithLeague = ContextWithLoadedLeague;

// Context after league loaded and owner check passed
// TODO: Update these if they rely on direct context properties vs store
type OwnerContextWithLeague = ContextWithLoadedLeague;

// Middleware to load league and check admin permissions
// TODO: Update this to use store if needed, or ensure it works with ContextWithLoadedLeague
const loadLeagueAndCheckAdmin = async (ctx: ContextWithLoadedLeague) => {
    const { league, user } = ctx.store; // Read from store
    const isAdmin =
        league.ownerId.equals(user.userId) ||
        league.adminIds?.some((adminId: ObjectId) => adminId.equals(user.userId));

    if (!isAdmin) {
        ctx.set.status = 403;
        throw new Error("User is not an admin of this league");
    }
    // No need to return, data is already in store
    // return { league, user }; // Return validated context
};

// Middleware to load league (no admin check)
const loadLeague = async (ctx: AuthContext & { params: { id: string }}) => {
    const { params, set, user, store } = ctx; // Add store here
    if (!user) { // Guard against null user
        set.status = 401;
        throw new Error("Authentication required.");
    }
    const league = await getLeagueById(params.id);
    if (!league) {
        set.status = 404;
        throw new Error("League not found");
    }
    // Add league and user to the store instead of returning
    store.league = league;
    store.user = user; // Keep user in store for consistency if needed later

    // Return void/undefined to allow handler processing
};

// Middleware to load league and check owner permission
// TODO: Update this to use store if needed, or ensure it works with ContextWithLoadedLeague
const loadLeagueAndCheckOwner = async (ctx: ContextWithLoadedLeague) => {
    const { league, user } = ctx.store; // Read from store

    if (!league.ownerId.equals(user.userId)) {
        ctx.set.status = 403;
        throw new Error("Only the league owner can perform this action.");
    }
    // No need to return
    // return { league, user };
};

export const leaguesRoutes = new Elysia({ prefix: "/leagues" })
    .use(ensureAuth()) // Applies to all subsequent routes
    // Create a league
    .post(
        "/",
        async ({
            body,
            set,
            user, // Direct access, ensureAuth provides JWTPayload | null
        }: AuthContext & { // Use AuthContext which allows null user initially
            body: {
                name: string;
                description?: string;
                type: "public" | "private";
                maxMembers?: number;
            };
        }) => {
            if (!user) { // Explicitly check for user
                set.status = 401;
                return { error: "Authentication required", success: false };
            }
            // User is confirmed non-null here
            console.log(
                "Received create league request:",
                body,
                "User:",
                user.userId
            );
            const { name, description, type, maxMembers } = body;
            const userId = user.userId;

            try {
                const trimmedName = name?.trim();
                if (!trimmedName) {
                    set.status = 400;
                    return { error: "League name is required", success: false };
                }

                if (!/^[a-zA-Z0-9 ]{3,30}$/.test(trimmedName)) {
                    set.status = 400;
                    return {
                        error: "League name must be 3–30 characters long and contain only letters, numbers, and spaces",
                        success: false,
                    };
                }

                // Check if maxMembers is valid
                if (
                    maxMembers !== undefined &&
                    (maxMembers < 2 || maxMembers > 1000)
                ) {
                    set.status = 400;
                    return {
                        error: "Max members must be between 2 and 1000",
                        success: false,
                    };
                }

                // Generate the slug
                const slug = trimmedName
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .replace(/[^a-z0-9]/g, "")
                    .slice(0, 30);
                
                // Check if slug already exists
                const existingLeague = await getLeagueBySlug(slug);
                if (existingLeague) {
                    set.status = 409; // Conflict
                    return { 
                        error: "A league with a similar name already exists. Please choose a different name.", 
                        success: false 
                    };
                }

                const res = await createLeague({
                    name: trimmedName,
                    description,
                    type,
                    ownerId: new ObjectId(userId),
                    maxMembers,
                });

                if (res.acknowledged) {
                    console.log(
                        `[LEAGUE CREATED] id=${res.insertedId}, name="${name}", type=${type}, by user=${userId}`
                    );
                    return { leagueId: res.insertedId, slug, success: true };
                }

                set.status = 500;
                return { error: "Failed to create league", success: false };
            } catch (err) {
                console.error(
                    `[LEAGUE CREATION ERROR] ${
                        err instanceof Error ? err.message : "Unknown error"
                    }`
                );
                set.status =
                    err instanceof Error && err.message.includes("name")
                        ? 400
                        : 500;
                return {
                    error:
                        err instanceof Error
                            ? err.message
                            : "Server error occurred",
                    success: false,
                };
            }
        }
    )

    // Routes under /:id require league ID and often authentication
    .group("/:id", (app) =>
        app
            // Get league details
            .get("/", ({ store }: ContextWithLoadedLeague) => { // Use ContextWithLoadedLeague
                const { league, user } = store; // Directly access typed store

                const isAdmin =
                    league.ownerId.equals(user.userId) ||
                    league.adminIds?.some((adminId: ObjectId) =>
                        adminId.equals(user.userId)
                    );

                if (isAdmin) return { league };

                // Non-admin view
                const safeLeague = { ...league };
                delete safeLeague.inviteCode;
                return { league: safeLeague };
            }, {
                 beforeHandle: [loadLeague] // Populates store
            })

            // Update league (Admin Only)
            .put(
                "/",
                async ({
                    params,
                    body,
                    set,
                    store, // Use store from ContextWithLoadedLeague
                }: AdminContextWithLeague & { body: Partial<Pick<League, "name" | "description" | "type" | "maxMembers">> }) => {
                    const { user } = store; // Get user from store
                    const res = await updateLeague(params.id, body);
                    if (res.matchedCount) {
                        console.log(
                            `[LEAGUE UPDATED] id=${
                                params.id
                            }, changes=${JSON.stringify(body)}, by user=${
                                user.userId // Use user from store
                            }`
                        );
                        return { success: true };
                    }
                    set.status = 404; // Should not happen if middleware worked
                    return { error: "League not found or no changes" };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin], // Chain middleware
                }
            )

            // Delete league (Owner Only)
            .delete(
                "/",
                async ({
                    params,
                    set,
                    store, // Use store from ContextWithLoadedLeague
                }: OwnerContextWithLeague) => {
                    const { user } = store; // Get user from store
                    const res = await deleteLeague(params.id);
                    if (res.deletedCount) {
                        console.log(
                            `[LEAGUE DELETED] id=${params.id}, by user=${user.userId}` // Use user from store
                        );
                        return { success: true };
                    }
                    set.status = 404; // Should not happen if middleware worked
                    return { error: "League not found" };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckOwner], // Chain middleware
                }
            )

            // Request to join public league
            .post(
                "/join-request",
                async ({
                    params,
                    store, // Use store from ContextWithLoadedLeague
                    set,
                }: ContextWithLoadedLeague) => {
                    const { league, user } = store; // Directly access typed store

                    console.log(`[JOIN REQ START] User ${user.userId} attempting to join league ${params.id}`);

                    // 1. Check if league is public
                    if (league.type !== "public") {
                        console.log(`[JOIN REQ REJECT] League ${params.id} is not public.`);
                        set.status = 400;
                        return { success: false, error: "League is not public." };
                    }

                    // 2. Check if user is already a member
                    if (league.memberIds?.some(id => id.equals(user.userId))) {
                        console.log(`[JOIN REQ REJECT] User ${user.userId} is already a member of league ${params.id}.`);
                        set.status = 409; // Conflict
                        return { success: false, error: "You are already a member of this league." };
                    }

                    // 3. Check if user already has a pending request
                    if (league.pendingRequestIds?.some(id => id.equals(user.userId))) {
                        console.log(`[JOIN REQ REJECT] User ${user.userId} already has a pending request for league ${params.id}.`);
                        set.status = 409; // Conflict
                        return { success: false, error: "You already have a pending request for this league." };
                    }

                    // 4. For public leagues, automatically approve the request
                    if (league.type === "public") {
                        console.log(`[JOIN REQ AUTO-APPROVE] Public league ${params.id}: auto-approving user ${user.userId}`);
                        const result = await approveJoinRequest(params.id, user.userId);
                        if (result.modifiedCount === 1) {
                            console.log(`[JOIN REQ SUCCESS] User ${user.userId} auto-joined public league ${params.id}`);
                            return { success: true, autoApproved: true };
                        } else {
                            console.error(`[JOIN REQ FAILED] Auto-approval failed for user ${user.userId}, League ${params.id}`);
                            set.status = 500;
                            return { success: false, error: "Failed to join league. Please try again." };
                        }
                    }

                    // 5. Attempt to add the request (this code is now unreachable since we check for public leagues above)
                    console.log(`[JOIN REQ DB CALL] Calling requestToJoinLeague for user ${user.userId} and league ${params.id}`);
                    const result = await requestToJoinLeague(params.id, user.userId);
                    console.log(`[JOIN REQ DB RESULT] DB Result for user ${user.userId}, League ${params.id}:`, result);

                    // 6. Check if the database was actually updated
                    if (result.modifiedCount === 1) {
                        console.log(`[JOIN REQ SUCCESS] User ${user.userId} requested to join league ${params.id}`);
                        return { success: true };
                    } else {
                        // This could happen if the model's pre-condition failed unexpectedly or another race condition
                        console.error(`[JOIN REQ FAILED] User ${user.userId}, League ${params.id}. DB Result:`, result);
                        set.status = 500; // Or 400 if we suspect client error?
                        return { success: false, error: "Failed to send join request. Please try again." };
                    }
                },
                {
                    beforeHandle: [loadLeague], // Populates store
                }
            )

            // List pending requests (admin only)
            .get(
                "/pending-requests",
                async ({
                    params,
                    store, // Use store from ContextWithLoadedLeague
                }: AdminContextWithLeague) => {
                    // const { league } = store; // league not actually needed here
                    const pending = await getPendingRequests(params.id);
                    return { pending };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Approve a join request (admin only)
            .post(
                "/approve/:userId",
                async ({
                    params, // Includes id and userId
                    store, // Use store
                }: AdminContextWithLeague & { params: { id: string; userId: string } }) => {
                    // const { league, user } = store; // Not needed directly
                    await approveJoinRequest(params.id, params.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Reject a join request (admin only)
            .post(
                "/reject/:userId",
                async ({
                    params, // Includes id and userId
                    store, // Use store
                }: AdminContextWithLeague & { params: { id: string; userId: string } }) => {
                    // const { league, user } = store; // Not needed directly
                    await rejectJoinRequest(params.id, params.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Cancel a pending join request (by the user themselves)
            .post(
                "/cancel-join-request",
                async ({
                    params,
                    store, // Use store
                    set,
                }: ContextWithLoadedLeague) => { // Use ContextWithLoadedLeague
                    const { user } = store; // Directly access typed store

                    // Call the model function to remove the user from pending requests
                    const res = await cancelJoinRequest(params.id, user.userId);

                    if (res.modifiedCount === 0) {
                         console.warn(`[CANCEL JOIN REQ WARN] User ${user.userId} tried to cancel for league ${params.id}, but no request was found or modified.`);
                         return { success: false, message: "No pending request found to cancel." };
                    }

                    console.log(`[CANCEL JOIN REQ] User ${user.userId} cancelled request for league ${params.id}`);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague], // Populates store
                }
            )

            // Join via invite code
            .post(
                "/join-private",
                async ({
                    params,
                    body,
                    set,
                    store, // Use store
                }: ContextWithLoadedLeague & { body: { inviteCode: string } }) => {
                    const { league, user } = store; // Directly access typed store

                    if (league.type !== "private") {
                        set.status = 400;
                        return { error: "Not a private league" };
                    }
                    const { inviteCode } = body;
                    const res = await joinPrivateLeague(
                        params.id,
                        inviteCode,
                        user.userId
                    );
                    if (res.matchedCount) return { success: true };
                    set.status = 400;
                    return { error: "Invalid invite code" };
                },
                {
                    beforeHandle: [loadLeague], // Populates store
                }
            )

            // Generate or return existing invite code (admin only)
            .post(
                "/invite",
                ({
                    store, // Use store
                    set,
                }: AdminContextWithLeague) => {
                    const { league } = store; // Directly access typed store
                    if (!league.inviteCode) {
                        console.warn(`League ${league._id} accessed /invite but has no invite code.`);
                        set.status = 404;
                        return {
                            error: "Invite code not available for this league",
                        };
                    }
                    return { inviteCode: league.inviteCode };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Regenerate invite code (admin only)
            .post(
                "/regenerate-invite",
                async ({
                    params,
                    set,
                    store,
                }: AdminContextWithLeague) => {
                    try {
                        // Use the new function to generate a guaranteed unique invite code
                        const newInviteCode = await generateUniqueInviteCode(6, params.id);
                        const result = await updateLeague(params.id, { inviteCode: newInviteCode });
                        
                        if (result.matchedCount) {
                            console.log(`[INVITE CODE REGENERATED] League ${params.id} by admin ${store.user.userId}`);
                            return { success: true, inviteCode: newInviteCode };
                        }
                        
                        set.status = 404;
                        return { success: false, error: "Failed to update invite code" };
                    } catch (error) {
                        console.error(`[INVITE CODE REGENERATION ERROR] League ${params.id}:`, error);
                        set.status = 500;
                        return { success: false, error: "Server error while regenerating invite code" };
                    }
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Create an invitation to a private league (admin only)
            .post(
                "/invite-user",
                async ({
                    params,
                    body,
                    store, // Use store
                    set,
                }: AdminContextWithLeague & { body: { invitedUserId: string } }) => {
                    const { user } = store; // Directly access typed store
                    const { invitedUserId } = body;
                    const res = await createInvitation({
                        leagueId: params.id,
                        invitedUserId,
                        invitedBy: user.userId,
                    });
                    if (res.acknowledged) {
                        return { invitationId: res.insertedId };
                    }
                    set.status = 500;
                    return { error: "Failed to create invitation" };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Remove a member (admin only)
            .post(
                "/remove/:userId",
                async ({
                    params, // Includes id and userId to remove
                    set,
                    store, // Use store
                }: AdminContextWithLeague & { params: { id: string; userId: string } }) => {
                    const { league, user } = store; // Directly access typed store
                    const userIdToRemove = params.userId;
                    const adminUserId = user.userId;

                    if (league.ownerId.toHexString() === userIdToRemove) {
                         set.status = 403;
                         return { error: "Cannot remove the league owner." };
                    }

                    if (adminUserId === userIdToRemove) {
                         set.status = 400;
                         return { error: "Admins cannot remove themselves using this endpoint. Use 'leave league'." };
                    }

                    await removeMember(params.id, userIdToRemove);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )

            // Leave league (self)
            .post(
                "/leave",
                async ({
                    params,
                    store, // Use store
                    set,
                }: ContextWithLoadedLeague) => {
                    const { league, user } = store; // Directly access typed store

                    if (league.ownerId.equals(user.userId)) {
                        set.status = 400;
                        return {
                            error: "Owner cannot leave the league via this endpoint. Transfer ownership or delete the league.",
                        };
                    }
                    await leaveLeague(params.id, user.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague], // Populates store
                }
            )

            // Get league leaderboard
            .get(
                "/leaderboard",
                async ({
                    params,
                    query,
                    set,
                }: ElysiaContext & { params: { id: string }, query: { limit?: string, offset?: string } }) => {
                    const leagueId = params.id;
                    const limit = query.limit ? parseInt(query.limit) : 100;
                    const offset = query.offset ? parseInt(query.offset) : 0;
                    
                    try {
                        // 1. Fetch standings for this league, sorted by points
                        const standings = await getStandingsByLeagueId(leagueId, { limit, offset });
                        
                        // Handle case when standings is an array (normal result)
                        if (Array.isArray(standings)) {
                            if (standings.length === 0) {
                                return { 
                                    rankings: [],
                                    total: 0
                                };
                            }
                            
                            // 2. Extract user IDs and fetch user profiles
                            const userIds = standings.map(s => s.userId);
                            const users = await getUsersByIds(userIds);
                            
                            // 3. Create a user lookup map
                            const userMap = new Map();
                            users.forEach(user => {
                                userMap.set(user._id.toString(), {
                                    userName: user.name || 'Anonymous',
                                    avatarUrl: user.picture
                                });
                            });
                            
                            // 4. Build rankings with enriched user data
                            const rankings = standings.map((standing, index) => {
                                const userInfo = userMap.get(standing.userId.toString()) || {
                                    userName: 'Unknown User',
                                    avatarUrl: null
                                };
                                
                                return {
                                    rank: offset + index + 1,
                                    userId: standing.userId.toString(),
                                    userName: userInfo.userName,
                                    avatarUrl: userInfo.avatarUrl,
                                    totalPoints: standing.totalPoints,
                                    eventResults: standing.eventHistory || []
                                };
                            });
                            
                            // Get total count
                            const total = await getStandingsByLeagueId(leagueId, { countOnly: true });
                            const totalCount = typeof total === 'number' ? total : 0;
                            
                            return {
                                rankings,
                                total: totalCount
                            };
                        } else {
                            // Handle case when standings is a number (count result)
                            return {
                                rankings: [],
                                total: 0
                            };
                        }
                    } catch (err) {
                        console.error(`[LEADERBOARD ERROR] LeagueId ${leagueId}:`, err);
                        set.status = 500;
                        return { error: "Failed to fetch leaderboard data" };
                    }
                }
            )

            // Update league slug (Admin Only)
            .post(
                "/update-slug",
                async ({
                    params,
                    body,
                    set,
                    store,
                }: AdminContextWithLeague & { body: { name: string } }) => {
                    const { user } = store;
                    const { name } = body;
                    
                    if (!name || !name.trim()) {
                        set.status = 400;
                        return { error: "Name is required to generate slug", success: false };
                    }
                    
                    try {
                        // Generate the new slug from the name
                        const newSlug = name
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            .replace(/[^a-z0-9]/g, "")
                            .slice(0, 30);
                            
                        // Check if slug already exists for another league
                        const existingLeague = await getLeagueBySlug(newSlug);
                        if (existingLeague && !existingLeague._id.equals(new ObjectId(params.id))) {
                            set.status = 409; // Conflict
                            return { 
                                success: false,
                                error: "A league with a similar name already exists. Please choose a different name."
                            };
                        }
                        
                        const res = await updateLeague(params.id, { slug: newSlug });
                        
                        if (res.matchedCount) {
                            console.log(
                                `[LEAGUE SLUG UPDATED] id=${params.id}, new slug="${newSlug}", by user=${user.userId}`
                            );
                            return { success: true, slug: newSlug };
                        }
                        
                        set.status = 404;
                        return { error: "League not found or no changes", success: false };
                    } catch (error) {
                        console.error(`[SLUG UPDATE ERROR] League ${params.id}:`, error);
                        set.status = 500;
                        return { success: false, error: "Server error while updating slug" };
                    }
                },
                {
                    beforeHandle: [loadLeague, loadLeagueAndCheckAdmin],
                }
            )
    ) // End of /:id group

    // Get league by slug (publicly accessible, but checks for admin privileges when user is authenticated)
    .get("/slug/:slug", async ({ params, set, user }: ElysiaContext & { params: { slug: string }, user?: JWTPayload | null }) => {
        const league = await getLeagueBySlug(params.slug);
        if (league) {
            // Create a safe copy of the league data
            const safeLeague = { ...league };
            
            // By default, hide the invite code
            delete safeLeague.inviteCode;
            
            // If user is authenticated, check if they're an admin or owner
            if (user && user.userId) {
                const isAdmin = 
                    league.ownerId.equals(new ObjectId(user.userId)) || 
                    league.adminIds?.some(adminId => adminId.equals(new ObjectId(user.userId)));
                
                // Include invite code if user is an admin
                if (isAdmin && league.inviteCode) {
                    safeLeague.inviteCode = league.inviteCode;
                }
            }
            
            return { league: safeLeague };
        }
        set.status = 404;
        return { league: null, error: "League not found" };
    }, {
        beforeHandle: [ensureAuth({ optional: true })]  // Make auth optional but available
    })

    // Query leagues
    .post(
        "/query",
        async ({
            body,
            user, // User context from ensureAuth (might be null)
            set,
        }: AuthContext & { // Use AuthContext
            body: {
                query?: any;
                limit?: number;
                skip?: number;
                type?: "public" | "private";
            };
        }) => {
            const { query = {}, limit = 50, skip = 0, type } = body;
            let finalQuery = { ...query }; // Clone query

            if (type === 'private') {
                // Require auth to query private leagues
                if (!user) {
                    set.status = 401;
                    return { leagues: [], count: 0, error: "Authentication required to query private leagues" };
                }
                finalQuery.type = 'private';
                // Future enhancement: Filter to user's private leagues?
                // finalQuery.$or = [ { ownerId: new ObjectId(user.userId) }, { adminIds: new ObjectId(user.userId) }, { memberIds: new ObjectId(user.userId) } ];
            } else {
                 // Default to public or respect explicit public type
                 finalQuery.type = 'public';
            }

            // Remove the 'type' field from the body params if it exists in finalQuery already
            // This avoids potential conflicts if 'type' was also in the generic query body
            if ('type' in finalQuery && 'type' in body.query) {
                delete finalQuery.type; // Let the explicit type param take precedence
            }

            const leagues = await queryLeagues(finalQuery, limit, skip);

            // Convert user ID string to ObjectId once if user exists
            const userObjectId = user ? new ObjectId(user.userId) : null;

            // Filter sensitive fields and add admin/owner status
            const safeLeagues = leagues.map(l => {
                let isCurrentUserAdminOrOwner = false;
                if (userObjectId) {
                    // Check if user is owner
                    const isOwner = l.ownerId.equals(userObjectId);
                    // Check if user is in adminIds array
                    const isAdmin = l.adminIds?.some(adminId => adminId.equals(userObjectId));
                    isCurrentUserAdminOrOwner = isOwner || isAdmin;
                }

                const safeL = {
                    _id: l._id.toHexString(), // Ensure _id is a string
                    name: l.name,
                    description: l.description,
                    slug: l.slug,
                    type: l.type, // Include type in response
                    // Add the new flag
                    isCurrentUserAdminOrOwner,
                };
                return safeL;
            });

            // Return the enhanced list
            return { leagues: safeLeagues, count: safeLeagues.length }; // Use count of mapped results
        }
    )

    // Get IDs of leagues the current user has pending join requests for
    .get(
        "/my-pending-requests",
        async ({
            user, // Comes from ensureAuth
            set,
        }: AuthContext) => { // Use AuthContext as user might be null if ensureAuth is optional, but here it's not optional
            if (!user) { // Should be guaranteed by ensureAuth, but good practice to check
                set.status = 401;
                return { pendingLeagueIds: [], error: "Authentication required" };
            }

            try {
                const pendingLeagues = await getUserPendingRequests(user.userId);
                // The model returns [{ _id: ObjectId(...) }, ...]
                // We want to return just the string IDs for the client
                const pendingLeagueIds = pendingLeagues.map(league => league._id.toHexString());
                return { pendingLeagueIds };
            } catch (err) {
                console.error(`[MY PENDING REQS ERROR] User ${user.userId}:`, err);
                set.status = 500;
                return { pendingLeagueIds: [], error: "Failed to fetch pending requests" };
            }
        }
        // No specific beforeHandle needed here, ensureAuth() at the top level covers authentication.
    )

    // Get all leagues where the current user is a member, admin, or owner
    .get(
        "/my-leagues",
        async ({
            user,
            set,
        }: AuthContext) => {
            if (!user) {
                set.status = 401;
                return { leagues: [], error: "Authentication required" };
            }

            try {
                const leagues = await getUserLeagues(user.userId);
                
                // Convert each league to a safe version for client
                const safeLeagues = leagues.map(league => {
                    // For each league, determine if user is admin/owner
                    const isAdmin = 
                        league.ownerId.equals(new ObjectId(user.userId)) || 
                        league.adminIds?.some(adminId => adminId.equals(new ObjectId(user.userId)));
                    
                    // Prepare a safe league object
                    const safeLeague = {
                        _id: league._id.toHexString(),
                        name: league.name,
                        description: league.description,
                        slug: league.slug,
                        type: league.type,
                        isAdmin,
                        isOwner: league.ownerId.equals(new ObjectId(user.userId)),
                        memberCount: league.memberIds?.length || 0
                    };
                    
                    // Only include invite code if user is admin
                    if (isAdmin && league.inviteCode) {
                        safeLeague.inviteCode = league.inviteCode;
                    }
                    
                    return safeLeague;
                });
                
                return { leagues: safeLeagues };
            } catch (err) {
                console.error(`[MY LEAGUES ERROR] User ${user.userId}:`, err);
                set.status = 500;
                return { leagues: [], error: "Failed to fetch leagues" };
            }
        }
    )

    // Direct invitation accept
    .post(
        "/invite-accept",
        async ({
            body,
            set,
            user // User context from ensureAuth
        }: AuthContext & { // Use AuthContext
            body: { invitationId: string };
        }) => {
            if (!user) { // Require authenticated user
                set.status = 401;
                return { error: "Authentication required to accept an invitation." };
            }
            const { invitationId } = body;
            try {
                // Pass authenticated user's ID to acceptInvitation
                await acceptInvitation(invitationId);
                return { success: true };
            } catch (err) {
                console.error(`[INVITE ACCEPT ERROR] User ${user.userId}, Invite ${invitationId}:`, err);
                set.status = err instanceof Error && err.message.includes("not found") ? 404 : 400;
                const message = err instanceof Error ? err.message : "Invalid or expired invitation";
                return { error: message };
            }
        }
    ); // End of routes
