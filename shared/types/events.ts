export interface PublicInformation {
  infosheet_url?: string;
  additional_info_url?: string;
}

export interface Dcat {
  dcat_id: number;
  event_id: number;
  dcat_name: string;
  discipline_kind: string;
  category_name: string;
  status: string;
  status_as_of: string;
  ranking_as_of: string;
  category_rounds: CategoryRound[]; 
  full_results_url: string;
  top_3_results: any[]; // Adjust type if more detail is known
}

export interface CategoryRound {
  category_round_id: number;
  kind: string;
  name: string;
  category: string;
  schedule: string | null;
  status: string;
  status_as_of: string;
  result_url: string;
  starting_groups: any[]; // Adjust type if more detail is known
  combined_stages: any[]; // Adjust type if more detail is known
  format: string;
  routes: any[]; // Adjust type if more detail is known
}

export interface Event {
  _id: string;
  id: number;
  name: string;
  league_id: number | string;
  league_season_id: number | string;
  season_id: number | string;
  starts_at: string;
  ends_at: string;
  local_start_date: string;
  local_end_date: string;
  timezone: string | null;
  location: string;
  locked: boolean;
  registration_url?: string;
  public_information: PublicInformation;
  d_cats: string[];
  dcats: Dcat[];
  computed_combined_categories: any[];
  team_ranking_disciplines: string[];
  team_ranking_url?: string;
}