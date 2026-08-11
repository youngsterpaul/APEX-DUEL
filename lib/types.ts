export interface Player {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string;
  wins: number;
  losses: number;
  created_at: string;
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
  // Joined fields (present when selecting with player1:player1_id(username) etc.)
  player1?: { username: string };
  player2?: { username: string };
}