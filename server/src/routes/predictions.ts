import { Elysia } from "elysia";
import {
    createPrediction,
    getPredictionById,
    updatePrediction,
    deletePrediction,
    getPredictionsByQuery,
    lockPrediction,
} from "../models/predictions";
import { ensureAuth } from "src/services/auth";
import { BasePrediction, PodiumPrediction } from "../../../shared/types/Prediction";

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
                
                // Check if user already has a prediction for this event
                const existingPredictions = await getPredictionsByQuery({
                    userId: user.userId,
                    eventId: body.eventId,
                    categoryId: body.categoryId
                });
                
                if (existingPredictions.length > 0) {
                    set.status = 409; // Conflict
                    console.log(`Duplicate prediction attempt: User ${user.userId} already has a prediction for event ${body.eventId}`);
                    return { 
                        error: "You have already created a prediction for this event",
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

                // Check if user owns this prediction
                if (existingPrediction.userId !== user.userId) {
                    set.status = 403;
                    console.log(`Unauthorized update attempt: User ${user.userId} tried to update prediction ${params.id} owned by ${existingPrediction.userId}`);
                    return { error: "You don't have permission to update this prediction" };
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
                if (!user.isAdmin) {
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
                if (!user.isAdmin) {
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
    );
