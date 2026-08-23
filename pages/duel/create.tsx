import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { uploadEventImage } from '../../lib/storage';
import ShareInvite from '../../components/ShareInvite';

export default function CreateDuel() {
  const router = useRouter();
  const [game, setGame] = useState('');
  const [entryFee, setEntryFee] = useState('5');
  const [scheduledAt, setScheduledAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [joinMode, setJoinMode] = useState<'open' | 'approval'>('open');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [created, setCreated] = useState<{ id: string; share_code: string } | null>(null);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: 'error', text: 'You must be signed in to create a match.' });
      return;
    }

    if (!game.trim()) {
      setMessage({ type: 'error', text: 'Enter which game this match is for.' });
      return;
    }

    const fee = parseFloat(entryFee) || 0;
    if (fee < 1) {
      setMessage({ type: 'error', text: 'Entry fee must be at least $1 — 1v1 matches can\'t be free.' });
      return;
    }

    const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    if (scheduledIso && new Date(scheduledIso).getTime() <= Date.now()) {
      setMessage({ type: 'error', text: 'Start time must be in the future.' });
      return;
    }
    const endsIso = endsAt ? new Date(endsAt).toISOString() : null;
    if (scheduledIso && endsIso && new Date(endsIso).getTime() <= new Date(scheduledIso).getTime()) {
      setMessage({ type: 'error', text: 'End time must be after the start time.' });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        imageUrl = await uploadEventImage('duel', session.user.id, photo);
      }

      const { data, error } = await supabase.rpc('create_duel', {
        p_game: game.trim(),
        p_entry_fee: fee,
        p_scheduled_at: scheduledIso,
        p_image_url: imageUrl,
        p_ends_at: endsIso,
        p_join_mode: joinMode,
      });

      if (error) throw error;
      setCreated({ id: data.id, share_code: data.share_code });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create match.' });
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
        <Head><title>Match Created | ApexDuel</title></Head>
        <section style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 20, textTransform: 'uppercase' }}>Match Created!</h2>
          <ShareInvite kind="duel" entityId={created.id} shareCode={created.share_code} />
          <div style={{ marginTop: 20 }}>
            <button onClick={() => router.push('/duels')} style={primaryButtonStyle}>Go to Matches</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head><title>Create a 1v1 Match | ApexDuel</title></Head>

      <section style={{ maxWidth: 620, margin: '0 auto', padding: '48px 24px 80px' }}>
        <button onClick={() => router.push('/duels')} style={backLinkStyle}>← Back to Matches</button>

        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 38px)', textTransform: 'uppercase', margin: '20px 0 8px' }}>
          Create a 1v1 Match
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
          Once someone joins, you can both no longer be joined by others — and a chat opens between you two.
        </p>

        {message && (
          <div style={{ padding: 12, marginBottom: 20, borderRadius: 4, fontSize: 13, background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid #ff4444' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Game</label>
            <input required value={game} onChange={(e) => setGame(e.target.value)} style={inputStyle} placeholder="e.g. Apex Legends" />
          </div>

          <div>
            <label style={labelStyle}>Start time (optional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              If set, no one can join this match after this time passes.
            </p>
          </div>

          <div>
            <label style={labelStyle}>End time (optional)</label>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              When the match should be wrapped up by. Shown as a countdown on the match page.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Background photo (optional)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPhotoChange} style={inputStyle} />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                style={{ marginTop: 10, width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--panel-border)' }}
              />
            )}
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Shown as the background on this match's page.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Entry fee per player ($, min 1)</label>
            <input type="number" min="1" step="0.01" required value={entryFee} onChange={(e) => setEntryFee(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Charged to you now, and to your opponent when they join. Winner takes the pot once you both confirm the result. 1v1 matches can't be free.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Who can join</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setJoinMode('open')} style={toggleStyle(joinMode === 'open')}>
                Free for Everyone
              </button>
              <button type="button" onClick={() => setJoinMode('approval')} style={toggleStyle(joinMode === 'approval')}>
                I Confirm Each Entry
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              {joinMode === 'open'
                ? 'Anyone can join instantly — first to tap Join gets the spot.'
                : "You'll see a request when someone wants to join, and can approve or decline it before they're locked in."}
            </p>
          </div>

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Creating…' : 'Create Match'}
          </button>
        </form>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#131627', border: '1px solid var(--panel-border)', color: '#fff', borderRadius: 4, fontSize: 14 };
const primaryButtonStyle: React.CSSProperties = { background: 'var(--red)', color: '#0a0b14', padding: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 4, fontSize: 14, width: '100%' };
const backLinkStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0 };
const toggleStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px 14px',
  background: active ? 'var(--red)' : '#131627',
  color: '#fff',
  border: '1px solid var(--panel-border)',
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  cursor: 'pointer',
});
