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
} from "../models/leagues";
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

// Context after league has been loaded
type ContextWithLeague = LeagueRouteContext & {
    league: WithId<League>;
};

// Context after league loaded and admin check passed
type AdminContextWithLeague = ContextWithLeague;

// Context after league loaded and owner check passed
type OwnerContextWithLeague = ContextWithLeague;

// Middleware to load league and check admin permissions
const loadLeagueAndCheckAdmin = async (ctx: AuthContext & { params: { id: string }}) => {
    const { league, user } = await loadLeague(ctx); // Calls base loader
    const isAdmin =
        league.ownerId.equals(user.userId) ||
        league.adminIds?.some((adminId: ObjectId) => adminId.equals(user.userId)); // Explicit type

    if (!isAdmin) {
        ctx.set.status = 403;
        throw new Error("User is not an admin of this league");
    }
    return { league, user }; // Return validated context
};

// Middleware to load league (no admin check)
const loadLeague = async (ctx: AuthContext & { params: { id: string }}) => {
    const { params, set, user } = ctx;
    if (!user) { // Guard against null user
        set.status = 401;
        throw new Error("Authentication required.");
    }
    const league = await getLeagueById(params.id);
    if (!league) {
        set.status = 404;
        throw new Error("League not found");
    }
    // Return league and non-null user for context merging
    return { league, user };
};

// Middleware to load league and check owner permission
const loadLeagueAndCheckOwner = async (ctx: AuthContext & { params: { id: string }}) => {
    const { league, user } = await loadLeague(ctx); // Calls base loader

    if (!league.ownerId.equals(user.userId)) {
        ctx.set.status = 403;
        throw new Error("Only the league owner can perform this action.");
    }
    return { league, user };
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
                // First validate the name format here
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
                    const slug = trimmedName
                        .toLowerCase()
                        .replace(/\s+/g, "")
                        .replace(/[^a-z0-9]/g, "")
                        .slice(0, 30);
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
            .get("/", ({ league, user }: ContextWithLeague) => {
                // Type context provided by `loadLeague` in beforeHandle
                const isAdmin =
                    league.ownerId.equals(user.userId) ||
                    league.adminIds?.some((adminId: ObjectId) => // Explicit type
                        adminId.equals(user.userId)
                    );

                if (isAdmin) return { league };

                // Non-admin view
                const safeLeague = { ...league };
                delete safeLeague.inviteCode;
                return { league: safeLeague };
            }, {
                 beforeHandle: [loadLeague] // Ensures league loaded, user authenticated
            })

            // Update league (Admin Only)
            .put(
                "/",
                async ({
                    params,
                    body,
                    set,
                    user,
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                }: AdminContextWithLeague & { body: Partial<Pick<League, "name" | "description" | "type" | "maxMembers">> }) => {

                    const res = await updateLeague(params.id, body);
                    if (res.matchedCount) {
                        console.log(
                            `[LEAGUE UPDATED] id=${
                                params.id
                            }, changes=${JSON.stringify(body)}, by user=${
                                user.userId
                            }`
                        );
                        return { success: true };
                    }
                    set.status = 404; // Should not happen if middleware worked
                    return { error: "League not found or no changes" };
                },
                {
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // Delete league (Owner Only)
            .delete(
                "/",
                async ({
                    params,
                    set,
                    user,
                    league, // Context provided by `loadLeagueAndCheckOwner`
                }: OwnerContextWithLeague) => {

                    const res = await deleteLeague(params.id);
                    if (res.deletedCount) {
                        console.log(
                            `[LEAGUE DELETED] id=${params.id}, by user=${user.userId}`
                        );
                        return { success: true };
                    }
                    set.status = 404; // Should not happen if middleware worked
                    return { error: "League not found" };
                },
                {
                    beforeHandle: [loadLeagueAndCheckOwner],
                }
            )

            // --- Public join flow --- //

            // Request to join public league
            .post(
                "/join-request",
                async ({
                    params,
                    user,
                    set,
                    league, // Context provided by `loadLeague`
                }: ContextWithLeague) => {
                    if (league.type !== "public") {
                        set.status = 400;
                        return { error: "Not a public league" };
                    }
                    // TODO: Check if user is already member/pending?
                    await requestToJoinLeague(params.id, user.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague], // User authenticated, league loaded
                }
            )

            // List pending requests (admin only)
            .get(
                "/pending-requests",
                async ({
                    params,
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                }: AdminContextWithLeague) => {
                    const pending = await getPendingRequests(params.id);
                    return { pending };
                },
                {
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // Approve a join request (admin only)
            .post(
                "/approve/:userId",
                async ({
                    params, // Includes id and userId
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                }: AdminContextWithLeague & { params: { id: string; userId: string } }) => {
                    await approveJoinRequest(params.id, params.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // Reject a join request (admin only)
            .post(
                "/reject/:userId",
                async ({
                    params, // Includes id and userId
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                }: AdminContextWithLeague & { params: { id: string; userId: string } }) => {
                    await rejectJoinRequest(params.id, params.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // --- Private join flow --- //

            // Join via invite code
            .post(
                "/join-private",
                async ({
                    params,
                    body,
                    set,
                    user,
                    league, // Context provided by `loadLeague`
                }: ContextWithLeague & { body: { inviteCode: string } }) => {
                    if (league.type !== "private") {
                        set.status = 400;
                        return { error: "Not a private league" };
                    }
                    // TODO: Check if user is already member?
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
                    beforeHandle: [loadLeague], // User authenticated, league loaded
                }
            )

            // Generate or return existing invite code (admin only)
            .post(
                "/invite",
                ({
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                    set,
                }: AdminContextWithLeague) => {
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
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // Create an invitation to a private league (admin only)
            .post(
                "/invite-user",
                async ({
                    params,
                    body,
                    user,
                    set,
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                }: AdminContextWithLeague & { body: { invitedUserId: string } }) => {
                    const { invitedUserId } = body;
                    // TODO: Check if invitedUserId is already member/invited?
                    // TODO: Check if invitedUserId exists?
                    const res = await createInvitation({
                        leagueId: params.id,
                        invitedUserId,
                        invitedBy: user.userId, // The admin performing the action
                    });
                    if (res.acknowledged) {
                        return { invitationId: res.insertedId };
                    }
                    set.status = 500;
                    return { error: "Failed to create invitation" };
                },
                {
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // --- Membership removal --- //

            // Remove a member (admin only)
            .post(
                "/remove/:userId",
                async ({
                    params, // Includes id and userId to remove
                    set,
                    user, // The admin performing the removal
                    league, // Context provided by `loadLeagueAndCheckAdmin`
                }: AdminContextWithLeague & { params: { id: string; userId: string } }) => {
                    const userIdToRemove = params.userId;
                    const adminUserId = user.userId;

                    // Prevent owner from being removed
                    if (league.ownerId.toHexString() === userIdToRemove) {
                         set.status = 403;
                         return { error: "Cannot remove the league owner." };
                    }

                    // Prevent admin removing self via this route
                    if (adminUserId === userIdToRemove) {
                         set.status = 400;
                         return { error: "Admins cannot remove themselves using this endpoint. Use 'leave league'." };
                    }

                    await removeMember(params.id, userIdToRemove);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeagueAndCheckAdmin],
                }
            )

            // Leave league (self)
            .post(
                "/leave",
                async ({
                    params,
                    user,
                    league, // Context provided by `loadLeague`
                    set,
                }: ContextWithLeague) => {
                    // Check if owner is trying to leave
                    if (league.ownerId.equals(user.userId)) {
                        set.status = 400;
                        return {
                            error: "Owner cannot leave the league via this endpoint. Transfer ownership or delete the league.",
                        };
                    }
                    // TODO: Check if user is actually a member before leaving?
                    await leaveLeague(params.id, user.userId);
                    return { success: true };
                },
                {
                    beforeHandle: [loadLeague], // User authenticated, league loaded
                }
            )
    ) // End of /:id group

    // Get league by slug (publicly accessible, no auth needed)
    .get("/slug/:slug", async ({ params, set }: ElysiaContext & { params: { slug: string }}) => {
        const league = await getLeagueBySlug(params.slug);
         if (league) {
             // Hide sensitive info for public view
             const safeLeague = { ...league };
             delete safeLeague.inviteCode;
             // delete safeLeague.memberIds; // Optionally hide members
             // delete safeLeague.adminIds; // Optionally hide admins
             return { league: safeLeague };
         }
         set.status = 404;
         return { league: null, error: "League not found" };
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
            // Filter sensitive fields from results
            const safeLeagues = leagues.map(l => {
                const safeL = {...l};
                delete safeL.inviteCode;
                // Optionally remove other fields like memberIds/adminIds for list view
                return safeL;
            })
            return { leagues: safeLeagues, count: safeLeagues.length };
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
