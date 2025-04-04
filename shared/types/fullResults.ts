export interface RankingEntry {
  place: number;
  athlete_id: string;
  name: string;
  country: string;
  score: number | null;
}

export interface CategoryRound {
  category: string;
  round: string;
  date: string;
  results: any[]; // You may want to define a more specific type
}

export interface FullResult {
  _id: string;
  event: string; // This links to the event name in the events collection
  dcat: string;
  status: string;
  status_as_of: string; // Timestamp
  ranking_as_of: string; // Timestamp
  category_rounds: CategoryRound[];
  ranking: RankingEntry[];
} 