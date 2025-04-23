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
                    return { error: "Prediction not found" };
                }

                return { prediction };
            } catch (error) {
                console.error("Error fetching prediction:", error);
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
        }: { body: any; set: any; jwt: any }) => {
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
                    return {
                        error: "Invalid request body. Must include leagueId, eventId, and type.",
                    };
                }

                // Validate prediction type and data
                if (body.type === "podium") {
                    if (!body.data || !body.data.first || !body.data.second || !body.data.third) {
                        set.status = 400;
                        return {
                            error: "For podium predictions, data must include first, second, and third positions.",
                        };
                    }
                }
                // Add validation for other prediction types as they are created

                // Set userId from JWT
                body.userId = jwt.userId;
                
                // Set default locked state if not provided
                if (body.locked === undefined) {
                    body.locked = false;
                }

                const result = await createPrediction(body as Omit<PodiumPrediction, '_id'>);

                if (result.acknowledged) {
                    return {
                        success: true,
                        message: "Prediction created successfully",
                        predictionId: result.predictionId,
                    };
                } else {
                    set.status = 500;
                    return { error: "Failed to create prediction" };
                }
            } catch (error) {
                console.error("Error creating prediction:", error);
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
        }: { params: { id: string }; body: any; set: any; jwt: any }) => {
            try {
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    return { error: "Invalid request body" };
                }

                // Get existing prediction to verify ownership
                const existingPrediction = await getPredictionById(params.id);
                if (!existingPrediction) {
                    set.status = 404;
                    return { error: "Prediction not found" };
                }

                // Check if user owns this prediction
                if (existingPrediction.userId !== jwt.userId) {
                    set.status = 403;
                    return { error: "You don't have permission to update this prediction" };
                }

                const result = await updatePrediction(params.id, body);

                if (result.acknowledged && result.matchedCount > 0) {
                    return {
                        success: true,
                        message: "Prediction updated successfully",
                        modifiedCount: result.modifiedCount,
                    };
                } else if (result.matchedCount === 0) {
                    set.status = 404;
                    return {
                        error: "Prediction not found",
                    };
                } else {
                    set.status = 500;
                    return { error: "Failed to update prediction" };
                }
            } catch (error) {
                console.error("Error updating prediction:", error);
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
        }: { params: { id: string }; set: any; jwt: any }) => {
            try {
                // Get existing prediction to verify ownership
                const existingPrediction = await getPredictionById(params.id);
                if (!existingPrediction) {
                    set.status = 404;
                    return { error: "Prediction not found" };
                }

                // Check if user owns this prediction
                if (existingPrediction.userId !== jwt.userId) {
                    set.status = 403;
                    return { error: "You don't have permission to delete this prediction" };
                }

                const result = await deletePrediction(params.id);

                if (result.acknowledged && result.deletedCount > 0) {
                    return {
                        success: true,
                        message: "Prediction deleted successfully",
                    };
                } else if (result.deletedCount === 0) {
                    set.status = 404;
                    return {
                        error: "Prediction not found or already locked",
                    };
                } else {
                    set.status = 500;
                    return { error: "Failed to delete prediction" };
                }
            } catch (error) {
                console.error("Error deleting prediction:", error);
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
        }: { params: { id: string }; set: any; jwt: any }) => {
            try {
                // Check if user has admin rights
                if (!jwt.isAdmin) {
                    set.status = 403;
                    return { error: "Only administrators can lock predictions" };
                }

                const result = await lockPrediction(params.id);

                if (result.acknowledged && result.modifiedCount > 0) {
                    return {
                        success: true,
                        message: "Prediction locked successfully",
                    };
                } else if (result.modifiedCount === 0) {
                    set.status = 404;
                    return {
                        error: "Prediction not found or already locked",
                    };
                } else {
                    set.status = 500;
                    return { error: "Failed to lock prediction" };
                }
            } catch (error) {
                console.error("Error locking prediction:", error);
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
        }: { body: any; set: any; jwt: any }) => {
            try {
                // Validate request body
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    return { error: "Invalid request body" };
                }

                const { query = {}, limit = 100, skip = 0 } = body;
                
                // If not admin, limit queries to user's own predictions
                if (!jwt.isAdmin) {
                    query.userId = jwt.userId;
                }

                const predictions = await getPredictionsByQuery(
                    query,
                    limit,
                    skip
                );

                return { predictions, count: predictions.length };
            } catch (error) {
                console.error("Error querying predictions:", error);
                set.status = 500;
                return { error: "Failed to query predictions" };
            }
        }
    );
