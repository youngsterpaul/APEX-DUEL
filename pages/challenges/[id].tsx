import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import EventShareInvite from '../../components/EventShareInvite';

interface ChallengeRow {
  id: string;
  title: string;
  game_id: string;
  creator_id: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  status: string;
  type: '1v1' | 'tournament' | 'league';
  join_code: string;
  creator_funds_prize: boolean;
  requires_approval: boolean;
  config: Record<string, any>;
}

interface Participant {
  user_id: string;
  username?: string;
}

interface JoinRequest {
  id: string;
  profile_id: string;
  creator_id: string;
  status: 'pending' | 'approved' | 'declined';
  username?: string;
}

export default function ChallengeDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState<any>(null);
  const [challenge, setChallenge] = useState<ChallengeRow | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [busy, setBusy] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (typeof id === 'string') fetchAll(id);
  }, [id]);

  const fetchAll = async (challengeId: string) => {
    setLoading(true);
    const { data: cData } = await supabase.from('challenges').select('*').eq('id', challengeId).maybeSingle();
    if (!cData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setChallenge(cData as ChallengeRow);

    const [{ data: gameData }, { data: creatorData }, { data: participantData }, { data: requestData }] = await Promise.all([
      supabase.from('games').select('title').eq('id', cData.game_id).maybeSingle(),
      supabase.from('profiles').select('username').eq('id', cData.creator_id).maybeSingle(),
      supabase.from('challenge_participants').select('user_id').eq('challenge_id', challengeId),
      supabase.from('join_requests').select('id, profile_id, creator_id, status').eq('kind', 'challenge').eq('entity_id', challengeId),
    ]);

    setGameTitle(gameData?.title || '');
    setCreatorName(creatorData?.username || '');

    const pRows = participantData || [];
    if (pRows.length > 0) {
      const ids = Array.from(new Set(pRows.map((p) => p.user_id)));
      const { data: profilesData } = await supabase.from('profiles').select('id, username').in('id', ids);
      const nameMap: Record<string, string> = {};
      (profilesData || []).forEach((p: any) => (nameMap[p.id] = p.username));
      setParticipants(pRows.map((p) => ({ user_id: p.user_id, username: nameMap[p.user_id] })));
    } else {
      setParticipants([]);
    }

    const requests = requestData || [];
    if (requests.length > 0) {
      const ids = Array.from(new Set(requests.map((r) => r.profile_id)));
      const { data: reqProfiles } = await supabase.from('profiles').select('id, username').in('id', ids);
      const nameMap: Record<string, string> = {};
      (reqProfiles || []).forEach((p: any) => (nameMap[p.id] = p.username));
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
    const { error } = await supabase.rpc('join_challenge', { p_challenge_id: id });
    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({
      type: 'success',
      text: challenge?.requires_approval ? 'Request sent — waiting on the host to approve it.' : "You're in!",
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

  if (notFound || !challenge) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Challenge not found.</p>
        <Link href="/challenges" style={{ color: 'var(--red)' }}>Back to Challenges</Link>
      </div>
    );
  }

  const alreadyJoined = session && participants.some((p) => p.user_id === session.user.id);
  const isCreator = session && challenge.creator_id === session.user.id;
  const myRequest = session ? joinRequests.find((r) => r.profile_id === session.user.id) : undefined;
  const pendingRequests = isCreator ? joinRequests.filter((r) => r.status === 'pending') : [];
  const full = challenge.current_players >= challenge.max_players;
  const canJoin = session && !isCreator && !full && challenge.status === 'open' && !alreadyJoined && myRequest?.status !== 'pending';
  const free = !challenge.entry_fee || challenge.entry_fee <= 0;
  const cfg = challenge.config || {};

  const rulesSummary: { label: string; value: string }[] = [];
  if (challenge.type === '1v1') {
    if (cfg.is_football) {
      rulesSummary.push({ label: 'Scoring', value: 'Football rules (win/draw/loss points)' });
    } else if (cfg.points_per_win != null) {
      rulesSummary.push({ label: 'Points per win', value: String(cfg.points_per_win) });
    }
    if (cfg.games_to_play) rulesSummary.push({ label: 'Games to play', value: String(cfg.games_to_play) });
    if (cfg.win_by) rulesSummary.push({ label: 'Win by', value: String(cfg.win_by) });
    if (cfg.tie_rule) rulesSummary.push({ label: 'Ties', value: 'Platform adds another game until decided' });
  } else if (challenge.type === 'tournament') {
    if (cfg.games_per_stage) rulesSummary.push({ label: 'Games per stage', value: String(cfg.games_per_stage) });
    if (cfg.bracket_method) rulesSummary.push({ label: 'Bracket', value: 'Random draw once full' });
    if (challenge.creator_funds_prize) {
      rulesSummary.push({ label: 'Prize pool', value: `$${cfg.prize_total ?? 0} (host-funded)` });
      if (cfg.prize_final != null) rulesSummary.push({ label: 'Winner prize', value: `$${cfg.prize_final}` });
      if (cfg.prize_semifinal != null) rulesSummary.push({ label: 'Semifinal prize', value: `$${cfg.prize_semifinal}` });
    }
  } else if (challenge.type === 'league') {
    if (cfg.rounds_per_opponent) rulesSummary.push({ label: 'Faces each opponent', value: `${cfg.rounds_per_opponent}×` });
    if (cfg.decision_window_hours) rulesSummary.push({ label: 'Result window', value: `${cfg.decision_window_hours} hours` });
    if (cfg.auto_win_on_no_response) rulesSummary.push({ label: 'No response', value: 'Opponent wins automatically' });
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{challenge.title} | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 80px' }}>
        <Link href="/challenges" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Challenges
        </Link>

        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>
            {gameTitle} · {challenge.type.toUpperCase()}
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(24px, 4vw, 34px)', textTransform: 'uppercase', margin: '4px 0' }}>
            {challenge.title}
          </h1>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Hosted by {creatorName || 'a player'}</span>
        </div>

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            background: '#131627',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Detail label="Entry" value={free ? 'Free' : `$${challenge.entry_fee}`} highlight color={free ? '#29e7cd' : undefined} />
          <Detail label="Players" value={`${challenge.current_players} / ${challenge.max_players}`} color={full ? '#ff4444' : undefined} />
          <Detail label="Joining" value={challenge.requires_approval ? 'Requires Host Approval' : 'Open to Everyone'} color={challenge.requires_approval ? 'var(--gold)' : undefined} />
          <Detail label="Status" value={challenge.status === 'open' ? (full ? 'Full' : 'Open') : challenge.status} color={challenge.status === 'open' && !full ? '#29e7cd' : '#ff4444'} />
        </div>

        {/* Rules summary derived from config */}
        {rulesSummary.length > 0 && (
          <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Rules</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rulesSummary.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <EventShareInvite
          kind="challenge"
          entityId={challenge.id}
          shareCode={challenge.join_code}
          isCreator={!!isCreator}
          joinMode={challenge.requires_approval ? 'approval' : 'open'}
          onInvited={() => fetchAll(challenge.id)}
        />

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
          {isCreator ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--gold)', borderRadius: 6, color: 'var(--gold)', fontSize: 13 }}>
              👑 You're hosting this challenge.
            </div>
          ) : alreadyJoined ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(41,231,205,0.1)', border: '1px solid #29e7cd', borderRadius: 6, color: '#29e7cd', fontSize: 13, fontWeight: 700 }}>
              ✅ You're in this challenge
            </div>
          ) : myRequest?.status === 'pending' ? (
            <div style={{ padding: 12, textAlign: 'center', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--gold)', borderRadius: 6, color: 'var(--gold)', fontSize: 13, fontWeight: 700 }}>
              ⏳ Request sent — waiting on the host to approve it
            </div>
          ) : full ? (
            <div style={{ padding: 12, textAlign: 'center', background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--muted)', fontSize: 13 }}>
              This challenge is full
            </div>
          ) : challenge.status !== 'open' ? (
            <div style={{ padding: 12, textAlign: 'center', background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--muted)', fontSize: 13 }}>
              🔒 This challenge is no longer open
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
                  ? 'Processing…'
                  : challenge.requires_approval
                  ? `Request to Join${!free ? ` — $${challenge.entry_fee}` : ''}`
                  : `Join Challenge${!free ? ` — $${challenge.entry_fee}` : ''}`}
              </button>
            </>
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
                <div key={p.user_id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--panel-border)' }}>
                  {i + 1}. {p.username || 'Player'}
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
