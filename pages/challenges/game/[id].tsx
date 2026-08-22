import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface Game {
  id: string;
  title: string;
  category: string;
  image_url?: string | null;
}

interface DuelRow {
  id: string;
  game: string;
  status: string;
  entry_fee: number;
  scheduled_at: string | null;
  share_code: string;
}

interface TournamentRow {
  id: string;
  name: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  starts_at: string | null;
}

interface LeagueRow {
  id: string;
  name: string;
  status: string;
  entry_fee: number;
  max_players: number;
  starts_at: string | null;
}

export default function GameChallengesPage() {
  const router = useRouter();
  const { id } = router.query;

  const [game, setGame] = useState<Game | null>(null);
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (typeof id === 'string') fetchAll(id);
  }, [id]);

  const fetchAll = async (gameId: string) => {
    setLoading(true);
    const { data: gameData } = await supabase.from('games').select('id, title, category, image_url').eq('id', gameId).maybeSingle();
    if (!gameData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setGame(gameData);

    // Duels store the game as free text (not a game_id foreign key), so match by title.
    const [{ data: duelData }, { data: tournamentData }, { data: leagueData }] = await Promise.all([
      supabase
        .from('duels')
        .select('id, game, status, entry_fee, scheduled_at, share_code')
        .ilike('game', gameData.title)
        .is('player2_id', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('tournaments')
        .select('id, name, status, entry_fee, prize_pool, starts_at')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false }),
      supabase
        .from('leagues')
        .select('id, name, status, entry_fee, max_players, starts_at')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false }),
    ]);

    setDuels(duelData || []);
    setTournaments(tournamentData || []);
    setLeagues(leagueData || []);
    setLoading(false);
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px', background: '#0a0b14', minHeight: '100vh' }}>Loading…</div>;
  }

  if (notFound || !game) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Game not found.</p>
        <Link href="/challenges" style={{ color: 'var(--red)' }}>Back to Challenges</Link>
      </div>
    );
  }

  const totalCount = duels.length + tournaments.length + leagues.length;

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{game.title} Challenges | ApexDuel</title>
      </Head>

      <section
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          ...(game.image_url
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(10,11,20,0.4) 0%, rgba(10,11,20,0.92) 100%), url(${game.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
        }}
      >
        <Link href="/challenges" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← All Games
        </Link>
        <span
          className="mono"
          style={{ display: 'block', fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12 }}
        >
          {game.category}
        </span>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, textTransform: 'uppercase', margin: '8px 0' }}>
          {game.title} <span style={{ color: 'var(--red)' }}>Challenges</span>
        </h1>
        <p style={{ color: '#d8dae0', fontSize: 14, marginBottom: 20 }}>
          {totalCount} open challenge{totalCount === 1 ? '' : 's'} for this game right now
        </p>
        <Link
          href="/challenges/create"
          style={{
            background: 'var(--red)',
            color: '#fff',
            padding: '10px 22px',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            textDecoration: 'none',
            borderRadius: 4,
            display: 'inline-block',
          }}
        >
          + Create Challenge
        </Link>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 80px', display: 'flex', flexDirection: 'column', gap: 36 }}>
        <GameSection title="1v1 Duels">
          {duels.length === 0 ? (
            <EmptyRow text={`No open 1v1 matches for ${game.title} yet.`} />
          ) : (
            duels.map((d) => (
              <Link key={d.id} href={`/duel/${d.id}`} style={rowLinkStyle}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.game}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : 'Start time TBD'} · Code {d.share_code}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>${d.entry_fee}</div>
              </Link>
            ))
          )}
        </GameSection>

        <GameSection title="Tournaments">
          {tournaments.length === 0 ? (
            <EmptyRow text={`No tournaments for ${game.title} yet.`} />
          ) : (
            tournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`} style={rowLinkStyle}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                    {t.status} · {t.starts_at ? new Date(t.starts_at).toLocaleString() : 'Start time TBD'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{t.entry_fee > 0 ? `$${t.entry_fee}` : 'Free'}</div>
                  {t.prize_pool > 0 && <div style={{ fontSize: 11, color: '#29e7cd' }}>${t.prize_pool} prize</div>}
                </div>
              </Link>
            ))
          )}
        </GameSection>

        <GameSection title="Leagues">
          {leagues.length === 0 ? (
            <EmptyRow text={`No leagues for ${game.title} yet.`} />
          ) : (
            leagues.map((l) => (
              <Link key={l.id} href={`/leagues/${l.id}`} style={rowLinkStyle}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                    {l.status} · Up to {l.max_players} players
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{l.entry_fee > 0 ? `$${l.entry_fee}` : 'Free'}</div>
              </Link>
            ))
          )}
        </GameSection>
      </section>
    </div>
  );
}

function GameSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="display" style={{ fontSize: 20, marginBottom: 14, textTransform: 'uppercase' }}>
        {title}
      </h2>
      <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>{text}</div>;
}

const rowLinkStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
  borderBottom: '1px solid var(--panel-border)',
  textDecoration: 'none',
  color: '#fff',
};
