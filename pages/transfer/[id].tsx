import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { uploadTransferEvidence } from '../../lib/storage';
import { Transfer, TransferMessage, TransferDisputeType } from '../../lib/types';

interface Listing {
  id: string;
  in_game_username: string;
  price: number;
  game_id: string;
  photos: string[];
}

interface Profile {
  id: string;
  username: string;
  avatar_url?: string | null;
  whatsapp_username?: string | null;
  whatsapp_phone?: string | null;
  discord_username?: string | null;
}

const DISPUTE_OPTIONS: { value: TransferDisputeType; label: string }[] = [
  { value: 'mismatch', label: 'Account details do not match the listing' },
  { value: 'cheated', label: 'I was cheated / scammed' },
  { value: 'wrong_account', label: 'Wrong account was handed over' },
  { value: 'failed_transfer', label: 'Transfer failed — never received access' },
];

const POLL_MS = 3000;

export default function TransferChatPage() {
  const router = useRouter();
  const { id } = router.query;

  const [session, setSession] = useState<any>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [buyer, setBuyer] = useState<Profile | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<TransferMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeType, setDisputeType] = useState<TransferDisputeType>('mismatch');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [responseEmail, setResponseEmail] = useState('');
  const [responseUsername, setResponseUsername] = useState('');
  const [responseFiles, setResponseFiles] = useState<File[]>([]);

  const [now, setNow] = useState(() => Date.now());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const fetchAll = useCallback(async () => {
    if (typeof id !== 'string') return;

    const { data: transferData } = await supabase.from('transfers').select('*').eq('id', id).maybeSingle();
    if (!transferData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setTransfer(transferData as Transfer);

    const [{ data: listingData }, { data: profilesData }, { data: messagesData }] = await Promise.all([
      supabase.from('account_listings').select('id, in_game_username, price, game_id, photos').eq('id', transferData.listing_id).maybeSingle(),
      supabase.from('profiles').select('id, username, avatar_url, whatsapp_username, whatsapp_phone, discord_username').in('id', [transferData.buyer_id, transferData.seller_id]),
      supabase.from('transfer_messages').select('*').eq('transfer_id', id).order('created_at', { ascending: true }),
    ]);

    if (listingData) {
      setListing(listingData as Listing);
      const { data: gameData } = await supabase.from('games').select('title').eq('id', listingData.game_id).maybeSingle();
      setGameTitle(gameData?.title || '');
    }
    if (profilesData) {
      setBuyer(profilesData.find((p) => p.id === transferData.buyer_id) || null);
      setSeller(profilesData.find((p) => p.id === transferData.seller_id) || null);
    }
    if (messagesData) setMessages(messagesData as TransferMessage[]);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const isBuyer = session && transfer && session.user.id === transfer.buyer_id;
  const isSeller = session && transfer && session.user.id === transfer.seller_id;
  const isParticipant = isBuyer || isSeller;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || typeof id !== 'string') return;
    setSending(true);
    setError(null);
    const { error: sendError } = await supabase.rpc('send_transfer_message', { p_transfer_id: id, p_body: messageBody.trim() });
    setSending(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setMessageBody('');
    fetchAll();
  };

  const handleConfirm = async () => {
    if (typeof id !== 'string') return;
    const ok = window.confirm(
      'Are you sure the account matches exactly what was listed? Confirming will release the funds to the seller. This action cannot be undone.'
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    const rpcName = isBuyer ? 'buyer_confirm_transfer' : 'seller_confirm_transfer';
    const { error: confirmError } = await supabase.rpc(rpcName, { p_transfer_id: id });
    setBusy(false);
    if (confirmError) {
      setError(confirmError.message);
      return;
    }
    fetchAll();
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof id !== 'string' || !session) return;
    if (!disputeReason.trim()) {
      setError('Please describe what went wrong.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const urls = await Promise.all(disputeFiles.map((f) => uploadTransferEvidence(id, session.user.id, f)));
      const { error: disputeError } = await supabase.rpc('buyer_dispute_transfer', {
        p_transfer_id: id,
        p_dispute_type: disputeType,
        p_reason: disputeReason.trim(),
        p_evidence_urls: urls,
      });
      if (disputeError) throw disputeError;
      setShowDisputeForm(false);
      setDisputeReason('');
      setDisputeFiles([]);
      fetchAll();
    } catch (err: any) {
      setError(err.message || 'Could not submit the report.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof id !== 'string' || !session) return;
    if (!responseNote.trim()) {
      setError('Please explain your side of the dispute.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const urls = await Promise.all(responseFiles.map((f) => uploadTransferEvidence(id, session.user.id, f)));
      const { error: respondError } = await supabase.rpc('seller_respond_to_dispute', {
        p_transfer_id: id,
        p_note: responseNote.trim(),
        p_email: responseEmail.trim() || null,
        p_username: responseUsername.trim() || null,
        p_evidence_urls: urls,
      });
      if (respondError) throw respondError;
      setShowResponseForm(false);
      fetchAll();
    } catch (err: any) {
      setError(err.message || 'Could not submit your response.');
    } finally {
      setBusy(false);
    }
  };

  const handleReportNoResponse = async () => {
    if (typeof id !== 'string') return;
    const ok = window.confirm(
      'Report that the buyer never confirmed before the deadline? This sends the transfer to support for review.'
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    const { error: reportError } = await supabase.rpc('seller_report_no_response', { p_transfer_id: id });
    setBusy(false);
    if (reportError) {
      setError(reportError.message);
      return;
    }
    fetchAll();
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px', background: '#0a0b14', minHeight: '100vh' }}>Loading…</div>;
  }

  if (notFound || !transfer) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
          This transfer doesn't exist, or you don't have access to it — only the buyer, seller, and support staff can view it.
        </p>
        <Link href="/markets" style={{ color: 'var(--red)' }}>Back to markets</Link>
      </div>
    );
  }

  if (session && !isParticipant) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)' }}>You don't have access to this transfer.</p>
      </div>
    );
  }

  const otherParty = isBuyer ? seller : buyer;
  const statusInfo = getStatusInfo(transfer.status);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Transfer — {listing?.in_game_username || 'Account'} | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px 100px' }}>
        <Link href="/transfers" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← My Transfers
        </Link>

        {/* Summary card */}
        <div
          style={{
            background: '#131627',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', fontWeight: 700 }}>
              {gameTitle} Account Transfer
            </span>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0' }}>{listing?.in_game_username}</h1>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {isBuyer ? 'You are buying from' : 'You are selling to'}{' '}
              <strong style={{ color: '#fff' }}>{otherParty?.username || 'the other party'}</strong>
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>${transfer.price.toFixed(2)}</div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 12,
                background: statusInfo.bg,
                color: statusInfo.color,
                border: `1px solid ${statusInfo.color}`,
              }}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Escrow lock notice */}
        {transfer.status === 'in_progress' && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'rgba(255,178,56,0.1)',
              border: '1px solid var(--gold)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--gold)',
            }}
          >
            🔒 ${transfer.price.toFixed(2)} is locked in escrow and will only be released to the seller once both of you confirm the
            transfer is complete.
          </div>
        )}

        {/* Transfer deadline countdown */}
        {transfer.status === 'in_progress' && transfer.deadline_at && (() => {
          const msLeft = new Date(transfer.deadline_at).getTime() - now;
          const expired = msLeft <= 0;
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
              ⏱ {expired ? 'Transfer deadline has passed.' : `Deadline in ${formatCountdown(msLeft)}`}
              {isSeller && expired && !transfer.buyer_confirmed && (
                <button
                  onClick={handleReportNoResponse}
                  disabled={busy}
                  style={{
                    marginLeft: 12,
                    background: 'transparent',
                    border: '1px solid #ff4444',
                    color: '#ff4444',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Report Buyer Unresponsive
                </button>
              )}
            </div>
          );
        })()}

        {/* Contact reveal — buyer and seller can see each other's contact info */}
        {otherParty && (
          <div style={{ marginTop: 12, background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {isBuyer ? "Seller's" : "Buyer's"} contact
            </p>
            <p style={{ fontSize: 13, marginBottom: 8 }}>Username: <strong>{otherParty.username || '—'}</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(otherParty.whatsapp_phone || otherParty.whatsapp_username) && (
                <a
                  href={`https://wa.me/${(otherParty.whatsapp_phone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#25D366', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
                >
                  💬 WhatsApp: {otherParty.whatsapp_username || otherParty.whatsapp_phone}
                </a>
              )}
              {otherParty.discord_username && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5865F2', fontSize: 13, fontWeight: 700 }}>
                  🎮 Discord: {otherParty.discord_username}
                </span>
              )}
              {!otherParty.whatsapp_phone && !otherParty.whatsapp_username && !otherParty.discord_username && (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>They haven't connected WhatsApp or Discord yet — use the chat below.</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 4,
              fontSize: 13,
              background: 'rgba(255,0,0,0.1)',
              color: '#ff4444',
              border: '1px solid #ff4444',
            }}
          >
            {error}
          </div>
        )}

        {/* Chat */}
        <div
          style={{
            marginTop: 16,
            background: '#0f1120',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            height: 420,
          }}
        >
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                No messages yet. Use this chat to share your account share code, email, and phone number to complete the transfer.
              </p>
            ) : (
              messages.map((m) => {
                const mine = session && m.sender_id === session.user.id;
                const senderName = m.sender_id === transfer.buyer_id ? buyer?.username : seller?.username;
                return (
                  <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2, textAlign: mine ? 'right' : 'left' }}>
                      {senderName || 'User'}
                    </div>
                    <div
                      style={{
                        background: mine ? 'var(--red)' : '#1c2038',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 13,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--panel-border)' }}
          >
            <input
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={
                transfer.status === 'completed' || transfer.status === 'cancelled'
                  ? 'This transfer is closed.'
                  : 'Share the share code, email, and phone number here…'
              }
              disabled={transfer.status === 'completed' || transfer.status === 'cancelled'}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#131627',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            <button
              type="submit"
              disabled={sending || transfer.status === 'completed' || transfer.status === 'cancelled'}
              style={{ ...primaryBtn, padding: '10px 18px' }}
            >
              Send
            </button>
          </form>
        </div>

        {/* Action area */}
        {transfer.status === 'in_progress' && (
          <div style={{ marginTop: 16, background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              <span>Buyer confirmed: <strong style={{ color: transfer.buyer_confirmed ? '#29e7cd' : '#fff' }}>{transfer.buyer_confirmed ? 'Yes' : 'Not yet'}</strong></span>
              <span>Seller confirmed: <strong style={{ color: transfer.seller_confirmed ? '#29e7cd' : '#fff' }}>{transfer.seller_confirmed ? 'Yes' : 'Not yet'}</strong></span>
            </div>

            {isBuyer && !transfer.buyer_confirmed && !showDisputeForm && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={handleConfirm} disabled={busy} style={{ ...primaryBtn, flex: 1 }}>
                  ✅ Confirm — Account Matches Listing
                </button>
                <button onClick={() => setShowDisputeForm(true)} disabled={busy} style={{ ...dangerBtn, flex: 1 }}>
                  ⚠️ Report a Problem
                </button>
              </div>
            )}
            {isBuyer && transfer.buyer_confirmed && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>You've confirmed. Waiting for the seller to confirm as well.</p>
            )}

            {isSeller && !transfer.seller_confirmed && (
              <button onClick={handleConfirm} disabled={busy} style={{ ...primaryBtn, width: '100%' }}>
                ✅ Confirm — I've Delivered the Account
              </button>
            )}
            {isSeller && transfer.seller_confirmed && (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>You've confirmed delivery. Waiting for the buyer to confirm receipt.</p>
            )}

            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
              Once both sides confirm, funds are released and the transfer is finalized. This cannot be undone.
            </p>

            {showDisputeForm && (
              <form onSubmit={handleSubmitDispute} style={{ marginTop: 16, borderTop: '1px solid var(--panel-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>What went wrong?</label>
                  <select value={disputeType} onChange={(e) => setDisputeType(e.target.value as TransferDisputeType)} style={inputStyle}>
                    {DISPUTE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Describe the issue</label>
                  <textarea
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="What exactly doesn't match, or what failed?"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Upload evidence (screenshots, etc.)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setDisputeFiles(Array.from(e.target.files || []))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={busy} style={{ ...dangerBtn, flex: 1 }}>
                    {busy ? 'Submitting…' : 'Submit Report'}
                  </button>
                  <button type="button" onClick={() => setShowDisputeForm(false)} style={{ ...secondaryBtn, flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {transfer.status === 'disputed' && (
          <div style={{ marginTop: 16, background: '#131627', border: '1px solid #ff4444', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ff4444', marginBottom: 8 }}>⚠️ This transfer is under dispute</h3>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                {transfer.dispute_raised_by === transfer.seller_id ? "Seller's report" : "Buyer's report"}
              </p>
              <p style={{ fontSize: 13, marginBottom: 4 }}>
                Reason: <strong>{DISPUTE_OPTIONS.find((o) => o.value === transfer.dispute_type)?.label || 'Buyer unresponsive'}</strong>
              </p>
              <p style={{ fontSize: 13, color: '#d8dae0' }}>{transfer.dispute_reason}</p>
              {transfer.dispute_evidence_urls?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {transfer.dispute_evidence_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="Evidence" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--panel-border)' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {transfer.seller_responded_at ? (
              <div>
                <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Seller's response</p>
                <p style={{ fontSize: 13, color: '#d8dae0', marginBottom: 4 }}>{transfer.seller_response_note}</p>
                {transfer.seller_response_email && <p style={{ fontSize: 12 }}>Account email: <strong>{transfer.seller_response_email}</strong></p>}
                {transfer.seller_response_username && <p style={{ fontSize: 12 }}>In-game username: <strong>{transfer.seller_response_username}</strong></p>}
                {transfer.seller_response_evidence_urls?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {transfer.seller_response_evidence_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Evidence" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--panel-border)' }} />
                      </a>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Support is reviewing this dispute.</p>
              </div>
            ) : isSeller && transfer.dispute_raised_by !== transfer.seller_id ? (
              showResponseForm ? (
                <form onSubmit={handleSubmitResponse} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Your explanation</label>
                    <textarea
                      required
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="Explain what happened from your side."
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Account email (proof of ownership)</label>
                    <input value={responseEmail} onChange={(e) => setResponseEmail(e.target.value)} style={inputStyle} placeholder="account.email@example.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>In-game username</label>
                    <input value={responseUsername} onChange={(e) => setResponseUsername(e.target.value)} style={inputStyle} placeholder="Matches listing" />
                  </div>
                  <div>
                    <label style={labelStyle}>Upload evidence</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => setResponseFiles(Array.from(e.target.files || []))} style={inputStyle} />
                  </div>
                  <button type="submit" disabled={busy} style={primaryBtn}>
                    {busy ? 'Submitting…' : 'Submit Response'}
                  </button>
                </form>
              ) : (
                <button onClick={() => setShowResponseForm(true)} style={primaryBtn}>
                  Respond to This Dispute
                </button>
              )
            ) : isSeller ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Support is reviewing your report.</p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Waiting for the seller to respond. Support will review once they do.</p>
            )}
          </div>
        )}

        {transfer.status === 'completed' && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(41,231,205,0.1)', border: '1px solid #29e7cd', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#29e7cd' }}>🎉 Transfer completed successfully</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              Funds have been released to the seller. This transfer is now closed.
            </p>
          </div>
        )}

        {transfer.status === 'cancelled' && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Transfer cancelled</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>The buyer was refunded and the listing was reopened.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getStatusInfo(status: Transfer['status']) {
  switch (status) {
    case 'in_progress':
      return { label: 'In Progress', bg: 'rgba(41,231,205,0.15)', color: '#29e7cd' };
    case 'disputed':
      return { label: 'Disputed', bg: 'rgba(255,68,68,0.15)', color: '#ff4444' };
    case 'completed':
      return { label: 'Completed', bg: 'rgba(41,231,205,0.15)', color: '#29e7cd' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'rgba(255,255,255,0.1)', color: 'var(--muted)' };
    default:
      return { label: status, bg: 'rgba(255,255,255,0.1)', color: '#fff' };
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--muted)',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '12px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#fff',
  border: '1px solid var(--panel-border)',
  borderRadius: 4,
  padding: '12px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#ff4444',
  border: '1px solid #ff4444',
  borderRadius: 4,
  padding: '12px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  cursor: 'pointer',
};