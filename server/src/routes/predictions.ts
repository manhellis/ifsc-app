import { Elysia } from "elysia";
import {
    createPrediction,
    getPredictionById,
    updatePrediction,
    deletePrediction,
    getPredictionsByQuery,
    lockPrediction,
    getPredictionsWithEvents,
    lockPredictionsByEvent,
    unlockPredictionsByEvent,
} from "../models/predictions";
import { ensureAuth } from "src/services/auth";
import { BasePrediction, PodiumPrediction } from "../../../shared/types/Prediction";
import { isUserInLeague } from "../models/leagues";
import { getEventByNumericId } from "../models/events";
import { AccountType } from "../../../shared/types/userTypes";

// Helper function to check if a category is finished
async function isCategoryFinished(eventId: string, categoryId: string): Promise<boolean> {
    try {
        // Event IDs are stored as numbers in the database
        const eventNumId = parseInt(eventId);
        if (isNaN(eventNumId)) return false;
        
        const event = await getEventByNumericId(eventNumId);
        if (!event || !event.dcats || event.dcats.length === 0) return false;
        
        const categoryNumId = parseInt(categoryId);
        if (isNaN(categoryNumId)) return false;
        
        // Find the category and check its status
        const category = event.dcats.find(cat => cat.dcat_id === categoryNumId);
        return category?.status === "finished" || category?.status === "completed";
    } catch (error) {
        console.error(`Error checking category status for event ${eventId}, category ${categoryId}:`, error);
        return false; // Default to not finished if there's an error
    }
}

// Predictions routes
export const predictionsRoutes = new Elysia({prefix: "/predictions"})
    .use(ensureAuth())
    // Get prediction by ID
    .get(
        "/:id",
        async ({
            params,
            set,
        }: { params: { id: string }; set: any }) => {
            try {
                const prediction = await getPredictionById(params.id);

                if (!prediction) {
                    set.status = 404;
                    console.log(`Prediction not found: ${params.id}`);
                    return { error: "Prediction not found" };
                }

                return { prediction };
            } catch (error) {
                console.error(`Error fetching prediction ${params.id}:`, error);
                set.status = 500;
                return { error: "Failed to fetch prediction" };
            }
        }
    )

    // Create new prediction
    .post(
        "/",
        async ({
            body,
            set,
            jwt,
            user,
        }: { body: any; set: any; jwt: any; user: any }) => {
            try {
                // Validate request body
                if (
                    !body ||
                    typeof body !== "object" ||
                    !body.leagueId ||
                    !body.eventId ||
                    !body.type
                ) {
                    set.status = 400;
                    console.log(`Invalid prediction request body: ${JSON.stringify(body)}`);
                    return {
                        error: "Invalid request body. Must include leagueId, eventId, and type.",
                    };
                }

                // Check if the category is finished
                if (body.categoryId) {
                    const categoryFinished = await isCategoryFinished(body.eventId, body.categoryId);
                    if (categoryFinished) {
                        set.status = 403; // Forbidden
                        console.log(`User ${user.userId} attempted to create prediction for finished category ${body.categoryId} in event ${body.eventId}`);
                        return {
                            error: "This category has already finished. No new predictions allowed.",
                        };
                    }
                }

                // Validate prediction type and data
                if (body.type === "podium") {
                    if (!body.data || !body.data.first || !body.data.second || !body.data.third) {
                        set.status = 400;
                        console.log(`Invalid podium prediction data: ${JSON.stringify(body.data)}`);
                        return {
                            error: "For podium predictions, data must include first, second, and third positions.",
                        };
                    }
                }
                // Add validation for other prediction types as they are created

                // Set userId from JWT, overriding any provided userId for security
                body.userId = user.userId;
                
                // Verify that the user is a member of the specified league
                const isLeagueMember = await isUserInLeague(user.userId, body.leagueId);
                if (!isLeagueMember) {
                    set.status = 403; // Forbidden
                    console.log(`User ${user.userId} attempted to create prediction for league ${body.leagueId} but is not a member`);
                    return {
                        error: "You must be a member of the league to create predictions in it",
                    };
                }
                
                // Check if user already has a prediction for this event and category in the same league
                const existingPredictions = await getPredictionsByQuery({
                    userId: user.userId,
                    eventId: body.eventId,
                    categoryId: body.categoryId,
                    leagueId: body.leagueId
                });
                
                if (existingPredictions.length > 0) {
                    set.status = 409; // Conflict
                    console.log(`Duplicate prediction attempt: User ${user.userId} already has a prediction for event ${body.eventId}, category ${body.categoryId} in league ${body.leagueId}`);
                    return { 
                        error: "You have already created a prediction for this event in this league",
                        existingPredictionId: existingPredictions[0]._id
                    };
                }
                
                // Set default locked state if not provided
                if (body.locked === undefined) {
                    body.locked = false;
                }

                const result = await createPrediction(body as Omit<PodiumPrediction, '_id'>);

                if (result.acknowledged) {
                    console.log(`Prediction created successfully: ${result.predictionId} by user ${user.userId} for event ${body.eventId} (${body.type})`);
                    return {
                        success: true,
                        message: "Prediction created successfully",
                        predictionId: result.predictionId,
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to create prediction for event ${body.eventId} by user ${user.userId}`);
                    return { error: "Failed to create prediction" };
                }
            } catch (error) {
                console.error(`Error creating prediction for user ${user.userId}:`, error);
                set.status = 500;
                return { error: "Failed to create prediction" };
            }
        }
    )

    // Update prediction
    .put(
        "/:id",
        async ({
            params,
            body,
            set,
            jwt,
            user,
        }: { params: { id: string }; body: any; set: any; jwt: any; user: any }) => {
            try {
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    console.log(`Invalid update request body for prediction ${params.id}: ${JSON.stringify(body)}`);
                    return { error: "Invalid request body" };
                }

                // Get existing prediction to verify ownership
                const existingPrediction = await getPredictionById(params.id);
                if (!existingPrediction) {
                    set.status = 404;
                    console.log(`Update attempted for non-existent prediction: ${params.id}`);
                    return { error: "Prediction not found" };
                }

                // Check if the category is finished
                const categoryFinished = await isCategoryFinished(
                    existingPrediction.eventId, 
                    existingPrediction.categoryId
                );
                if (categoryFinished) {
                    set.status = 403; // Forbidden
                    console.log(`User ${user.userId} attempted to update prediction ${params.id} for finished category ${existingPrediction.categoryId}`);
                    return {
                        error: "This category has already finished. No updates allowed.",
                    };
                }

                // Check if user owns this prediction
                if (existingPrediction.userId !== user.userId) {
                    set.status = 403;
                    console.log(`Unauthorized update attempt: User ${user.userId} tried to update prediction ${params.id} owned by ${existingPrediction.userId}`);
                    return { error: "You don't have permission to update this prediction" };
                }

                // If trying to update leagueId, verify user is a member of the new league
                if (body.leagueId && body.leagueId !== existingPrediction.leagueId) {
                    const isLeagueMember = await isUserInLeague(user.userId, body.leagueId);
                    if (!isLeagueMember) {
                        set.status = 403; // Forbidden
                        console.log(`User ${user.userId} attempted to move prediction ${params.id} to league ${body.leagueId} but is not a member`);
                        return {
                            error: "You must be a member of the league to move predictions to it",
                        };
                    }
                }

                const result = await updatePrediction(params.id, body);

                if (result.acknowledged && result.matchedCount > 0) {
                    console.log(`Prediction ${params.id} updated successfully by user ${user.userId}`);
                    return {
                        success: true,
                        message: "Prediction updated successfully",
                        modifiedCount: result.modifiedCount,
                    };
                } else if (result.matchedCount === 0) {
                    set.status = 404;
                    console.log(`Update failed: Prediction ${params.id} not found`);
                    return {
                        error: "Prediction not found",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to update prediction ${params.id}`);
                    return { error: "Failed to update prediction" };
                }
            } catch (error) {
                console.error(`Error updating prediction ${params.id} by user ${user.userId}:`, error);
                set.status = 500;
                return {
                    error: "Failed to update prediction",
                    details: String(error),
                };
            }
        }
    )

    // Delete prediction
    .delete(
        "/:id",
        async ({
            params,
            set,
            jwt,
            user,
        }: { params: { id: string }; set: any; jwt: any; user: any }) => {
            try {
                // Get existing prediction to verify ownership
                const existingPrediction = await getPredictionById(params.id);
                if (!existingPrediction) {
                    set.status = 404;
                    console.log(`Delete attempted for non-existent prediction: ${params.id}`);
                    return { error: "Prediction not found" };
                }

                // Check if user owns this prediction
                if (existingPrediction.userId !== user.userId) {
                    set.status = 403;
                    console.log(`Unauthorized delete attempt: User ${user.userId} tried to delete prediction ${params.id} owned by ${existingPrediction.userId}`);
                    return { error: "You don't have permission to delete this prediction" };
                }

                const result = await deletePrediction(params.id);

                if (result.acknowledged && result.deletedCount > 0) {
                    console.log(`Prediction ${params.id} deleted successfully by user ${user.userId}`);
                    return {
                        success: true,
                        message: "Prediction deleted successfully",
                    };
                } else if (result.deletedCount === 0) {
                    set.status = 404;
                    console.log(`Delete failed: Prediction ${params.id} not found or already locked`);
                    return {
                        error: "Prediction not found or already locked",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to delete prediction ${params.id}`);
                    return { error: "Failed to delete prediction" };
                }
            } catch (error) {
                console.error(`Error deleting prediction ${params.id} by user ${user.userId}:`, error);
                set.status = 500;
                return {
                    error: "Failed to delete prediction",
                    details: String(error),
                };
            }
        }
    )

    // Lock prediction (admin only)
    .put(
        "/:id/lock",
        async ({
            params,
            set,
            jwt,
            user,
        }: { params: { id: string }; set: any; jwt: any; user: any }) => {
            try {
                // Check if user has admin rights
                if (user.accountType !== AccountType.ADMIN) {
                    set.status = 403;
                    console.log(`Non-admin lock attempt: User ${user.userId} tried to lock prediction ${params.id}`);
                    return { error: "Only administrators can lock predictions" };
                }

                const result = await lockPrediction(params.id);

                if (result.acknowledged && result.modifiedCount > 0) {
                    console.log(`Prediction ${params.id} locked successfully by admin ${user.userId}`);
                    return {
                        success: true,
                        message: "Prediction locked successfully",
                    };
                } else if (result.modifiedCount === 0) {
                    set.status = 404;
                    console.log(`Lock failed: Prediction ${params.id} not found or already locked`);
                    return {
                        error: "Prediction not found or already locked",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to lock prediction ${params.id}`);
                    return { error: "Failed to lock prediction" };
                }
            } catch (error) {
                console.error(`Error locking prediction ${params.id} by admin ${user.userId}:`, error);
                set.status = 500;
                return {
                    error: "Failed to lock prediction",
                    details: String(error),
                };
            }
        }
    )

    // Query predictions with filters and pagination
    .post(
        "/query",
        async ({
            body,
            set,
            jwt,
            user,
        }: { body: any; set: any; jwt: any; user: any }) => {
            try {
                // Validate request body
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    console.log(`Invalid query request body: ${JSON.stringify(body)}`);
                    return { error: "Invalid request body" };
                }

                const { query = {}, limit = 100, skip = 0 } = body;
                
                // If not admin, limit queries to user's own predictions
                if (user.accountType !== AccountType.ADMIN) {
                    query.userId = user.userId;
                }

                const predictions = await getPredictionsByQuery(
                    query,
                    limit,
                    skip
                );

                console.log(`Query executed by user ${user.userId}: found ${predictions.length} predictions`);
                return { predictions, count: predictions.length };
            } catch (error) {
                console.error(`Error querying predictions for user ${user.userId}:`, error);
                set.status = 500;
                return { error: "Failed to query predictions" };
            }
        }
    )

    // Query predictions with events (using aggregation pipeline)
    .post(
        "/with-events",
        async ({
            body,
            set,
            jwt,
            user,
        }: { body: any; set: any; jwt: any; user: any }) => {
            try {
                // Validate request body
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    console.log(`Invalid query request body: ${JSON.stringify(body)}`);
                    return { error: "Invalid request body" };
                }

                const { query = {}, limit = 20, skip = 0, sortField = "createdAt" } = body;
                
                // If not admin, limit queries to user's own predictions
                if (user.accountType !== AccountType.ADMIN) {
                    query.userId = user.userId;
                }

                const predictions = await getPredictionsWithEvents(
                    query,
                    limit,
                    skip,
                    sortField
                );

                console.log(`Aggregation query executed by user ${user.userId}: found ${predictions.length} predictions with events`);
                return { predictions, count: predictions.length };
            } catch (error) {
                console.error(`Error querying predictions with events for user ${user.userId}:`, error);
                set.status = 500;
                return { error: "Failed to query predictions with events" };
            }
        }
    )

    // Lock all predictions for an event (admin only)
    .put(
        "/event/:id/lock",
        async ({
            params,
            set,
            jwt,
            user,
        }: { params: { id: string }; set: any; jwt: any; user: any }) => {
            try {
                // Check if user has admin rights
                if (user.accountType !== AccountType.ADMIN) {
                    set.status = 403;
                    console.log(`Non-admin event lock attempt: User ${user.userId} tried to lock predictions for event ${params.id}`);
                    return { error: "Only administrators can lock predictions" };
                }

                const result = await lockPredictionsByEvent(params.id);

                if (result.acknowledged && result.modifiedCount > 0) {
                    console.log(`Predictions for event ${params.id} locked successfully by admin ${user.userId}. Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`);
                    return {
                        success: true,
                        message: `Predictions locked successfully for event`,
                        modifiedCount: result.modifiedCount,
                        matchedCount: result.matchedCount
                    };
                } else if (result.matchedCount === 0) {
                    set.status = 404;
                    console.log(`Lock failed: No unlocked predictions found for event ${params.id}`);
                    return {
                        error: "No unlocked predictions found for this event",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to lock predictions for event ${params.id}`);
                    return { error: "Failed to lock predictions" };
                }
            } catch (error) {
                console.error(`Error locking predictions for event ${params.id} by admin ${user.userId}:`, error);
                set.status = 500;
                return {
                    error: "Failed to lock predictions",
                    details: String(error),
                };
            }
        }
    )

    // Unlock all predictions for an event (admin only)
    .put(
        "/event/:id/unlock",
        async ({
            params,
            set,
            jwt,
            user,
        }: { params: { id: string }; set: any; jwt: any; user: any }) => {
            try {
                // Check if user has admin rights
                if (user.accountType !== AccountType.ADMIN) {
                    set.status = 403;
                    console.log(`Non-admin event unlock attempt: User ${user.userId} tried to unlock predictions for event ${params.id}`);
                    return { error: "Only administrators can unlock predictions" };
                }

                const result = await unlockPredictionsByEvent(params.id);

                if (result.acknowledged && result.modifiedCount > 0) {
                    console.log(`Predictions for event ${params.id} unlocked successfully by admin ${user.userId}. Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`);
                    return {
                        success: true,
                        message: `Predictions unlocked successfully for event`,
                        modifiedCount: result.modifiedCount,
                        matchedCount: result.matchedCount
                    };
                } else if (result.matchedCount === 0) {
                    set.status = 404;
                    console.log(`Unlock failed: No locked predictions found for event ${params.id}`);
                    return {
                        error: "No locked predictions found for this event",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to unlock predictions for event ${params.id}`);
                    return { error: "Failed to unlock predictions" };
                }
            } catch (error) {
                console.error(`Error unlocking predictions for event ${params.id} by admin ${user.userId}:`, error);
                set.status = 500;
                return {
                    error: "Failed to unlock predictions",
                    details: String(error),
                };
            }
        }
    );
