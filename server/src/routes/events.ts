import { Elysia } from "elysia";
import {
    getAllEvents,
    getEventById,
    getEventByNumericId,
    getEventsByQuery,
    createEvent,
    updateEvent,
    deleteEvent,
    getUpcomingEvents, // Import the new function
    fetchEventNameById,
} from "../models/events";
import { ensureAuth } from "src/services/auth";
import { AccountType } from "../../../shared/types/userTypes";

// Events routes
export const eventsRoutes = new Elysia({ prefix: "/events" })
    .use(ensureAuth())
    // Get all events with pagination
    .get("/", async ({ query, set }: { query: any; set: any }) => {
        try {
            // Parse pagination parameters
            const limit = query.limit ? parseInt(query.limit) : 100;
            const skip = query.skip ? parseInt(query.skip) : 0;

            // Get events from database
            const events = await getAllEvents(limit, skip);
            return { events, count: events.length };
        } catch (error) {
            console.error("Error fetching events:", error);
            set.status = 500;
            return { error: "Failed to fetch events" };
        }
    })

    // Get event by ID
    .get(
        "/:id",
        async ({ params, set }: { params: { id: string }; set: any }) => {
            try {
                // Try to parse as numeric ID first
                const numericId = parseInt(params.id);
                let event = null;

                if (!isNaN(numericId)) {
                    event = await getEventByNumericId(numericId);
                }

                // If not found by numeric ID, try ObjectId
                if (!event) {
                    event = await getEventById(params.id);
                }

                if (!event) {
                    set.status = 404;
                    return { error: "Event not found" };
                }

                return { event };
            } catch (error) {
                console.error("Error fetching event:", error);
                set.status = 500;
                return { error: "Failed to fetch event" };
            }
        }
    )

    // Query events
    .post("/query", async ({ body, set }: { body: any; set: any }) => {
        try {
            // Validate request body
            if (!body || typeof body !== "object") {
                set.status = 400;
                return { error: "Invalid request body" };
            }

            // Extract query and pagination parameters
            const { query = {}, limit = 100, skip = 0 } = body;

            // Get events matching query
            const events = await getEventsByQuery(query, limit, skip);
            return { events, count: events.length };
        } catch (error) {
            console.error("Error querying events:", error);
            set.status = 500;
            return { error: "Failed to query events" };
        }
    })
    
    // Lock event (admin only)
    .put(
        "/:id/lock",
        async ({
            params,
            set,
            user,
        }: { params: { id: string }; set: any; user: any }) => {
            try {
                // Check if user has admin rights
                if (user.accountType !== AccountType.ADMIN) {
                    set.status = 403;
                    console.log(`Non-admin event lock attempt: User ${user.userId} tried to lock event ${params.id}`);
                    return { error: "Only administrators can lock events" };
                }

                // Get existing event to confirm it exists
                const event = await getEventById(params.id);
                if (!event) {
                    set.status = 404;
                    console.log(`Lock failed: Event ${params.id} not found`);
                    return { error: "Event not found" };
                }

                // Lock the event
                const result = await updateEvent(params.id, { locked: true });

                if (result.acknowledged && result.modifiedCount > 0) {
                    console.log(`Event ${params.id} locked successfully by admin ${user.userId}`);
                    return {
                        success: true,
                        message: "Event locked successfully",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to lock event ${params.id}`);
                    return { error: "Failed to lock event" };
                }
            } catch (error) {
                console.error(`Error locking event ${params.id}:`, error);
                set.status = 500;
                return {
                    error: "Failed to lock event",
                    details: String(error),
                };
            }
        }
    )

    // Unlock event (admin only)
    .put(
        "/:id/unlock",
        async ({
            params,
            set,
            user,
        }: { params: { id: string }; set: any; user: any }) => {
            try {
                // Check if user has admin rights
                if (user.accountType !== AccountType.ADMIN) {
                    set.status = 403;
                    console.log(`Non-admin event unlock attempt: User ${user.userId} tried to unlock event ${params.id}`);
                    return { error: "Only administrators can unlock events" };
                }

                // Get existing event to confirm it exists
                const event = await getEventById(params.id);
                if (!event) {
                    set.status = 404;
                    console.log(`Unlock failed: Event ${params.id} not found`);
                    return { error: "Event not found" };
                }

                // Unlock the event
                const result = await updateEvent(params.id, { locked: false });

                if (result.acknowledged && result.modifiedCount > 0) {
                    console.log(`Event ${params.id} unlocked successfully by admin ${user.userId}`);
                    return {
                        success: true,
                        message: "Event unlocked successfully",
                    };
                } else {
                    set.status = 500;
                    console.error(`Failed to unlock event ${params.id}`);
                    return { error: "Failed to unlock event" };
                }
            } catch (error) {
                console.error(`Error unlocking event ${params.id}:`, error);
                set.status = 500;
                return {
                    error: "Failed to unlock event",
                    details: String(error),
                };
            }
        }
    )

    // Get upcoming events with pagination
    .get("/upcoming", async ({ query, set }: { query: any; set: any }) => {
        try {
            // Parse pagination parameters
            const limit = query.limit ? parseInt(query.limit) : 100;
            const skip = query.skip ? parseInt(query.skip) : 0;

            // Get upcoming events from the model
            const events = await getUpcomingEvents(limit, skip);
            return { events, count: events.length };
        } catch (error) {
            console.error("Error fetching upcoming events:", error);
            set.status = 500;
            return { error: "Failed to fetch upcoming events" };
        }
    })
    
    // Get event name by ID
    .get("/name/:id", async ({ params, set }: { params: { id: string }; set: any }) => {
        try {
            const id = parseInt(params.id);
            
            if (isNaN(id)) {
                set.status = 400;
                return { error: "Invalid ID format. Numeric ID required" };
            }
            
            const eventName = await fetchEventNameById(id);
            
            if (!eventName) {
                set.status = 404;
                return { error: "Event not found" };
            }
            
            return { name: eventName };
        } catch (error) {
            console.error("Error fetching event name:", error);
            set.status = 500;
            return { error: "Failed to fetch event name" };
        }
    });
