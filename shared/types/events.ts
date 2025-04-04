export interface PublicInformation {
  infosheet_url?: string;
  additional_info_url?: string;
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
  registration_url?: string;
  public_information: PublicInformation;
  d_cats: string[];
  dcats: string[];
  computed_combined_categories: any[];
  team_ranking_disciplines: string[];
  team_ranking_url?: string;
} 