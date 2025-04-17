import { Elysia } from "elysia";
import {
    createPrediction,
    getPredictionById,
    updatePrediction,
    deletePrediction,
    getPredictionsByQuery,
} from "../models/predictions";

// Predictions routes
export const predictionsRoutes = new Elysia()

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
        }: { body: any; set: any }) => {
            try {
                // Validate request body. Ensure required fields such as cid, athlete_id, event_date, and podium selection exist.
                if (
                    !body ||
                    typeof body !== "object" ||
                    !body.cid ||
                    !body.athlete_id ||
                    !body.event_date ||
                    !body.podium
                ) {
                    set.status = 400;
                    return {
                        error: "Invalid request body. Must include cid, athlete_id, event_date, and podium.",
                    };
                }

                const result = await createPrediction(body);

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
        }: { params: { id: string }; body: any; set: any }) => {
            try {
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    return { error: "Invalid request body" };
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
                        error: "Prediction not found or already finalized",
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
        }: { params: { id: string }; set: any }) => {
            try {
                const result = await deletePrediction(params.id);

                if (result.acknowledged && result.deletedCount > 0) {
                    return {
                        success: true,
                        message: "Prediction deleted successfully",
                    };
                } else if (result.deletedCount === 0) {
                    set.status = 404;
                    return {
                        error: "Prediction not found or already finalized",
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

    // Query predictions with filters and pagination
    .post(
        "/query",
        async ({
            body,
            set,
        }: { body: any; set: any }) => {
            try {
                // Validate request body
                if (!body || typeof body !== "object") {
                    set.status = 400;
                    return { error: "Invalid request body" };
                }

                const { query = {}, limit = 100, skip = 0 } = body;

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
