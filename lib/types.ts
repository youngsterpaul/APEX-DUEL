export interface Player {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string;
  wins: number;
  losses: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  balance: number;
  gender: string | null;
  is_admin: boolean;
}

export interface LedgerEntry {
  id: string;
  profile_id: string;
  entry_type: 'deposit' | 'withdrawal' | 'sale_proceeds' | 'purchase' | 'commission';
  amount: number;
  balance_after: number;
  listing_id: string | null;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  service_fee_pct: number;
  sale_commission_pct: number;
  updated_at: string;
}

export interface AccountListing {
  id: string;
  game_id: string;
  seller_id: string;
  in_game_username: string;
  rating: string;
  ranking: string;
  squad_strength: number | null;
  level: number | null;
  account_email: string | null;
  email_proof_photo: string | null;
  price: number;
  photos: string[];
  status: 'active' | 'sold' | 'removed';
  buyer_id: string | null;
  share_code: string;
  created_at: string;
  seller?: Profile;
}

export interface CartItem {
  id: string;
  buyer_id: string;
  listing_id: string;
  added_at: string;
  listing?: AccountListing;
}

export type DuelStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Duel {
  id: string;
  player1_id: string;
  player2_id: string | null;
  creator_id: string | null;
  game: string;
  status: DuelStatus;
  winner_id: string | null;
  entry_fee: number;
  scheduled_at: string | null;
  share_code: string;
  created_at: string;
  player1?: Profile;
  player2?: Profile;
}

export interface Tournament {
  id: string;
  game_id: string;
  name: string;
  format: 'round_robin' | 'elimination';
  created_by: string;
  entry_fee: number;
  prize_pool: number;
  payout_places: 1 | 2 | 3;
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  current_stage: number;
  share_code: string;
  created_at: string;
  game_title?: string;
}

export interface TournamentStage {
  tournament_id: string;
  stage_number: number;
  name: string;
  games_per_pairing: number;
  advance_count: number | null;
}

export interface TournamentParticipant {
  tournament_id: string;
  profile_id: string;
  username: string;
  eliminated: boolean;
  stage: number;
  wins: number;
  points: number;
  final_placement: number | null;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  stage_number: number;
  pairing_key: string;
  game_number: number;
  player_a: string | null;
  player_b: string | null;
  reported_a: string | null;
  reported_b: string | null;
  points_a: number | null;
  points_b: number | null;
  winner: string | null;
  status: 'pending' | 'completed' | 'disputed' | 'bye';
}

export interface League {
  id: string;
  game_id: string;
  name: string;
  created_by: string;
  status: 'open' | 'completed' | 'cancelled';
  share_code: string;
  created_at: string;
  game_title?: string;
}

export interface LeagueParticipant {
  league_id: string;
  profile_id: string;
  username: string;
  wins: number;
  losses: number;
  points: number;
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  player_a: string;
  player_b: string | null;
  reported_a: string | null;
  reported_b: string | null;
  winner: string | null;
  status: 'open' | 'pending' | 'completed' | 'disputed';
  created_at: string;
}