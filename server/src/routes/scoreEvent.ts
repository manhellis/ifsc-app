import { Elysia } from "elysia";
import { calculatePodiumScore } from "../models/scoring";
import {
    getPredictionsByQuery,
    updatePredictionScoreDetails,
} from "../models/predictions";
import { getEventByNumericId } from "../models/events";
import { updateStanding } from "../models/standings";
import { Top3Podium } from "@shared/types/Prediction";
import { Event } from "@shared/types";
import { ensureAuth } from "../services/auth";
import { fetchAndStoreFullResults } from "../models/fullResultsFetcher";
import { getAllCategoryResults } from "../models/resultHelpers";
import { getDb } from "../db";

interface EventWithResults extends Event {
    results?: {
        podium?: Top3Podium;
    };
}

// Legacy helper function to get event result - will be deprecated
async function getEventResult(eventId: string, type: string): Promise<Top3Podium | null> {
    const numericId = parseInt(eventId, 10);
    if (isNaN(numericId)) {
        return null;
    }

    const event = await getEventByNumericId(numericId) as EventWithResults | null;
    if (!event || !event.results || !event.results.podium) {
        return null;
    }

    return event.results.podium;
}

// Get distinct league IDs that have predictions for a specific event
async function getLeaguesForEvent(eventId: string): Promise<string[]> {
    const predictionsCol = getDb().collection("predictions");
    const leagues = await predictionsCol.distinct("leagueId", { eventId });
    return leagues;
}

export const scoreEventRoute = new Elysia()
    .use(ensureAuth)
    .post("/score-event", async ({ body, set }) => {
        const { eventId } = body as { eventId?: string };
        console.log(`[SCORE-EVENT] Started scoring process for eventId: ${eventId}`);

        if (!eventId) {
            console.log(`[SCORE-EVENT] Missing required parameter: eventId: ${eventId}`);
            set.status = 400;
            return { 
                success: false, 
                error: "Missing required parameter: eventId is required" 
            };
        }

        try {
            // Fetch the latest full results from IFSC API
            console.log(`[SCORE-EVENT] Fetching full results from IFSC API for eventId: ${eventId}`);
            const fetchResult = await fetchAndStoreFullResults(eventId);
            if (!fetchResult.success) {
                console.log(`[SCORE-EVENT] Failed to fetch event results from IFSC API`);
                set.status = 500;
                return { success: false, error: "Failed to fetch event results from IFSC API" };
            }
            console.log(`[SCORE-EVENT] Successfully fetched and stored full results for eventId: ${eventId}`);

            // Get all category results for this event
            console.log(`[SCORE-EVENT] Getting all category results for eventId: ${eventId}`);
            const categoryResults = await getAllCategoryResults(eventId);
            console.log(`[SCORE-EVENT] Found ${categoryResults.length} categories for eventId: ${eventId}`);
            console.log(`[SCORE-EVENT] Category results: ${JSON.stringify(categoryResults)}`); 
            if (!categoryResults.length) {
                console.log(`[SCORE-EVENT] No category results found for eventId: ${eventId}`);
                set.status = 404;
                return { success: false, error: "No category results found for this event" };
            }
            
            // Get all leagues that have predictions for this event
            console.log(`[SCORE-EVENT] Finding leagues with predictions for eventId: ${eventId}`);
            const leagueIds = await getLeaguesForEvent(eventId);
            console.log(`[SCORE-EVENT] Found ${leagueIds.length} leagues with predictions for eventId: ${eventId}`);
            
            if (!leagueIds.length) {
                console.log(`[SCORE-EVENT] No leagues found with predictions for eventId: ${eventId}`);
                set.status = 404;
                return { success: false, error: "No leagues found with predictions for this event" };
            }

            // Process predictions for each league
            let totalProcessed = 0;
            let totalLeaguesProcessed = 0;
            
            for (const leagueId of leagueIds) {
                console.log(`[SCORE-EVENT] Processing league: ${leagueId}`);
                let leagueTotalProcessed = 0;
                let categoriesProcessed = 0;

                // Process each category for this league
                for (const category of categoryResults) {
                    console.log(`[SCORE-EVENT] Processing category: ${category.categoryName} (ID: ${category.categoryId}) for league: ${leagueId}`);
                    
                    // Skip categories with no podium results
                    if (!category.podium) {
                        console.log(`[SCORE-EVENT] Skipping category ${category.categoryName} - no podium results`);
                        continue;
                    }
                    
                    console.log(`[SCORE-EVENT] Podium for category ${category.categoryName}: ${JSON.stringify(category.podium)}`);

                    // Get all un-scored predictions for this event, category, and league
                    console.log(`[SCORE-EVENT] Getting un-scored predictions for eventId: ${eventId}, categoryId: ${category.categoryId}, leagueId: ${leagueId}`);
                    const predictions = await getPredictionsByQuery({
                        eventId,
                        categoryId: category.categoryId.toString(),
                        leagueId,
                        type: "podium",
                        event_finished: false,
                    });
                    console.log(`[SCORE-EVENT] Found ${predictions.length} un-scored predictions for category ${category.categoryName} in league ${leagueId}`);

                    // Process each prediction for this category
                    for (const prediction of predictions) {
                        console.log(`[SCORE-EVENT] Processing prediction ID: ${prediction._id} for user: ${prediction.userId}`);
                        
                        // Calculate score based on default scoring rules if not provided
                        const defaultRules = {
                            exact: { first: 20, second: 15, third: 10 }
                        };

                        // Calculate score
                        console.log(`[SCORE-EVENT] Calculating score for prediction: ${JSON.stringify(prediction.data)}`);
                        const scoreDetail = calculatePodiumScore(
                            category.podium,
                            prediction.data,
                            defaultRules
                        );
                        console.log(`category.podium: ${JSON.stringify(category.podium)}`);
                        console.log(`prediction.data: ${JSON.stringify(prediction.data)}`);
                        console.log(`[SCORE-EVENT] Score calculated: ${JSON.stringify(scoreDetail)}`);

                        // Update the prediction with score details
                        console.log(`[SCORE-EVENT] Updating prediction ${prediction._id} with score details`);
                        await updatePredictionScoreDetails(
                            prediction._id,
                            "podium",
                            scoreDetail,
                            category.categoryId.toString()
                        );
                        console.log(`[SCORE-EVENT] Successfully updated prediction ${prediction._id}`);

                        // Update standings
                        console.log(`[SCORE-EVENT] Updating standings for user: ${prediction.userId} in league: ${leagueId}`);
                        await updateStanding({
                            leagueId,
                            userId: prediction.userId,
                            eventId,
                            categoryId: category.categoryId,
                            categoryName: category.categoryName,
                            eventPoints: scoreDetail.total,
                        });
                        console.log(`[SCORE-EVENT] Successfully updated standings for user: ${prediction.userId}`);

                        leagueTotalProcessed++;
                        totalProcessed++;
                    }

                    if (predictions.length > 0) {
                        categoriesProcessed++;
                    }
                    console.log(`[SCORE-EVENT] Completed processing category: ${category.categoryName} for league: ${leagueId}`);
                }

                console.log(`[SCORE-EVENT] Completed processing league: ${leagueId} - processed ${leagueTotalProcessed} predictions across ${categoriesProcessed} categories`);
                if (leagueTotalProcessed > 0) {
                    totalLeaguesProcessed++;
                }
            }

            console.log(`[SCORE-EVENT] Successfully completed scoring for eventId: ${eventId}, processed ${totalProcessed} predictions across ${totalLeaguesProcessed} leagues`);
            
            // Final summary log
            console.log(`[SCORE-EVENT] === SCORING SUMMARY ===
Event ID: ${eventId}
Total predictions processed: ${totalProcessed}
Total leagues processed: ${totalLeaguesProcessed}
Categories processed: ${categoryResults.length}
Process completed: ${new Date().toISOString()}
==========================`);
            
            return { 
                success: true, 
                processed: totalProcessed,
                leagues: totalLeaguesProcessed,
                message: `Successfully processed ${totalProcessed} predictions across ${totalLeaguesProcessed} leagues`
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[SCORE-EVENT] Error scoring event: ${errorMessage}`, error);
            set.status = 500;
            return { 
                success: false, 
                error: "Failed to score event",
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    });

    

