import { Elysia } from "elysia";
import { fetchAndStoreFullResults } from "../models/fullResultsFetcher";
import { ensureAuth } from "../services/auth";

export const fetchFullResultsRoute = new Elysia()
    .use(ensureAuth)
    .post("/fetch-full-results", async ({ body, set }) => {
        const { eventId } = body as { eventId?: string };

        if (!eventId) {
            set.status = 400;
            return { 
                success: false, 
                error: "Missing required parameter: eventId is required" 
            };
        }

        try {
            // Fetch the latest full results from IFSC API
            const fetchResult = await fetchAndStoreFullResults(eventId);
            
            return { 
                success: fetchResult.success, 
                categoriesProcessed: fetchResult.categoriesProcessed,
                message: fetchResult.categoriesProcessed > 0 
                    ? `Successfully fetched and stored results for ${fetchResult.categoriesProcessed} categories`
                    : "No categories were processed"
            };
        } catch (error) {
            console.error("Error fetching full results:", error instanceof Error ? error.message : String(error));
            set.status = 500;
            return { 
                success: false, 
                categoriesProcessed: 0,
                error: "Failed to fetch full results",
                message: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }); 