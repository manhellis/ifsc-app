// Define a type for the top 3 podium finishers
export interface Top3Podium {
    first: string; // Athlete ID predicted to finish 1st
    second: string; // Athlete ID predicted to finish 2nd
    third: string; // Athlete ID predicted to finish 3rd
}

export interface BasePrediction {
    _id?: string;
    leagueId: string;
    eventId: string;
    categoryName: string;
    categoryId: string;
    userId: string;
    type: string; // e.g. "podium" | "time" | "margin" | …
    points?: number;
    locked: boolean;
    event_finished: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface PodiumPrediction extends BasePrediction {
    type: "podium";
    data: Top3Podium;
}
