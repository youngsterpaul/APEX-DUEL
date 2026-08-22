import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

interface DuelHistoryItem {
  id: string;
  game: string;
  status: string;
  winner_id: string | null;
  entry_fee: number;
  created_at: string;
  player1_id: string;
  player2_id: string | null;
  opponent_username: string | null;
}

interface LeagueHistoryItem {
  id: string;
  name: string;
  status: string;
  wins: number;
  losses: number;
  points: number;
  created_at: string;
}

interface TournamentHistoryItem {
  id: string;
  name: string;
  status: string;
  wins: number;
  points: number;
  final_placement: number | null;
  eliminated: boolean;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [duelHistory, setDuelHistory] = useState<DuelHistoryItem[]>([]);
  const [leagueHistory, setLeagueHistory] = useState<LeagueHistoryItem[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistoryItem[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckedAuth(true);
      if (data.session) fetchHistory(data.session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchHistory = async (userId: string) => {
    setLoading(true);

    // --- Last 10 1v1 matches ---
    const { data: duelsRaw } = await supabase
      .from('duels')
      .select('id, game, status, winner_id, entry_fee, created_at, player1_id, player2_id')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    let duelItems: DuelHistoryItem[] = [];
    if (duelsRaw && duelsRaw.length > 0) {
      const opponentIds = Array.from(
        new Set(
          duelsRaw
            .map((d) => (d.player1_id === userId ? d.player2_id : d.player1_id))
            .filter((v): v is string => !!v)
        )
      );
      let opponentMap: Record<string, string> = {};
      if (opponentIds.length > 0) {
        const { data: opponents } = await supabase.from('profiles').select('id, username, email').in('id', opponentIds);
        opponentMap = Object.fromEntries((opponents || []).map((o: any) => [o.id, o.username || o.email || 'Player']));
      }
      duelItems = duelsRaw.map((d) => ({
        ...d,
        opponent_username: d.player1_id === userId ? (d.player2_id ? opponentMap[d.player2_id] || null : null) : opponentMap[d.player1_id] || null,
      }));
    }
    setDuelHistory(duelItems);

    // --- Last 10 leagues participated in ---
    const { data: leagueRows } = await supabase
      .from('league_participants')
      .select('wins, losses, points, league:leagues(id, name, status, created_at)')
      .eq('profile_id', userId);

    const leagueItems: LeagueHistoryItem[] = (leagueRows || [])
      .filter((r: any) => r.league)
      .map((r: any) => ({
        id: r.league.id,
        name: r.league.name,
        status: r.league.status,
        wins: r.wins,
        losses: r.losses,
        points: r.points,
        created_at: r.league.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    setLeagueHistory(leagueItems);

    // --- Last 10 tournaments participated in ---
    const { data: tournamentRows } = await supabase
      .from('tournament_participants')
      .select('wins, points, eliminated, final_placement, tournament:tournaments(id, name, status, created_at)')
      .eq('profile_id', userId);

    const tournamentItems: TournamentHistoryItem[] = (tournamentRows || [])
      .filter((r: any) => r.tournament)
      .map((r: any) => ({
        id: r.tournament.id,
        name: r.tournament.name,
        status: r.tournament.status,
        wins: r.wins,
        points: r.points,
        eliminated: r.eliminated,
        final_placement: r.final_placement,
        created_at: r.tournament.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    setTournamentHistory(tournamentItems);

    setLoading(false);
  };

  if (checkedAuth && !session) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Sign in to see your match history.</p>
        <Link href="/login" style={{ color: 'var(--red)' }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>My History | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 80px' }}>
        <button onClick={() => router.back()} style={backLinkStyle}>← Back</button>

        <h1 className="display" style={{ fontSize: 'clamp(24px, 4vw, 34px)', textTransform: 'uppercase', margin: '16px 0 4px' }}>
          My History
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
          Your most recent activity — up to the last 10 of each.
        </p>

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading…</p>
        ) : (
          <>
            <HistorySection title="1v1 Matches">
              {duelHistory.length === 0 ? (
                <EmptyRow text="No 1v1 matches yet." />
              ) : (
                duelHistory.map((d) => {
                  const isWinner = d.winner_id && session && d.winner_id === session.user.id;
                  const isLoser = d.winner_id && session && d.winner_id !== session.user.id;
                  const resultLabel =
                    d.status !== 'completed' ? d.status.replace('_', ' ') : isWinner ? 'Won' : isLoser ? 'Lost' : 'Draw';
                  const resultColor = isWinner ? '#29e7cd' : isLoser ? '#ff4444' : 'var(--muted)';
                  return (
                    <Link key={d.id} href={`/duel/${d.id}`} style={rowLinkStyle}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.game}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          vs {d.opponent_username || 'TBD'} · {new Date(d.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: resultColor, textTransform: 'capitalize' }}>{resultLabel}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>${d.entry_fee} entry</div>
                      </div>
                    </Link>
                  );
                })
              )}
            </HistorySection>

            <HistorySection title="Leagues">
              {leagueHistory.length === 0 ? (
                <EmptyRow text="No leagues joined yet." />
              ) : (
                leagueHistory.map((l) => (
                  <Link key={l.id} href={`/leagues/${l.id}`} style={rowLinkStyle}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{l.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{l.wins}W – {l.losses}L</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l.points} pts</div>
                    </div>
                  </Link>
                ))
              )}
            </HistorySection>

            <HistorySection title="Tournaments">
              {tournamentHistory.length === 0 ? (
                <EmptyRow text="No tournaments joined yet." />
              ) : (
                tournamentHistory.map((t) => (
                  <Link key={t.id} href={`/tournaments/${t.id}`} style={rowLinkStyle}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                        {t.status} {t.eliminated && '· Eliminated'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {t.final_placement ? `#${t.final_placement}` : `${t.wins} wins`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.points} pts</div>
                    </div>
                  </Link>
                ))
              )}
            </HistorySection>
          </>
        )}
      </section>
    </div>
  );
}

function HistorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, letterSpacing: '0.05em' }}>
        {title}
      </p>
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

const backLinkStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  padding: 0,
};
