import { supabase } from './supabaseClient';

const FINISHED_STATUSES = ['completed', 'cancelled', 'ended', 'finished'];

export interface ActiveDuel {
  kind: 'duel';
  id: string;
  game: string;
  status: string;
  scheduled_at: string | null;
  share_code: string | null;
}

export interface ActiveTournament {
  kind: 'tournament';
  id: string;
  name: string;
  status: string;
  starts_at: string | null;
  share_code: string | null;
}

export interface ActiveLeague {
  kind: 'league';
  id: string;
  name: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  share_code: string | null;
  group_link: string | null;
  is_creator: boolean;
}

export type ActiveItem = ActiveDuel | ActiveTournament | ActiveLeague;

export async function getActiveChallenges(): Promise<ActiveItem[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const uid = session.user.id;

  const [{ data: duels }, { data: tParticipants }, { data: lParticipants }] = await Promise.all([
    supabase.from('duels').select('*').or(`player1_id.eq.${uid},player2_id.eq.${uid}`),
    supabase.from('tournament_participants').select('*, tournaments(*)').eq('profile_id', uid),
    supabase.from('league_participants').select('*, leagues(*)').eq('profile_id', uid),
  ]);

  const items: ActiveItem[] = [];

  (duels || []).forEach((d: any) => {
    if (!FINISHED_STATUSES.includes((d.status || '').toLowerCase())) {
      items.push({
        kind: 'duel',
        id: d.id,
        game: d.game,
        status: d.status,
        scheduled_at: d.scheduled_at,
        share_code: d.share_code,
      });
    }
  });

  (tParticipants || []).forEach((p: any) => {
    const t = p.tournaments;
    if (t && !FINISHED_STATUSES.includes((t.status || '').toLowerCase())) {
      items.push({
        kind: 'tournament',
        id: t.id,
        name: t.name,
        status: t.status,
        starts_at: t.starts_at,
        share_code: t.share_code,
      });
    }
  });

  (lParticipants || []).forEach((p: any) => {
    const l = p.leagues;
    if (l && !FINISHED_STATUSES.includes((l.status || '').toLowerCase())) {
      items.push({
        kind: 'league',
        id: l.id,
        name: l.name,
        status: l.status,
        starts_at: l.starts_at,
        ends_at: l.ends_at,
        share_code: l.share_code,
        group_link: l.group_link,
        is_creator: l.created_by === uid,
      });
    }
  });

  return items;
}