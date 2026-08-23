import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatCountdown } from '../../lib/countdown';

interface TournamentRow {
  id: string;
  game_id: string;
  name: string;
  format: string;
  created_by: string;
  entry_fee: number;
  prize_pool: number;
  payout_places: number;
  host_fee: number;
  max_players: number | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  image_url: string | null;
  share_code: string;
}

interface Stage {
  stage_number: number;
  name: string;
  games_per_pairing: number;
}

interface Participant {
  profile_id: string;
  username: string;
  wins: number;
  points: number;
  eliminated: boolean;
  final_placement: number | null;
}

export default function TournamentDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState<any>(null);
  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (typeof id === 'string') fetchAll(id);
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = async (tournamentId: string) => {
    setLoading(true);
    const { data: tData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).maybeSingle();
    if (!tData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setTournament(tData as TournamentRow);

    const [{ data: gameData }, { data: stageData }, { data: participantData }] = await Promise.all([
      supabase.from('games').select('title').eq('id', tData.game_id).maybeSingle(),
      supabase.from('tournament_stages').select('stage_number, name, games_per_pairing').eq('tournament_id', tournamentId).order('stage_number'),
      supabase
        .from('tournament_participants')
        .select('profile_id, username, wins, points, eliminated, final_placement')
        .eq('tournament_id', tournamentId)
        .order('points', { ascending: false }),
    ]);

    setGameTitle(gameData?.title || '');
    setStages(stageData || []);
    setParticipants(participantData || []);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (typeof id !== 'string') return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc('register_for_tournament', { p_tournament_id: id });
    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: "You're registered!" });
    fetchAll(id);
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px', background: '#0a0b14', minHeight: '100vh' }}>Loading…</div>;
  }

  if (notFound || !tournament) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Tournament not found.</p>
        <Link href="/tournaments" style={{ color: 'var(--red)' }}>Back to Tournaments</Link>
      </div>
    );
  }

  const started = tournament.starts_at ? new Date(tournament.starts_at).getTime() <= Date.now() : false;
  const alreadyJoined = session && participants.some((p) => p.profile_id === session.user.id);
  const isCreator = session && tournament.created_by === session.user.id;
  const full = tournament.max_players != null && participants.length >= tournament.max_players;
  const canJoin = session && !started && tournament.status === 'registration' && !alreadyJoined && !full;
  const totalGames = stages.reduce((sum, s) => sum + s.games_per_pairing, 0);

  const winningExplainer =
    tournament.format === 'round_robin'
      ? 'Round robin — every player earns points across their matches. Whoever has the most points when the tournament ends wins.'
      : 'Single elimination — lose your matchup and you\'re out. The last player standing wins.';

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{tournament.name} | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 80px' }}>
        <Link href="/tournaments" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Tournaments
        </Link>

        <div
          style={{
            marginTop: 16,
            marginBottom: 8,
            borderRadius: 8,
            overflow: 'hidden',
            padding: tournament.image_url ? 20 : 0,
            backgroundImage: tournament.image_url
              ? `linear-gradient(180deg, rgba(10,11,20,0.55), rgba(10,11,20,0.92)), url(${tournament.image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{gameTitle}</span>
          <h1 className="display" style={{ fontSize: 'clamp(24px, 4vw, 34px)', textTransform: 'uppercase', margin: '4px 0' }}>
            {tournament.name}
          </h1>
        </div>

        {/* Countdown to start / end */}
        {(tournament.starts_at || tournament.ends_at) && (() => {
          const target = started ? tournament.ends_at : tournament.starts_at;
          if (!target) return null;
          const msLeft = new Date(target).getTime() - now;
          const expired = msLeft <= 0;
          const days = Math.floor(Math.max(0, msLeft) / 86400000);
          return (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: expired ? 'rgba(255,68,68,0.1)' : 'rgba(41,231,205,0.08)',
                border: `1px solid ${expired ? '#ff4444' : 'var(--panel-border)'}`,
                borderRadius: 6,
                fontSize: 12,
                color: expired ? '#ff4444' : 'var(--muted)',
              }}
            >
              ⏱ {expired
                ? started
                  ? 'Tournament end time has passed.'
                  : 'Tournament start time has passed.'
                : `${started ? 'Ends' : 'Starts'} in ${days} day${days === 1 ? '' : 's'} · ${formatCountdown(msLeft)} remaining`}
            </div>
          );
        })()}

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 4,
              fontSize: 13,
              background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
              color: message.type === 'success' ? '#00ff64' : '#ff4444',
              border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}`,
            }}
          >
            {message.text}
          </div>
        )}

        {/* Key details grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            background: '#131627',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Detail label="Entry Fee" value={tournament.entry_fee > 0 ? `$${tournament.entry_fee}` : 'Free'} highlight />
          <Detail label="Prize Pool" value={`$${tournament.prize_pool}`} highlight color="#29e7cd" />
          <Detail label="Format" value={tournament.format === 'round_robin' ? 'Round Robin' : 'Elimination'} />
          <Detail label="Paid Places" value={`Top ${tournament.payout_places}`} />
          <Detail label="Number of Games" value={totalGames > 0 ? `${totalGames} across ${stages.length} stage${stages.length === 1 ? '' : 's'}` : 'TBD'} />
          <Detail label="Participants" value={tournament.max_players != null ? `${participants.length} / ${tournament.max_players}` : String(participants.length)} color={full ? '#ff4444' : undefined} />
          <Detail
            label="Starts"
            value={tournament.starts_at ? new Date(tournament.starts_at).toLocaleString() : 'TBD'}
            color={started ? '#ff4444' : undefined}
          />
          <Detail label="Ends" value={tournament.ends_at ? new Date(tournament.ends_at).toLocaleString() : 'TBD'} />
          <Detail
            label="Status"
            value={started ? 'Started / Closed' : full ? 'Full' : 'Registration Open'}
            color={started || full ? '#ff4444' : '#29e7cd'}
          />
          {tournament.entry_fee <= 0 && tournament.host_fee > 0 && <Detail label="Hosting Fee" value={`$${tournament.host_fee} (paid by host)`} />}
        </div>

        {/* Winning determination */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>How the winner is determined</p>
          <p style={{ fontSize: 13, color: '#d8dae0' }}>{winningExplainer}</p>
        </div>

        {/* Join action */}
        <div style={{ marginBottom: 24 }}>
          {isCreator && !alreadyJoined && (
            <div style={{ padding: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--gold)', borderRadius: 6, color: 'var(--gold)', fontSize: 13 }}>
              👑 You're hosting this tournament. You can watch progress here without registering, or register below to compete too.
            </div>
          )}
          {alreadyJoined ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(41,231,205,0.1)', border: '1px solid #29e7cd', borderRadius: 6, color: '#29e7cd', fontSize: 13, fontWeight: 700 }}>
              ✅ You're registered for this tournament
            </div>
          ) : started ? (
            <div style={{ padding: 12, textAlign: 'center', background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--muted)', fontSize: 13 }}>
              🔒 Registration closed — this tournament has started
            </div>
          ) : full ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', borderRadius: 6, color: '#ff4444', fontSize: 13, fontWeight: 700 }}>
              🚫 This tournament is full ({tournament.max_players} / {tournament.max_players} players)
            </div>
          ) : !session ? (
            <Link href="/login" style={{ display: 'block', textAlign: 'center', ...primaryBtnStyle, textDecoration: 'none' }}>
              Sign in to Join
            </Link>
          ) : (
            <button onClick={handleJoin} disabled={busy || !canJoin} style={{ ...primaryBtnStyle, width: '100%' }}>
              {busy ? 'Joining…' : `Join Tournament${tournament.entry_fee > 0 ? ` — $${tournament.entry_fee}` : ''}`}
            </button>
          )}
        </div>

        {/* Participants */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            Participants ({participants.length})
          </p>
          {participants.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>No one has joined yet — be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {participants.map((p, i) => (
                <div key={p.profile_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--panel-border)' }}>
                  <span>
                    {i + 1}. {p.username} {p.eliminated && <span style={{ color: '#ff4444', fontSize: 11 }}>(eliminated)</span>}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>
                    {p.wins} wins · {p.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: highlight ? 16 : 14, fontWeight: highlight ? 800 : 700, color: color || '#fff' }}>{value}</span>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '13px',
  fontWeight: 700,
  fontSize: 14,
  textTransform: 'uppercase',
  cursor: 'pointer',
};
