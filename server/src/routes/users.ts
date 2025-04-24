import { Elysia, t } from "elysia";
import { getUserById, getUsersByIds } from "../models/user";
import { ObjectId } from "mongodb";
import { ensureAuth } from "src/services/auth";

// Public user route - provides access to non-sensitive user information
export const userRoutes = new Elysia({ prefix: "/users" })
    // Get public information for a single user by ID
    // .use(ensureAuth)
    .get(
        "/:id",
        async ({ params, set }) => {
            try {
                const userId = params.id;

                // Validate ObjectId format
                if (!ObjectId.isValid(userId)) {
                    set.status = 400;
                    return { error: "Invalid user ID format" };
                }

                const user = await getUserById(userId);

                if (!user) {
                    set.status = 404;
                    return { error: "User not found" };
                }

                // Return only public fields
                return {
                    id: user._id.toString(),
                    name: user.name,
                    picture: user.picture || null,
                    accountType: user.accountType,
                };
            } catch (error: any) {
                console.error("Error fetching user:", error);
                set.status = 500;
                return { error: "Failed to fetch user information" };
            }
        },
        {
            params: t.Object({
                id: t.String(),
            }),
            detail: { summary: "Get public information for a specific user" },
        }
    )
    // Get public information for multiple users
    .post(
        "/batch",
        async ({ body, set }) => {
            try {
                const { userIds } = body;

                // Validate all IDs
                const validIds = userIds.filter((id) => ObjectId.isValid(id));

                if (validIds.length === 0) {
                    set.status = 400;
                    return { error: "No valid user IDs provided" };
                }

                const users = await getUsersByIds(validIds);

                // Map to public user info format
                return users.map((user) => ({
                    id: user._id.toString(),
                    name: user.name,
                    picture: user.picture || null,
                    accountType: user.accountType,
                }));
            } catch (error: any) {
                console.error("Error fetching users:", error);
                set.status = 500;
                return { error: "Failed to fetch user information" };
            }
        },
        {
            body: t.Object({
                userIds: t.Array(t.String()),
            }),
            detail: {
                summary:
                    "Get public information for multiple users by their IDs",
            },
        }
    );
