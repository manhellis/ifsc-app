import { ObjectId } from "mongodb";
import { getDb } from "../db";
import { PodiumPrediction, PodiumScoreDetail } from "@shared/types/Prediction";
import { Document } from "mongodb";

// Define a union type for all prediction types
type Prediction = PodiumPrediction; // Add other prediction types to the union as they are created

// Get predictions collection
const getPredictionsCollection = () => {
    return getDb().collection<Prediction>("predictions");
};

// Create indices for efficient queries (run once during app initialization)
export const createPredictionIndices = async () => {
    const collection = getPredictionsCollection();
    await collection.createIndex({ leagueId: 1 });
    await collection.createIndex({ eventId: 1 });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ type: 1 });
};

// Create new prediction
export async function createPrediction(prediction: Omit<Prediction, "_id">) {
    const newId = new ObjectId();
    const result = await getPredictionsCollection().insertOne({
        ...prediction,
        _id: newId.toString(),
        event_finished: false,
        scoreDetails: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Prediction);

    return {
        acknowledged: result.acknowledged,
        predictionId: result.insertedId.toString(),
    };
}

// Get prediction by ID
export async function getPredictionById(
    id: string
): Promise<Prediction | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    return await getPredictionsCollection().findOne({ _id: id });
}

// Update prediction only if not locked
export async function updatePrediction(
    id: string,
    update: Partial<Prediction>
) {
    if (!ObjectId.isValid(id)) {
        return { acknowledged: false, matchedCount: 0, modifiedCount: 0 };
    }

    // Retrieve the current prediction to check lock status
    const currentPrediction = await getPredictionById(id);
    if (!currentPrediction) {
        throw new Error("Prediction not found.");
    }
    if (currentPrediction.locked) {
        throw new Error("Cannot update prediction; it is locked.");
    }

    const result = await getPredictionsCollection().updateOne(
        { _id: id },
        { $set: { ...update, updatedAt: new Date().toISOString() } }
    );

    return {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    };
}

// Delete prediction only if not locked
export async function deletePrediction(id: string) {
    if (!ObjectId.isValid(id)) {
        return { acknowledged: false, deletedCount: 0 };
    }

    // Retrieve the current prediction to check lock status
    const currentPrediction = await getPredictionById(id);
    if (!currentPrediction) {
        throw new Error("Prediction not found.");
    }
    if (currentPrediction.locked) {
        throw new Error("Cannot delete prediction; it is locked.");
    }

    const result = await getPredictionsCollection().deleteOne({ _id: id });

    return {
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
    };
}

// Lock a prediction
export async function lockPrediction(id: string) {
    if (!ObjectId.isValid(id)) {
        return { acknowledged: false, modifiedCount: 0 };
    }

    const result = await getPredictionsCollection().updateOne(
        { _id: id },
        { $set: { locked: true, updatedAt: new Date().toISOString() } }
    );

    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
    };
}

// Query predictions with filters (for example, by league, event, or user)
export async function getPredictionsByQuery(query: any, limit = 100, skip = 0) {
    return await getPredictionsCollection()
        .find(query)
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip(skip)
        .toArray();
}

// Query predictions with aggregation pipeline
export async function getPredictionsWithEvents(
    query: Document = {},
    limit = 20,
    skip = 0,
    sortField = "createdAt"
) {
    const pipeline: Document[] = [
        { $match: query },
        { $sort: { [sortField]: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $addFields: { eventIdInt: { $toInt: "$eventId" } } },
        // Convert athlete IDs to integers for lookup
        { 
            $addFields: { 
                firstAthleteInt: { $toInt: "$data.first" },
                secondAthleteInt: { $toInt: "$data.second" },
                thirdAthleteInt: { $toInt: "$data.third" }
            } 
        },
        // Lookup the event record by its eventIdInt
        {
            $lookup: {
                from: "events",
                localField: "eventIdInt",
                foreignField: "id",
                as: "event",
            },
        },
        // Lookup first athlete
        {
            $lookup: {
                from: "athletes",
                let: { athleteId: "$firstAthleteInt" },
                pipeline: [
                    { 
                        $match: { 
                            $expr: { 
                                $eq: ["$$athleteId", "$id"] 
                            } 
                        } 
                    },
                    { 
                        $project: { 
                            firstname: 1, 
                            lastname: 1,
                            _id: 0
                        }
                    }
                ],
                as: "firstAthlete",
            },
        },
        // Lookup second athlete
        {
            $lookup: {
                from: "athletes",
                let: { athleteId: "$secondAthleteInt" },
                pipeline: [
                    { 
                        $match: { 
                            $expr: { 
                                $eq: ["$$athleteId", "$id"] 
                            } 
                        } 
                    },
                    { 
                        $project: { 
                            firstname: 1, 
                            lastname: 1,
                            _id: 0
                        }
                    }
                ],
                as: "secondAthlete",
            },
        },
        // Lookup third athlete
        {
            $lookup: {
                from: "athletes",
                let: { athleteId: "$thirdAthleteInt" },
                pipeline: [
                    { 
                        $match: { 
                            $expr: { 
                                $eq: ["$$athleteId", "$id"] 
                            } 
                        } 
                    },
                    { 
                        $project: { 
                            firstname: 1, 
                            lastname: 1,
                            _id: 0
                        }
                    }
                ],
                as: "thirdAthlete",
            },
        },
        // Unwind to turn arrays into single docs
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$firstAthlete", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$secondAthlete", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$thirdAthlete", preserveNullAndEmptyArrays: true } },
        // Add event name to top level
        { 
            $addFields: { 
                eventName: "$event.name",
                // Add athlete names to the result - with null coalescing to handle missing data
                athletes: {
                    first: {
                        id: "$data.first",
                        firstname: { $ifNull: ["$firstAthlete.firstname", null] },
                        lastname: { $ifNull: ["$firstAthlete.lastname", null] }
                    },
                    second: {
                        id: "$data.second",
                        firstname: { $ifNull: ["$secondAthlete.firstname", null] },
                        lastname: { $ifNull: ["$secondAthlete.lastname", null] }
                    },
                    third: {
                        id: "$data.third",
                        firstname: { $ifNull: ["$thirdAthlete.firstname", null] },
                        lastname: { $ifNull: ["$thirdAthlete.lastname", null] }
                    }
                }
            } 
        },
        // Clean up so we don't return intermediate fields
        { 
            $project: { 
                eventIdInt: 0, 
                event: 0, 
                firstAthleteInt: 0,
                secondAthleteInt: 0,
                thirdAthleteInt: 0,
                firstAthlete: 0,
                secondAthlete: 0,
                thirdAthlete: 0
            } 
        },
    ];

    return await getPredictionsCollection().aggregate(pipeline).toArray();
}

// update only the scoreDetails and totalPoints + mark finished
export async function updatePredictionScoreDetails(
    predictionId: string,
    strategyKey: string, // e.g. 'podium'
    detail: PodiumScoreDetail & { categoryId?: string },
    categoryId?: string
) {
    if (!ObjectId.isValid(predictionId)) {
        throw new Error("Invalid prediction ID");
    }

    // If categoryId is provided, include it in the detail object first
    if (categoryId) {
        detail.categoryId = categoryId;
    }

    const updateDoc: any = {
        $set: {
            [`scoreDetails.${strategyKey}`]: detail,
            event_finished: true,
            updatedAt: new Date().toISOString()
        },
        $inc: { 
            totalPoints: detail.total 
        }
    };

    const result = await getPredictionsCollection().updateOne(
        { _id: predictionId },
        updateDoc
    );

    return {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount
    };
}
