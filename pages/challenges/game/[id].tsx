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
  player1_id: string;
}

interface TournamentRow {
  id: string;
  name: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  starts_at: string | null;
  max_players?: number | null;
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

  const [session, setSession] = useState<any>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [joinedTournamentIds, setJoinedTournamentIds] = useState<Set<string>>(new Set());
  const [joinedLeagueIds, setJoinedLeagueIds] = useState<Set<string>>(new Set());
  const [tournamentCounts, setTournamentCounts] = useState<Record<string, number>>({});
  const [leagueCounts, setLeagueCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New states for Code Join & Sharing
  const [inputCode, setInputCode] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

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

    const {
      data: { session: sess },
    } = await supabase.auth.getSession();

    const [{ data: duelData }, { data: tournamentData }, { data: leagueData }] = await Promise.all([
      supabase
        .from('duels')
        .select('id, game, status, entry_fee, scheduled_at, share_code, player1_id')
        .ilike('game', gameData.title)
        .is('player2_id', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('tournaments')
        .select('id, name, status, entry_fee, prize_pool, starts_at, max_players')
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

    const tIds = (tournamentData || []).map((t) => t.id);
    const lIds = (leagueData || []).map((l) => l.id);

    const [{ data: allTournamentParticipants }, { data: allLeagueParticipants }] = await Promise.all([
      tIds.length > 0 ? supabase.from('tournament_participants').select('tournament_id').in('tournament_id', tIds) : Promise.resolve({ data: [] as any[] }),
      lIds.length > 0 ? supabase.from('league_participants').select('league_id').in('league_id', lIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const tCounts: Record<string, number> = {};
    (allTournamentParticipants || []).forEach((r: any) => {
      tCounts[r.tournament_id] = (tCounts[r.tournament_id] || 0) + 1;
    });
    const lCounts: Record<string, number> = {};
    (allLeagueParticipants || []).forEach((r: any) => {
      lCounts[r.league_id] = (lCounts[r.league_id] || 0) + 1;
    });
    setTournamentCounts(tCounts);
    setLeagueCounts(lCounts);

    if (sess) {
      const [{ data: myTournaments }, { data: myLeagues }] = await Promise.all([
        tIds.length > 0
          ? supabase.from('tournament_participants').select('tournament_id').eq('profile_id', sess.user.id).in('tournament_id', tIds)
          : Promise.resolve({ data: [] as any[] }),
        lIds.length > 0
          ? supabase.from('league_participants').select('league_id').eq('profile_id', sess.user.id).in('league_id', lIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setJoinedTournamentIds(new Set((myTournaments || []).map((r: any) => r.tournament_id)));
      setJoinedLeagueIds(new Set((myLeagues || []).map((r: any) => r.league_id)));
    } else {
      setJoinedTournamentIds(new Set());
      setJoinedLeagueIds(new Set());
    }

    setLoading(false);
  };

  const requireLogin = () => {
    setMessage({ type: 'error', text: 'Please sign in to join.' });
  };

  const handleJoinDuel = async (duelId: string) => {
    if (!session) return requireLogin();
    setBusyId(duelId);
    setMessage(null);
    const { error } = await supabase.rpc('join_duel', { p_duel_id: duelId });
    setBusyId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    router.push(`/duel/${duelId}`);
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return requireLogin();
    const cleanedCode = inputCode.trim().toUpperCase();
    if (!cleanedCode) {
      setMessage({ type: 'error', text: 'Please enter a valid match code.' });
      return;
    }

    setJoiningByCode(true);
    setMessage(null);

    // Fetch duel by share code
    const { data: duelData, error } = await supabase
      .from('duels')
      .select('id, player1_id')
      .eq('share_code', cleanedCode)
      .maybeSingle();

    if (error || !duelData) {
      setJoiningByCode(false);
      setMessage({ type: 'error', text: 'Match code not found or invalid.' });
      return;
    }

    if (duelData.player1_id === session.user.id) {
      setJoiningByCode(false);
      router.push(`/duel/${duelData.id}`);
      return;
    }

    // Join match via RPC
    const { error: joinErr } = await supabase.rpc('join_duel', { p_duel_id: duelData.id });
    setJoiningByCode(false);

    if (joinErr) {
      setMessage({ type: 'error', text: joinErr.message });
      return;
    }

    router.push(`/duel/${duelData.id}`);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!session) return requireLogin();
    setBusyId(tournamentId);
    setMessage(null);
    const { error } = await supabase.rpc('register_for_tournament', { p_tournament_id: tournamentId });
    setBusyId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: "You're registered!" });
    if (typeof id === 'string') fetchAll(id);
  };

  const handleJoinLeague = async (leagueId: string) => {
    if (!session) return requireLogin();
    setBusyId(leagueId);
    setMessage(null);
    const { error } = await supabase.rpc('join_league', { p_league_id: leagueId });
    setBusyId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: "You're in!" });
    if (typeof id === 'string') fetchAll(id);
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
        {message && (
          <div
            style={{
              padding: 10,
              borderRadius: 4,
              fontSize: 13,
              textAlign: 'center',
              background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
              color: message.type === 'success' ? '#00ff64' : '#ff4444',
              border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}`,
            }}
          >
            {message.text}
          </div>
        )}

        {/* Quick Join Code & Share Link Section */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Enter Code Box */}
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
              <input
                type="text"
                placeholder="Enter Match Code (e.g. X7K29P)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0a0b14',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: 4,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              />
              <button
                type="submit"
                disabled={joiningByCode}
                style={{
                  background: 'var(--red)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {joiningByCode ? 'Joining…' : 'Join Match'}
              </button>
            </form>

            {/* Share Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: copiedLink ? '#00ff64' : 'transparent',
                color: copiedLink ? '#000' : '#fff',
                border: `1px solid ${copiedLink ? '#00ff64' : 'var(--panel-border)'}`,
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {copiedLink ? '✓ Link Copied!' : '🔗 Share Page Link'}
            </button>

          </div>
        </div>

        <GameSection title="1v1 Duels">
          {duels.length === 0 ? (
            <EmptyRow text={`No open 1v1 matches for ${game.title} yet.`} />
          ) : (
            duels.map((d) => {
              const isOwn = session && d.player1_id === session.user.id;
              return (
                <div key={d.id} style={rowStyle}>
                  <Link href={`/duel/${d.id}`} style={rowInfoLinkStyle}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.game}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : 'Start time TBD'} · Code {d.share_code} · ${d.entry_fee} entry
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link href={`/duel/${d.id}`} style={viewBtnStyle}>
                      View
                    </Link>
                    {isOwn ? (
                      <span style={{ ...joinBtnStyle, opacity: 0.5, cursor: 'default' }}>Your Match</span>
                    ) : (
                      <button onClick={() => handleJoinDuel(d.id)} disabled={busyId === d.id} style={joinBtnStyle}>
                        {busyId === d.id ? '…' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </GameSection>

        <GameSection title="Tournaments">
          {tournaments.length === 0 ? (
            <EmptyRow text={`No tournaments for ${game.title} yet.`} />
          ) : (
            tournaments.map((t) => {
              const joined = joinedTournamentIds.has(t.id);
              const count = tournamentCounts[t.id] || 0;
              const full = t.max_players != null && count >= t.max_players;
              const canJoin = t.status === 'registration' && !joined && !full;
              return (
                <div key={t.id} style={rowStyle}>
                  <Link href={`/tournaments/${t.id}`} style={rowInfoLinkStyle}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                      {t.status} · {t.starts_at ? new Date(t.starts_at).toLocaleString() : 'Start time TBD'} ·{' '}
                      {t.entry_fee > 0 ? `$${t.entry_fee}` : 'Free'}
                      {t.prize_pool > 0 && ` · $${t.prize_pool} prize`}
                      {t.max_players != null && ` · ${count}/${t.max_players} players`}
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link href={`/tournaments/${t.id}`} style={viewBtnStyle}>
                      View
                    </Link>
                    {joined ? (
                      <span style={{ ...joinBtnStyle, opacity: 0.5, cursor: 'default' }}>Joined</span>
                    ) : (
                      <button onClick={() => handleJoinTournament(t.id)} disabled={!canJoin || busyId === t.id} style={joinBtnStyle}>
                        {busyId === t.id ? '…' : full ? 'Full' : canJoin ? 'Join' : 'Closed'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </GameSection>

        <GameSection title="Leagues">
          {leagues.length === 0 ? (
            <EmptyRow text={`No leagues for ${game.title} yet.`} />
          ) : (
            leagues.map((l) => {
              const joined = joinedLeagueIds.has(l.id);
              const count = leagueCounts[l.id] || 0;
              const full = count >= l.max_players;
              const canJoin = l.status === 'open' && !joined && !full;
              return (
                <div key={l.id} style={rowStyle}>
                  <Link href={`/leagues/${l.id}`} style={rowInfoLinkStyle}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                      {l.status} · {count}/{l.max_players} players · {l.entry_fee > 0 ? `$${l.entry_fee}` : 'Free'}
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link href={`/leagues/${l.id}`} style={viewBtnStyle}>
                      View
                    </Link>
                    {joined ? (
                      <span style={{ ...joinBtnStyle, opacity: 0.5, cursor: 'default' }}>Joined</span>
                    ) : (
                      <button onClick={() => handleJoinLeague(l.id)} disabled={!canJoin || busyId === l.id} style={joinBtnStyle}>
                        {busyId === l.id ? '…' : full ? 'Full' : canJoin ? 'Join' : 'Closed'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
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

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderBottom: '1px solid var(--panel-border)',
  flexWrap: 'wrap',
};

const rowInfoLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: '#fff',
  flex: 1,
  minWidth: 180,
};

const viewBtnStyle: React.CSSProperties = {
  border: '1px solid var(--panel-border)',
  color: '#fff',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  borderRadius: 4,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const joinBtnStyle: React.CSSProperties = {
  border: '1px solid var(--red)',
  background: 'var(--red)',
  color: '#fff',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  borderRadius: 4,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};