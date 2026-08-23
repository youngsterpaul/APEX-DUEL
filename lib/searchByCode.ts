import { supabase } from './supabaseClient';

export type CodeMatch =
  | { kind: 'listing'; id: string; label: string }
  | { kind: 'duel'; id: string; label: string }
  | { kind: 'tournament'; id: string; label: string }
  | { kind: 'league'; id: string; label: string };

/**
 * Looks up a share/join code across account listings, 1v1 matches,
 * tournaments, and leagues. Returns the first match found, or null.
 */
export async function findByCode(raw: string): Promise<CodeMatch | null> {
  const code = raw.trim().toUpperCase();
  if (!code) return null;

  const [listing, duel, tournament, league] = await Promise.all([
    supabase.from('account_listings').select('id, in_game_username').eq('share_code', code).maybeSingle(),
    supabase.from('duels').select('id, game').eq('share_code', code).maybeSingle(),
    supabase.from('tournaments').select('id, name').eq('share_code', code).maybeSingle(),
    supabase.from('leagues').select('id, name').eq('share_code', code).maybeSingle(),
  ]);

  if (listing.data) return { kind: 'listing', id: listing.data.id, label: listing.data.in_game_username };
  if (duel.data) return { kind: 'duel', id: duel.data.id, label: duel.data.game };
  if (tournament.data) return { kind: 'tournament', id: tournament.data.id, label: tournament.data.name };
  if (league.data) return { kind: 'league', id: league.data.id, label: league.data.name };
  return null;
}

/** Best available page to send the user to for a given match. */
export function codeMatchHref(match: CodeMatch): string {
  switch (match.kind) {
    case 'listing':
      return `/markets/${match.id}`;
    case 'duel':
      return `/duel/${match.id}`;
    case 'tournament':
      return `/tournaments/${match.id}`;
    case 'league':
      return `/leagues/${match.id}`;
    default:
      return '/challenges';
  }
}