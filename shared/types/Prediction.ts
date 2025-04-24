// 1) Your raw podium‐pick shape
export interface Top3Podium {
    first: string; // Athlete ID predicted to finish 1st
    second: string; // Athlete ID predicted to finish 2nd
    third: string; // Athlete ID predicted to finish 3rd
}

// 2) Per‐place points breakdown
export interface PointsByPlace {
    first: number;
    second: number;
    third: number;
}

// 3) The score detail for a single "podium" run
export interface PodiumScoreDetail {
    calculatedAt: string; // ISO timestamp
    pointsByPlace: PointsByPlace;
    total: number; // sum of the three slots
}

// 4) Map of all strategy results on one prediction
export interface ScoreDetails {
    podium: PodiumScoreDetail;
    [strategyType: string]: PodiumScoreDetail; // for future types
}

// 5) Generic base prediction
export interface BasePrediction<TData = any> {
    _id?: string;
    leagueId: string;
    eventId: string;
    categoryName: string;
    categoryId: string;
    userId: string;
    type: string; // "podium" | "top5" | "timeDelta" | …
    data: TData; // your raw guess payload
    scoreDetails?: ScoreDetails; // breakdown per strategy
    totalPoints?: number; // sum of all strategy totals
    locked: boolean;
    event_finished: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// 6) Fully‐typed podium prediction
export interface PodiumPrediction extends BasePrediction<Top3Podium> {
    type: "podium";
    data: Top3Podium;
}
