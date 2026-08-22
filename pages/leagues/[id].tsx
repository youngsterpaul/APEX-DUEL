import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatCountdown } from '../../lib/countdown';

interface LeagueRow {
  id: string;
  game_id: string;
  name: string;
  created_by: string;
  status: string;
  entry_fee: number;
  max_players: number;
  rounds_per_opponent: number;
  host_fee: number;
  starts_at: string | null;
  ends_at: string | null;
  image_url: string | null;
  share_code: string;
  group_link?: string | null;
  join_mode: 'open' | 'approval';
}

interface Participant {
  profile_id: string;
  username: string;
  wins: number;
  losses: number;
  points: number;
}

interface JoinRequest {
  id: string;
  profile_id: string;
  creator_id: string;
  status: 'pending' | 'approved' | 'declined';
  username?: string;
}

export default function LeagueDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState<any>(null);
  const [league, setLeague] = useState<LeagueRow | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [busy, setBusy] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
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

  const fetchAll = async (leagueId: string) => {
    setLoading(true);
    const { data: lData } = await supabase.from('leagues').select('*').eq('id', leagueId).maybeSingle();
    if (!lData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLeague(lData as LeagueRow);

    const [{ data: gameData }, { data: participantData }, { data: requestData }] = await Promise.all([
      supabase.from('games').select('title').eq('id', lData.game_id).maybeSingle(),
      supabase
        .from('league_participants')
        .select('profile_id, username, wins, losses, points')
        .eq('league_id', leagueId)
        .order('points', { ascending: false }),
      supabase.from('join_requests').select('id, profile_id, creator_id, status').eq('kind', 'league').eq('entity_id', leagueId),
    ]);

    setGameTitle(gameData?.title || '');
    setParticipants(participantData || []);

    const requests = requestData || [];
    if (requests.length > 0) {
      const ids = Array.from(new Set(requests.map((r) => r.profile_id)));
      const { data: profilesData } = await supabase.from('profiles').select('id, username').in('id', ids);
      const nameMap: Record<string, string> = {};
      (profilesData || []).forEach((p: any) => (nameMap[p.id] = p.username));
      setJoinRequests(requests.map((r) => ({ ...r, username: nameMap[r.profile_id] })));
    } else {
      setJoinRequests([]);
    }

    setLoading(false);
  };

  const handleJoin = async () => {
    if (typeof id !== 'string') return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc('join_league', { p_league_id: id });
    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({
      type: 'success',
      text: league?.join_mode === 'approval' ? 'Request sent — waiting on the host to approve it.' : "You're in!",
    });
    fetchAll(id);
  };

  const handleRespond = async (requestId: string, approve: boolean) => {
    setRespondingId(requestId);
    setMessage(null);
    const { error } = await supabase.rpc('respond_to_join_request', { p_request_id: requestId, p_approve: approve });
    setRespondingId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    if (typeof id === 'string') fetchAll(id);
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px', background: '#0a0b14', minHeight: '100vh' }}>Loading…</div>;
  }

  if (notFound || !league) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>League not found.</p>
        <Link href="/leagues" style={{ color: 'var(--red)' }}>Back to Leagues</Link>
      </div>
    );
  }

  const started = league.starts_at ? new Date(league.starts_at).getTime() <= Date.now() : false;
  const alreadyJoined = session && participants.some((p) => p.profile_id === session.user.id);
  const isCreator = session && league.created_by === session.user.id;
  const myRequest = session ? joinRequests.find((r) => r.profile_id === session.user.id) : undefined;
  const pendingRequests = isCreator ? joinRequests.filter((r) => r.status === 'pending') : [];
  const isApproval = league.join_mode === 'approval';
  const full = participants.length >= league.max_players;
  const canJoin = session && !started && league.status === 'open' && !alreadyJoined && !full && myRequest?.status !== 'pending';
  const free = !league.entry_fee || league.entry_fee <= 0;

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{league.name} | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 80px' }}>
        <Link href="/leagues" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Leagues
        </Link>

        <div
          style={{
            marginTop: 16,
            marginBottom: 8,
            borderRadius: 8,
            overflow: 'hidden',
            padding: league.image_url ? 20 : 0,
            backgroundImage: league.image_url
              ? `linear-gradient(180deg, rgba(10,11,20,0.55), rgba(10,11,20,0.92)), url(${league.image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{gameTitle}</span>
          <h1 className="display" style={{ fontSize: 'clamp(24px, 4vw, 34px)', textTransform: 'uppercase', margin: '4px 0' }}>
            {league.name}
          </h1>
        </div>

        {/* Countdown to start / end */}
        {(league.starts_at || league.ends_at) && (() => {
          const target = started ? league.ends_at : league.starts_at;
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
                  ? 'League end time has passed.'
                  : 'League start time has passed.'
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
          <Detail label="Entry" value={free ? 'Free' : `$${league.entry_fee}`} highlight color={free ? '#29e7cd' : undefined} />
          <Detail label="Access" value={free ? 'Open to All' : 'Invite / Code'} />
          <Detail label="Number of Games" value={`Faces each opponent ${league.rounds_per_opponent}×`} />
          <Detail label="Players" value={`${participants.length} / ${league.max_players}`} />
          <Detail
            label="Starts"
            value={league.starts_at ? new Date(league.starts_at).toLocaleString() : 'TBD'}
            color={started ? '#ff4444' : undefined}
          />
          <Detail label="Ends" value={league.ends_at ? new Date(league.ends_at).toLocaleString() : 'TBD'} />
          <Detail label="Status" value={started ? 'Started / Closed' : 'Open to Join'} color={started ? '#ff4444' : '#29e7cd'} />
          <Detail label="Code" value={league.share_code} />
          <Detail label="Joining" value={isApproval ? 'Requires Host Approval' : 'Open to Everyone'} color={isApproval ? 'var(--gold)' : undefined} />
          {free && league.host_fee > 0 && <Detail label="Hosting Fee" value={`$${league.host_fee} (paid by host)`} />}
        </div>

        {/* Winning determination */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>How the winner is determined</p>
          <p style={{ fontSize: 13, color: '#d8dae0' }}>
            Every match win earns points. Standings are ranked by total points — whoever has the most when the
            league ends is the champion.
          </p>
        </div>

        {league.group_link && (
          <div style={{ marginBottom: 16 }}>
            <a
              href={league.group_link}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', padding: 12, background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--cyan)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
            >
              💬 Join the league group chat
            </a>
          </div>
        )}

        {/* Creator: pending join requests to approve/decline */}
        {isCreator && pendingRequests.length > 0 && (
          <div style={{ background: '#131627', border: '1px solid var(--gold)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
              Pending Join Requests ({pendingRequests.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingRequests.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--panel-border)' }}>
                  <span>{r.username || 'Player'}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRespond(r.id, true)} disabled={respondingId === r.id} style={approveBtnStyle}>
                      ✅ Approve
                    </button>
                    <button onClick={() => handleRespond(r.id, false)} disabled={respondingId === r.id} style={declineBtnStyle}>
                      ❌ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join action */}
        <div style={{ marginBottom: 24 }}>
          {isCreator && !alreadyJoined && (
            <div style={{ padding: 12, marginBottom: 10, textAlign: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--gold)', borderRadius: 6, color: 'var(--gold)', fontSize: 13 }}>
              👑 You're hosting this league. You can watch standings here without joining, or join below to compete too.
            </div>
          )}
          {alreadyJoined ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(41,231,205,0.1)', border: '1px solid #29e7cd', borderRadius: 6, color: '#29e7cd', fontSize: 13, fontWeight: 700 }}>
              ✅ You're in this league
            </div>
          ) : myRequest?.status === 'pending' ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--gold)', borderRadius: 6, color: 'var(--gold)', fontSize: 13, fontWeight: 700 }}>
              ⏳ Request sent — waiting on the host to approve it
            </div>
          ) : started ? (
            <div style={{ padding: 12, textAlign: 'center', background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--muted)', fontSize: 13 }}>
              🔒 Closed — this league has already started
            </div>
          ) : full ? (
            <div style={{ padding: 12, textAlign: 'center', background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--muted)', fontSize: 13 }}>
              This league is full
            </div>
          ) : !session ? (
            <Link href="/login" style={{ display: 'block', textAlign: 'center', ...primaryBtnStyle, textDecoration: 'none' }}>
              Sign in to Join
            </Link>
          ) : (
            <>
              {myRequest?.status === 'declined' && (
                <p style={{ fontSize: 12, color: '#ff4444', textAlign: 'center', marginBottom: 8 }}>
                  Your previous request was declined. You can try again below.
                </p>
              )}
              <button onClick={handleJoin} disabled={busy || !canJoin} style={{ ...primaryBtnStyle, width: '100%' }}>
                {busy
                  ? isApproval
                    ? 'Sending request…'
                    : 'Joining…'
                  : isApproval
                  ? `Request to Join${!free ? ` — $${league.entry_fee}` : ''}`
                  : `Join League${!free ? ` — $${league.entry_fee}` : ''}`}
              </button>
            </>
          )}
        </div>

        {/* Standings — identities and progress are only visible to the host or someone who has joined */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            Standings ({participants.length})
          </p>
          {isCreator || alreadyJoined ? (
            participants.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No one has joined yet — be the first!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {participants.map((p, i) => (
                  <div key={p.profile_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--panel-border)' }}>
                    <span>{i + 1}. {p.username}</span>
                    <span style={{ color: 'var(--muted)' }}>
                      {p.wins}W–{p.losses}L · {p.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              🔒 Join this league to see who else is competing and follow live standings.
            </p>
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

const approveBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #29e7cd',
  color: '#29e7cd',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const declineBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #ff4444',
  color: '#ff4444',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};
