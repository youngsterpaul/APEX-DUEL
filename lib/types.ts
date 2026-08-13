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
}

export interface AccountListing {
  id: string;
  game_id: string;
  seller_id: string;
  in_game_username: string;
  rating: string;
  price: number;
  photos: string[];
  status: 'active' | 'sold' | 'removed';
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
  player2_id: string;
  game: string;
  status: DuelStatus;
  winner_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  player1?: { username: string };
  player2?: { username: string };
}