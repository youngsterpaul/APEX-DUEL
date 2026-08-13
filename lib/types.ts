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