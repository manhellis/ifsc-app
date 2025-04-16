import { Elysia } from "elysia";
import { getRegistrationActive } from "src/models/upcoming";

export const upcomingEvents = new Elysia().get(
    "/:id/:cid",
    async ({
        params,
        set,
    }: {
        params: { id: number; cid: number };
        set: any;
    }) => {
        try {
            const events = await getRegistrationActive(params.id, params.cid);
            return events;
        } catch (error) {
            console.error("Error fetching registration active events:", error);
            set.status = 500;
            return { error: "Failed to fetch registration active events" };
        }
    }
);
