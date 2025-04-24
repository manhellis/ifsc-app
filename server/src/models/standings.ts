import { ObjectId } from "mongodb";
import { getDb } from "../db";

// Interface for standing document
interface Standing {
    _id?: string;
    leagueId: string;
    userId: string;
    totalPoints: number;
    eventHistory: Array<{
        eventId: string;
        points: number;
        timestamp: string;
        categoryId?: string;
        categoryName?: string;
    }>;
    lastUpdated: string;
}

// Interface for updateStanding params
interface UpdateStandingParams {
    leagueId: string;
    userId: string;
    eventId: string;
    eventPoints: number;
    categoryId?: string;
    categoryName?: string;
}

// Get standings collection
const getStandingsCollection = () => {
    return getDb("ifsc-data").collection<Standing>("standings");
};

// Create indices for efficient queries (run once during app initialization)
export const createStandingIndices = async () => {
    const collection = getStandingsCollection();
    await collection.createIndex({ leagueId: 1 });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ leagueId: 1, userId: 1 }, { unique: true });
};

// Update or create a standing document for a user in a league
export async function updateStanding({
    leagueId,
    userId,
    eventId,
    eventPoints,
    categoryId,
    categoryName
}: UpdateStandingParams) {
    if (!leagueId || !userId || !eventId) {
        throw new Error("Missing required parameters for updating standings");
    }

    const timestamp = new Date().toISOString();
    
    // Check if user already has a standing for this event and category
    const existingStanding = await getStandingsCollection().findOne({ 
        leagueId, 
        userId,
        "eventHistory": { 
            $elemMatch: { 
                eventId,
                ...(categoryId ? { categoryId } : {})
            } 
        }
    });

    if (existingStanding) {
        // Find the existing entry to calculate point difference
        const existingEntry = existingStanding.eventHistory.find(
            entry => entry.eventId === eventId && 
                   (!categoryId || entry.categoryId === categoryId)
        );
        
        if (existingEntry) {
            // Calculate point difference for the update
            const pointDifference = eventPoints - existingEntry.points;
            
            // Update the existing entry's points
            return await getStandingsCollection().updateOne(
                { 
                    leagueId, 
                    userId, 
                    "eventHistory.eventId": eventId,
                    ...(categoryId ? { "eventHistory.categoryId": categoryId } : {})
                },
                {
                    $inc: { totalPoints: pointDifference },
                    $set: { 
                        "eventHistory.$.points": eventPoints,
                        "eventHistory.$.timestamp": timestamp,
                        lastUpdated: timestamp
                    }
                }
            );
        }
    }
    
    // If no existing entry found, add a new one
    // Create event history entry
    const historyEntry: any = {
        eventId,
        points: eventPoints,
        timestamp
    };
    
    // Add category information if provided
    if (categoryId) {
        historyEntry.categoryId = categoryId;
    }
    
    if (categoryName) {
        historyEntry.categoryName = categoryName;
    }
    
    // Use upsert to create if not exists
    const result = await getStandingsCollection().updateOne(
        { leagueId, userId },
        {
            $inc: { totalPoints: eventPoints },
            $push: {
                eventHistory: historyEntry
            },
            $set: { lastUpdated: timestamp },
            $setOnInsert: {
                _id: new ObjectId().toString(),
                createdAt: timestamp
            }
        },
        { upsert: true }
    );

    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId
    };
}

// Get standings for a league
export async function getLeagueStandings(leagueId: string) {
    return await getStandingsCollection()
        .find({ leagueId })
        .sort({ totalPoints: -1 })
        .toArray();
}

// Get standing for a specific user in a league
export async function getUserStanding(leagueId: string, userId: string) {
    return await getStandingsCollection().findOne({ leagueId, userId });
}

// Get standings for a league with pagination and count option
export async function getStandingsByLeagueId(
    leagueId: string, 
    options?: { 
        limit?: number; 
        offset?: number;
        countOnly?: boolean;
    }
): Promise<Standing[] | number> {
    const { limit = 100, offset = 0, countOnly = false } = options || {};
    
    if (countOnly) {
        return await getStandingsCollection().countDocuments({ leagueId });
    }
    
    return await getStandingsCollection()
        .find({ leagueId })
        .sort({ totalPoints: -1, lastUpdated: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
} 