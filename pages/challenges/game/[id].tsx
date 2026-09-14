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

interface MarketListing {
  id: string;
  title: string;
  price: number;
  image_url?: string | null;
  status: string;
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

const PAGE_SIZE = 5;

export default function SingleGameHubPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState<any>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);

  // Pagination states for each section
  const [marketPage, setMarketPage] = useState(0);
  const [duelPage, setDuelPage] = useState(0);
  const [tournamentPage, setTournamentPage] = useState(0);
  const [leaguePage, setLeaguePage] = useState(0);
  
  const [joinedTournamentIds, setJoinedTournamentIds] = useState<Set<string>>(new Set());
  const [joinedLeagueIds, setJoinedLeagueIds] = useState<Set<string>>(new Set());
  const [tournamentCounts, setTournamentCounts] = useState<Record<string, number>>({});
  const [leagueCounts, setLeagueCounts] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [inputCode, setInputCode] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (typeof id === 'string') fetchAll(id);
  }, [id]);

  const fetchAll = async (gameId: string) => {
    setLoading(true);
    const { data: gameData } = await supabase
      .from('games')
      .select('id, title, category, image_url')
      .eq('id', gameId)
      .maybeSingle();

    if (!gameData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setGame(gameData);

    const { data: { session: sess } } = await supabase.auth.getSession();

    const [
      { data: marketData },
      { data: duelData },
      { data: tournamentData },
      { data: leagueData }
    ] = await Promise.all([
      supabase
        .from('market_listings')
        .select('id, title, price, image_url, status')
        .eq('game_id', gameId)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
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

    setMarketListings(marketData || []);
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
    }

    setLoading(false);
  };

  const requireLogin = () => setMessage({ type: 'error', text: 'Please sign in to join.' });

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
    if (!cleanedCode) return setMessage({ type: 'error', text: 'Please enter a valid match code.' });

    setJoiningByCode(true);
    setMessage(null);

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

    const { error: joinErr } = await supabase.rpc('join_duel', { p_duel_id: duelData.id });
    setJoiningByCode(false);

    if (joinErr) {
      setMessage({ type: 'error', text: joinErr.message });
      return;
    }
    router.push(`/duel/${duelData.id}`);
  };

  const copyToClipboard = (textToCopy: string, itemId: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px', background: '#0a0b14', minHeight: '100vh' }}>Loading...</div>;
  }

  if (notFound || !game) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Game not found.</p>
        <Link href="/challenges" style={{ color: 'var(--red)' }}>Back to Challenges</Link>
      </div>
    );
  }

  const totalChallenges = duels.length + tournaments.length + leagues.length;

  // Sliced datasets for 5 items per page
  const visibleMarketListings = marketListings.slice(marketPage * PAGE_SIZE, (marketPage + 1) * PAGE_SIZE);
  const visibleDuels = duels.slice(duelPage * PAGE_SIZE, (duelPage + 1) * PAGE_SIZE);
  const visibleTournaments = tournaments.slice(tournamentPage * PAGE_SIZE, (tournamentPage + 1) * PAGE_SIZE);
  const visibleLeagues = leagues.slice(leaguePage * PAGE_SIZE, (leaguePage + 1) * PAGE_SIZE);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{game.title} Hub | ApexDuel</title>
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
          {game.title} <span style={{ color: 'var(--red)' }}>Hub</span>
        </h1>
        <p style={{ color: '#d8dae0', fontSize: 14, marginBottom: 20 }}>
          {totalChallenges} Active Challenge{totalChallenges === 1 ? '' : 's'} · {marketListings.length} Marketplace Accounts Listed
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/challenges/create" style={actionHeaderBtnStyle}>
            + Create Challenge
          </Link>
          <Link href={`/markets/game/${game.id}`} style={{ ...actionHeaderBtnStyle, background: 'transparent', border: '1px solid var(--red)' }}>
            🛒 View Game Marketplace
          </Link>
        </div>
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

        {/* Enter Code Join Bar */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16 }}>
          <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Paste or type Match Code (e.g. X7K29P)"
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
              }}
            />
            <button type="submit" disabled={joiningByCode} style={codeJoinBtnStyle}>
              {joiningByCode ? 'Joining…' : 'Join via Code'}
            </button>
          </form>
        </div>

        {/* Marketplace Accounts for this Game */}
        <GameSection
          title={`Marketplace Accounts (${marketListings.length})`}
          currentPage={marketPage}
          totalItems={marketListings.length}
          onPrev={() => setMarketPage((prev) => Math.max(prev - 1, 0))}
          onNext={() => setMarketPage((prev) => prev + 1)}
        >
          {visibleMarketListings.length === 0 ? (
            <EmptyRow text={`No accounts on sale for ${game.title} right now.`} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, padding: 16 }}>
              {visibleMarketListings.map((item) => (
                <Link key={item.id} href={`/markets/${item.id}`} style={marketCardStyle}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginTop: 8 }}>{item.title}</div>
                  <div style={{ color: '#00ff64', fontWeight: 800, fontSize: 15, marginTop: 4 }}>${item.price}</div>
                  <span style={marketViewBtnStyle}>View Account Listing</span>
                </Link>
              ))}
            </div>
          )}
        </GameSection>

        {/* 1v1 Duels */}
        <GameSection
          title={`1v1 Duels (${duels.length})`}
          currentPage={duelPage}
          totalItems={duels.length}
          onPrev={() => setDuelPage((prev) => Math.max(prev - 1, 0))}
          onNext={() => setDuelPage((prev) => prev + 1)}
        >
          {visibleDuels.length === 0 ? (
            <EmptyRow text={`No open 1v1 matches for ${game.title} yet.`} />
          ) : (
            visibleDuels.map((d) => {
              const isOwn = session && d.player1_id === session.user.id;
              const directLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/duel/${d.id}`;
              const codeCopied = copiedId === `code-${d.id}`;
              const linkCopied = copiedId === `link-${d.id}`;

              return (
                <div key={d.id} style={rowStyle}>
                  <Link href={`/duel/${d.id}`} style={rowInfoLinkStyle}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{d.game}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : 'Start time TBD'} · Code <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{d.share_code}</span> · ${d.entry_fee} entry
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button onClick={() => copyToClipboard(d.share_code, `code-${d.id}`)} style={{ ...actionBtnStyle, background: codeCopied ? '#00ff64' : 'transparent', color: codeCopied ? '#000' : '#fff' }}>
                      {codeCopied ? 'Code Copied!' : `📋 ${d.share_code}`}
                    </button>
                    <button onClick={() => copyToClipboard(directLink, `link-${d.id}`)} style={{ ...actionBtnStyle, background: linkCopied ? '#00ff64' : 'transparent', color: linkCopied ? '#000' : '#fff' }}>
                      {linkCopied ? 'Link Copied!' : '🔗 Share'}
                    </button>
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

        {/* Tournaments */}
        <GameSection
          title={`Tournaments (${tournaments.length})`}
          currentPage={tournamentPage}
          totalItems={tournaments.length}
          onPrev={() => setTournamentPage((prev) => Math.max(prev - 1, 0))}
          onNext={() => setTournamentPage((prev) => prev + 1)}
        >
          {visibleTournaments.length === 0 ? (
            <EmptyRow text={`No tournaments for ${game.title} yet.`} />
          ) : (
            visibleTournaments.map((t) => {
              const count = tournamentCounts[t.id] || 0;
              const directLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/tournaments/${t.id}`;
              const linkCopied = copiedId === `link-${t.id}`;

              return (
                <div key={t.id} style={rowStyle}>
                  <Link href={`/tournaments/${t.id}`} style={rowInfoLinkStyle}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                      {t.status} · {t.starts_at ? new Date(t.starts_at).toLocaleString() : 'Start time TBD'} · {t.entry_fee > 0 ? `$${t.entry_fee}` : 'Free'}
                      {t.prize_pool > 0 && ` · $${t.prize_pool} prize`}
                      {t.max_players != null && ` · ${count}/${t.max_players} players`}
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button onClick={() => copyToClipboard(directLink, `link-${t.id}`)} style={{ ...actionBtnStyle, background: linkCopied ? '#00ff64' : 'transparent', color: linkCopied ? '#000' : '#fff' }}>
                      {linkCopied ? 'Link Copied!' : '🔗 Share'}
                    </button>
                    <Link href={`/tournaments/${t.id}`} style={viewBtnStyle}>
                      View
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </GameSection>

        {/* Leagues */}
        <GameSection
          title={`Leagues (${leagues.length})`}
          currentPage={leaguePage}
          totalItems={leagues.length}
          onPrev={() => setLeaguePage((prev) => Math.max(prev - 1, 0))}
          onNext={() => setLeaguePage((prev) => prev + 1)}
        >
          {visibleLeagues.length === 0 ? (
            <EmptyRow text={`No leagues for ${game.title} yet.`} />
          ) : (
            visibleLeagues.map((l) => {
              const count = leagueCounts[l.id] || 0;
              const directLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/leagues/${l.id}`;
              const linkCopied = copiedId === `link-${l.id}`;

              return (
                <div key={l.id} style={rowStyle}>
                  <Link href={`/leagues/${l.id}`} style={rowInfoLinkStyle}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                      {l.status} · {count}/{l.max_players} players · {l.entry_fee > 0 ? `$${l.entry_fee}` : 'Free'}
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button onClick={() => copyToClipboard(directLink, `link-${l.id}`)} style={{ ...actionBtnStyle, background: linkCopied ? '#00ff64' : 'transparent', color: linkCopied ? '#000' : '#fff' }}>
                      {linkCopied ? 'Link Copied!' : '🔗 Share'}
                    </button>
                    <Link href={`/leagues/${l.id}`} style={viewBtnStyle}>
                      View
                    </Link>
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

interface GameSectionProps {
  title: string;
  currentPage: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}

function GameSection({ title, currentPage, totalItems, onPrev, onNext, children }: GameSectionProps) {
  const hasPrev = currentPage > 0;
  const hasNext = (currentPage + 1) * PAGE_SIZE < totalItems;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, textTransform: 'uppercase' }}>
          {title}
        </h2>
        {totalItems > PAGE_SIZE && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onPrev} disabled={!hasPrev} style={{ ...navBtnStyle, opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}>
              ← Previous 5
            </button>
            <button onClick={onNext} disabled={!hasNext} style={{ ...navBtnStyle, opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed' }}>
              Next 5 →
            </button>
          </div>
        )}
      </div>
      <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>{text}</div>;
}

const navBtnStyle: React.CSSProperties = {
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 4,
};

const actionHeaderBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  padding: '10px 22px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  textDecoration: 'none',
  borderRadius: 4,
  display: 'inline-block',
};

const codeJoinBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  borderRadius: 4,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const marketCardStyle: React.CSSProperties = {
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  borderRadius: 6,
  padding: 12,
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const marketViewBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  textAlign: 'center',
  padding: '6px 10px',
  borderRadius: 4,
  fontWeight: 700,
  fontSize: 11,
  textTransform: 'uppercase',
  marginTop: 12,
  display: 'block',
};

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

const actionBtnStyle: React.CSSProperties = {
  border: '1px solid var(--panel-border)',
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  borderRadius: 4,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
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