import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Duel, DuelMessage } from '../../lib/types';
import { formatCountdown } from '../../lib/countdown';

interface Profile {
  id: string;
  username: string;
  avatar_url?: string | null;
  whatsapp_username?: string | null;
  whatsapp_phone?: string | null;
}

interface PendingRequest {
  id: string;
  profile_id: string;
  username: string;
  created_at: string;
}

const POLL_MS = 3000;

export default function DuelChatPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState<any>(null);
  const [duel, setDuel] = useState<Duel | null>(null);
  const [player1, setPlayer1] = useState<Profile | null>(null);
  const [player2, setPlayer2] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DuelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposedWinnerChoice, setProposedWinnerChoice] = useState<string>('');

  const [myRequestStatus, setMyRequestStatus] = useState<'pending' | 'declined' | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null);

  const [now, setNow] = useState(() => Date.now());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    if (typeof id !== 'string') return;

    const { data: duelData } = await supabase.from('duels').select('*').eq('id', id).maybeSingle();
    if (!duelData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setDuel(duelData as Duel);

    const profileIds = [duelData.player1_id, duelData.player2_id].filter(Boolean);
    const {
      data: { session: sess },
    } = await supabase.auth.getSession();

    const [{ data: profilesData }, { data: messagesData }] = await Promise.all([
      supabase.from('profiles').select('id, username, avatar_url, whatsapp_username, whatsapp_phone').in('id', profileIds),
      duelData.player2_id && sess && (sess.user.id === duelData.player1_id || sess.user.id === duelData.player2_id)
        ? supabase.from('duel_messages').select('*').eq('duel_id', id).order('created_at', { ascending: true })
        : Promise.resolve({ data: [] as DuelMessage[] }),
    ]);

    if (profilesData) {
      setPlayer1(profilesData.find((p) => p.id === duelData.player1_id) || null);
      setPlayer2(profilesData.find((p) => p.id === duelData.player2_id) || null);
    }
    if (messagesData) setMessages(messagesData as DuelMessage[]);

    // Join requests: my own pending/declined status, or — if I'm the host — everyone else's pending requests.
    if (sess && duelData.join_mode === 'approval') {
      if (sess.user.id === duelData.player1_id) {
        const { data: reqs } = await supabase
          .from('join_requests')
          .select('id, profile_id, created_at')
          .eq('kind', 'duel')
          .eq('entity_id', id)
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        if (reqs && reqs.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, username, email').in('id', reqs.map((r) => r.profile_id));
          setPendingRequests(
            reqs.map((r) => ({
              id: r.id,
              profile_id: r.profile_id,
              created_at: r.created_at,
              username: profs?.find((p: any) => p.id === r.profile_id)?.username || profs?.find((p: any) => p.id === r.profile_id)?.email || 'Player',
            }))
          );
        } else {
          setPendingRequests([]);
        }
      } else {
        const { data: mine } = await supabase
          .from('join_requests')
          .select('status')
          .eq('kind', 'duel')
          .eq('entity_id', id)
          .eq('profile_id', sess.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setMyRequestStatus(mine ? (mine.status === 'declined' ? 'declined' : 'pending') : null);
      }
    } else {
      setPendingRequests([]);
      setMyRequestStatus(null);
    }

    setLoading(false);
  }, [id]);

  const handleJoin = async () => {
    if (!session || typeof id !== 'string') return;
    setBusy(true);
    setJoinMessage(null);
    const { error: joinErr } = await supabase.rpc('join_duel', { p_duel_id: id });
    setBusy(false);
    if (joinErr) {
      setJoinMessage({ type: 'error', text: joinErr.message });
      return;
    }
    fetchAll();
  };

  const handleRespondToRequest = async (requestId: string, approve: boolean) => {
    setRequestBusyId(requestId);
    setJoinMessage(null);
    const { error: respErr } = await supabase.rpc('respond_to_join_request', { p_request_id: requestId, p_approve: approve });
    setRequestBusyId(null);
    if (respErr) {
      setJoinMessage({ type: 'error', text: respErr.message });
      return;
    }
    fetchAll();
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const isP1 = session && duel && session.user.id === duel.player1_id;
  const isP2 = session && duel && session.user.id === duel.player2_id;
  const isParticipant = isP1 || isP2;
  const chatUnlocked = !!duel?.player2_id;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || typeof id !== 'string') return;
    setSending(true);
    setError(null);
    const { error: sendError } = await supabase.rpc('send_duel_message', { p_duel_id: id, p_body: messageBody.trim() });
    setSending(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setMessageBody('');
    fetchAll();
  };

  const handlePropose = async () => {
    if (typeof id !== 'string' || !proposedWinnerChoice) return;
    const ok = window.confirm('Propose this result? Your opponent will need to accept it before it becomes final.');
    if (!ok) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('propose_duel_result', { p_duel_id: id, p_winner_id: proposedWinnerChoice });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    fetchAll();
  };

  const handleConfirm = async () => {
    if (typeof id !== 'string') return;
    const ok = window.confirm(
      'Accept this result? Funds (if any) will be released to the winner. This cannot be undone.'
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('confirm_duel_result', { p_duel_id: id });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    fetchAll();
  };

  const handleReject = async () => {
    if (typeof id !== 'string') return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc('reject_duel_result', { p_duel_id: id });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    fetchAll();
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px', background: '#0a0b14', minHeight: '100vh' }}>Loading…</div>;
  }

  if (notFound || !duel) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>This match doesn't exist.</p>
        <Link href="/duels" style={{ color: 'var(--red)' }}>Back to Matches</Link>
      </div>
    );
  }

  const opponent = isP1 ? player2 : player1;
  const me = isP1 ? player1 : player2;
  const badge = getStatusInfo(duel.status);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head><title>{duel.game} Match | ApexDuel</title></Head>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px 100px' }}>
        <Link href="/duels" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>← My Matches</Link>

        <div
          style={{
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            marginTop: 16,
            overflow: 'hidden',
            backgroundImage: duel.image_url
              ? `linear-gradient(180deg, rgba(10,11,20,0.55), rgba(10,11,20,0.9)), url(${duel.image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            background: duel.image_url ? undefined : '#131627',
          }}
        >
          <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', fontWeight: 700 }}>1v1 Match</span>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0' }}>{duel.game}</h1>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Hosted by <strong style={{ color: '#fff' }}>{player1?.username || 'a player'}</strong>
                {opponent && <> · vs <strong style={{ color: '#fff' }}>{opponent.username || 'opponent'}</strong></>}
                {!duel.player2_id && ' · Waiting for an opponent to join…'}
              </span>
              {duel.scheduled_at && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Starts {new Date(duel.scheduled_at).toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              {duel.entry_fee > 0 && <div style={{ fontSize: 18, fontWeight: 900 }}>${duel.entry_fee} entry</div>}
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 12, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}` }}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown to the match's end time */}
        {duel.ends_at && (() => {
          const msLeft = new Date(duel.ends_at).getTime() - now;
          const expired = msLeft <= 0;
          const days = Math.floor(Math.max(0, msLeft) / 86400000);
          return (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: expired ? 'rgba(255,68,68,0.1)' : 'rgba(41,231,205,0.08)',
                border: `1px solid ${expired ? '#ff4444' : 'var(--panel-border)'}`,
                borderRadius: 6,
                fontSize: 12,
                color: expired ? '#ff4444' : 'var(--muted)',
              }}
            >
              ⏱ {expired
                ? 'Match end time has passed.'
                : `${days} day${days === 1 ? '' : 's'} left · ${formatCountdown(msLeft)} remaining`}
            </div>
          );
        })()}

        {joinMessage && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 4,
              fontSize: 13,
              textAlign: 'center',
              background: joinMessage.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
              color: joinMessage.type === 'success' ? '#00ff64' : '#ff4444',
              border: `1px solid ${joinMessage.type === 'success' ? '#00ff64' : '#ff4444'}`,
            }}
          >
            {joinMessage.text}
          </div>
        )}

        {/* Join / request-to-join — for signed-in visitors who aren't already a player */}
        {!isParticipant && !duel.player2_id && duel.status === 'scheduled' && (
          <div style={{ marginTop: 12, background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            {!session ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Sign in to join this match.</p>
                <Link href="/login" style={{ ...primaryBtn, display: 'inline-block', textDecoration: 'none' }}>Sign In</Link>
              </>
            ) : myRequestStatus === 'pending' ? (
              <p style={{ fontSize: 13, color: 'var(--gold)' }}>⏳ Your request to join is waiting on the host's approval.</p>
            ) : myRequestStatus === 'declined' ? (
              <>
                <p style={{ fontSize: 13, color: '#ff4444', marginBottom: 10 }}>Your last request was declined.</p>
                <button onClick={handleJoin} disabled={busy} style={primaryBtn}>
                  {busy ? '…' : 'Request Again'}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
                  Entry fee: <strong style={{ color: '#fff' }}>${duel.entry_fee}</strong>
                  {duel.join_mode === 'approval' && ' · The host must approve your entry'}
                </p>
                <button onClick={handleJoin} disabled={busy} style={primaryBtn}>
                  {busy ? '…' : duel.join_mode === 'approval' ? 'Request to Join' : 'Join Match'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Pending join requests — visible to the host only, when approval mode is on */}
        {isP1 && duel.join_mode === 'approval' && pendingRequests.length > 0 && (
          <div style={{ marginTop: 12, background: '#131627', border: '1px solid var(--gold)', borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
              Pending Requests ({pendingRequests.length})
            </p>
            {pendingRequests.map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: 13 }}>{r.username}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleRespondToRequest(r.id, true)} disabled={requestBusyId === r.id} style={{ ...primaryBtn, padding: '6px 12px', fontSize: 11 }}>
                    Approve
                  </button>
                  <button onClick={() => handleRespondToRequest(r.id, false)} disabled={requestBusyId === r.id} style={{ ...dangerBtn, padding: '6px 12px', fontSize: 11 }}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact info reveal — once the opponent has joined */}
        {chatUnlocked && opponent && (
          <div style={{ marginTop: 12, background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Opponent contact</p>
            <p style={{ fontSize: 13, marginBottom: 4 }}>Username: <strong>{opponent.username || '—'}</strong></p>
            {opponent.whatsapp_phone || opponent.whatsapp_username ? (
              <a
                href={`https://wa.me/${(opponent.whatsapp_phone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#25D366', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                💬 WhatsApp: {opponent.whatsapp_username || opponent.whatsapp_phone}
              </a>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Opponent hasn't connected WhatsApp yet.</p>
            )}
            {!me?.whatsapp_phone && !me?.whatsapp_username && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                <Link href="/profile" style={{ color: 'var(--red)' }}>Connect your own WhatsApp</Link> so they can reach you too.
              </p>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 4, fontSize: 13, background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid #ff4444' }}>
            {error}
          </div>
        )}

        {/* Chat — private between the two players */}
        {isParticipant ? (
          <div style={{ marginTop: 16, background: '#0f1120', border: '1px solid var(--panel-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', height: 380 }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!chatUnlocked ? (
                <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                  Chat unlocks once an opponent joins this match.
                </p>
              ) : messages.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                  No messages yet. Say hello and coordinate your match.
                </p>
              ) : (
                messages.map((m) => {
                  const mine = session && m.sender_id === session.user.id;
                  const senderName = m.sender_id === duel.player1_id ? player1?.username : player2?.username;
                  return (
                    <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2, textAlign: mine ? 'right' : 'left' }}>{senderName || 'User'}</div>
                      <div style={{ background: mine ? 'var(--red)' : '#1c2038', color: '#fff', padding: '8px 12px', borderRadius: 10, fontSize: 13, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {m.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--panel-border)' }}>
              <input
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder={chatUnlocked ? 'Message your opponent…' : 'Waiting for an opponent…'}
                disabled={!chatUnlocked || duel.status === 'completed'}
                style={{ flex: 1, padding: '10px 12px', background: '#131627', border: '1px solid var(--panel-border)', color: '#fff', borderRadius: 4, fontSize: 13 }}
              />
              <button type="submit" disabled={sending || !chatUnlocked || duel.status === 'completed'} style={{ ...primaryBtn, padding: '10px 18px' }}>
                Send
              </button>
            </form>
          </div>
        ) : (
          <div style={{ marginTop: 16, padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13, background: '#0f1120', border: '1px solid var(--panel-border)', borderRadius: 8 }}>
            👀 You're viewing this match as a spectator — chat is private between the two players.
          </div>
        )}


        {/* Result acceptance */}
        {duel.status === 'live' && isParticipant && (
          <div style={{ marginTop: 16, background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16 }}>
            {!duel.proposed_winner_id ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Who won?</p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[player1, player2].filter(Boolean).map((p) => (
                    <button
                      key={p!.id}
                      onClick={() => setProposedWinnerChoice(p!.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: proposedWinnerChoice === p!.id ? 'var(--red)' : '#0a0b14',
                        border: '1px solid var(--panel-border)',
                        color: '#fff',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {p!.username || 'Player'}
                    </button>
                  ))}
                </div>
                <button onClick={handlePropose} disabled={busy || !proposedWinnerChoice} style={{ ...primaryBtn, width: '100%' }}>
                  {busy ? 'Submitting…' : 'Propose Result'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  Your opponent must accept this before it's final.
                </p>
              </>
            ) : duel.proposed_by === session?.user.id ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                You proposed <strong style={{ color: '#fff' }}>{duel.proposed_winner_id === duel.player1_id ? player1?.username : player2?.username}</strong> as winner.
                Waiting for your opponent to accept or reject.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, marginBottom: 12 }}>
                  Your opponent says the winner is <strong>{duel.proposed_winner_id === duel.player1_id ? player1?.username : player2?.username}</strong>. Do you agree?
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleConfirm} disabled={busy} style={{ ...primaryBtn, flex: 1 }}>✅ Accept</button>
                  <button onClick={handleReject} disabled={busy} style={{ ...dangerBtn, flex: 1 }}>❌ Reject</button>
                </div>
              </>
            )}
          </div>
        )}

        {duel.status === 'completed' && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(41,231,205,0.1)', border: '1px solid #29e7cd', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#29e7cd' }}>🎉 Match complete</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              Winner: <strong style={{ color: '#fff' }}>{duel.winner_id === duel.player1_id ? player1?.username : player2?.username}</strong>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'scheduled':
      return { label: 'Waiting for Opponent', bg: 'rgba(255,178,56,0.15)', color: 'var(--gold)' };
    case 'live':
      return { label: 'Live', bg: 'rgba(41,231,205,0.15)', color: '#29e7cd' };
    case 'completed':
      return { label: 'Completed', bg: 'rgba(41,231,205,0.15)', color: '#29e7cd' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'rgba(255,255,255,0.1)', color: 'var(--muted)' };
    default:
      return { label: status, bg: 'rgba(255,255,255,0.1)', color: '#fff' };
  }
}

const primaryBtn: React.CSSProperties = { background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 4, padding: '12px', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer' };
const dangerBtn: React.CSSProperties = { background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: 4, padding: '12px', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer' };