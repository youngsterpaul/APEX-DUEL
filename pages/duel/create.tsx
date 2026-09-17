import Head from 'next/head';
import { useState, useEffect } from 'react';
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

  // Session + the competing username the player has saved per game (from their profile).
  // Duels use a free-text game name, so we key the saved-usernames map by the lowercased,
  // trimmed game name instead of a game_id.
  const [session, setSession] = useState<any>(null);
  const [gameUsernames, setGameUsernames] = useState<Record<string, string>>({});

  // Post-creation "confirm your username" step — always shown, since the duel creator always plays.
  const [stage, setStage] = useState<'form' | 'confirm-username'>('form');
  const [pendingDuel, setPendingDuel] = useState<{ id: string; share_code: string } | null>(null);
  const [usernameChoice, setUsernameChoice] = useState<'saved' | 'custom' | null>(null);
  const [customUsername, setCustomUsername] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [confirmingUsername, setConfirmingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        supabase
          .from('profiles')
          .select('game_usernames')
          .eq('id', data.session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.game_usernames) setGameUsernames(profile.game_usernames);
          });
      }
    });
  }, []);

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

      // The duel creator always plays — confirm which username they'll compete under before wrapping up.
      setPendingDuel({ id: data.id, share_code: data.share_code });
      setUsernameChoice(null);
      setCustomUsername('');
      setSaveAsDefault(false);
      setUsernameError(null);
      setStage('confirm-username');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create match.' });
    } finally {
      setLoading(false);
    }
  };

  const gameKey = game.trim().toLowerCase();
  const gameLabel = game.trim() || 'this game';
  const savedUsername = gameKey ? gameUsernames[gameKey] : undefined;

  const confirmUsername = async (rawUsername: string) => {
    const finalUsername = rawUsername.trim();
    if (!finalUsername) {
      setUsernameError('Please enter the username you want to compete with.');
      return;
    }

    setUsernameError(null);
    setConfirmingUsername(true);
    try {
      // Persist which username this player is competing under for this duel, so their opponent
      // sees it. Adjust this call to match your schema — e.g. an UPDATE on duels.player1_username
      // where id = pendingDuel.id, or a dedicated RPC like the one referenced below.
      await supabase.rpc('set_event_participant_username', {
        p_event_type: 'duel',
        p_event_id: pendingDuel?.id,
        p_username: finalUsername,
      });

      if (saveAsDefault && gameKey && session) {
        const updated = { ...gameUsernames, [gameKey]: finalUsername };
        await supabase.from('profiles').update({ game_usernames: updated }).eq('id', session.user.id);
        setGameUsernames(updated);
      }
    } catch (err) {
      console.error('Failed to save competing username', err);
    } finally {
      setConfirmingUsername(false);
      if (pendingDuel) setCreated(pendingDuel);
    }
  };

  if (stage === 'confirm-username') {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
        <Head>
          <title>Confirm Your Username | ApexDuel</title>
        </Head>
        <section style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h2 className="display" style={{ fontSize: 24, marginBottom: 12, textTransform: 'uppercase' }}>
            One Last Thing
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Confirm the username your opponent will see you as for <strong style={{ color: '#fff' }}>{gameLabel}</strong>.
          </p>

          {usernameError && (
            <div
              style={{
                padding: 10,
                marginBottom: 16,
                borderRadius: 4,
                fontSize: 13,
                background: 'rgba(255,0,0,0.1)',
                color: '#ff4444',
                border: '1px solid #ff4444',
                textAlign: 'left',
              }}
            >
              {usernameError}
            </div>
          )}

          {savedUsername && usernameChoice !== 'custom' ? (
            <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Your saved username for {gameLabel}
              </p>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)', marginBottom: 20 }}>{savedUsername}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => confirmUsername(savedUsername)}
                  disabled={confirmingUsername}
                  style={{ ...primaryButtonStyle, flex: 1 }}
                >
                  {confirmingUsername ? 'Confirming…' : `Yes, use "${savedUsername}"`}
                </button>
                <button
                  type="button"
                  onClick={() => setUsernameChoice('custom')}
                  style={{ ...toggleStyle(false), flex: 1 }}
                >
                  Use a Different Username
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, textAlign: 'left' }}>
              <label style={labelStyle}>Username for {gameLabel}</label>
              <input
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder={`Your ${gameLabel} username`}
                style={inputStyle}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
                <input type="checkbox" checked={saveAsDefault} onChange={(e) => setSaveAsDefault(e.target.checked)} />
                Save as my default username for {gameLabel}
              </label>
              <button
                type="button"
                onClick={() => confirmUsername(customUsername)}
                disabled={confirmingUsername}
                style={{ ...primaryButtonStyle, width: '100%', marginTop: 16 }}
              >
                {confirmingUsername ? 'Confirming…' : 'Confirm & Continue'}
              </button>
              {savedUsername && (
                <button
                  type="button"
                  onClick={() => {
                    setUsernameChoice(null);
                    setUsernameError(null);
                  }}
                  style={{ ...backLinkStyle, marginTop: 12 }}
                >
                  ← Back to saved username
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

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

          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            After you create this match, we'll ask you to confirm the username you'll compete with for {gameLabel || 'this game'}.
          </p>

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