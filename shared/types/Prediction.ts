// Define a type for the top 3 podium finishers
export interface Top3Podium {
    first: string; // Athlete ID predicted to finish 1st
    second: string; // Athlete ID predicted to finish 2nd
    third: string; // Athlete ID predicted to finish 3rd
}

// Prediction type for a user event prediction
export interface Prediction {
    _id?: string; // Unique identifier (optional before creation)
    cid: string; // Event or competition identifier
    athlete_id: string; // Athlete (user) ID associated with the prediction
    event_date: string; // Date of the event as an ISO-formatted string
    event_finished: boolean; // Flag indicating whether the event has been completed
    podium: Top3Podium; // User's selection for the top 3 podium finishers
    created_at?: string; // Timestamp of creation
    updated_at?: string; // Timestamp of last update
}
