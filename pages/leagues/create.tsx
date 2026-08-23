import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { uploadEventImage } from '../../lib/storage';
import ShareInvite from '../../components/ShareInvite';

interface Game {
  id: string;
  title: string;
}

export default function CreateLeague() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [created, setCreated] = useState<{ id: string; share_code: string } | null>(null);

  const [gameId, setGameId] = useState('');
  const [name, setName] = useState('');
  const [freeToJoin, setFreeToJoin] = useState(true);
  const [entryFee, setEntryFee] = useState('5');
  const [hostFee, setHostFee] = useState('50');
  const [maxPlayers, setMaxPlayers] = useState('30');
  const [roundsPerOpponent, setRoundsPerOpponent] = useState<'1' | '2'>('1');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [joinMode, setJoinMode] = useState<'open' | 'approval'>('open');
  const [creatorPlays, setCreatorPlays] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('games')
      .select('id, title')
      .or('hidden.eq.false,hidden.is.null')
      .order('title')
      .then(({ data }) => {
        if (data) {
          setGames(data);
          if (data[0]) setGameId(data[0].id);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: 'error', text: 'You must be signed in to create a league.' });
      return;
    }

    if (!gameId) {
      setMessage({ type: 'error', text: 'Please select a game.' });
      return;
    }

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Give your league a name.' });
      return;
    }

    const fee = freeToJoin ? 0 : parseFloat(entryFee) || 0;
    if (!freeToJoin && fee < 1) {
      setMessage({ type: 'error', text: 'Entry fee must be at least $1, or mark the league as free to participate.' });
      return;
    }

    const hFee = parseFloat(hostFee) || 0;
    if (freeToJoin && hFee < 50) {
      setMessage({ type: 'error', text: 'Free leagues require a hosting fee of at least $50, paid by you as the creator.' });
      return;
    }

    const startsIso = startsAt ? new Date(startsAt).toISOString() : null;
    const endsIso = endsAt ? new Date(endsAt).toISOString() : null;
    if (startsIso && new Date(startsIso).getTime() <= Date.now()) {
      setMessage({ type: 'error', text: 'Start time must be in the future.' });
      return;
    }
    if (startsIso && endsIso && new Date(endsIso).getTime() <= new Date(startsIso).getTime()) {
      setMessage({ type: 'error', text: 'End time must be after the start time.' });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        imageUrl = await uploadEventImage('league', session.user.id, photo);
      }

      const { data, error } = await supabase.rpc('create_league', {
        p_game_id: gameId,
        p_name: name,
        p_entry_fee: fee,
        p_max_players: parseInt(maxPlayers, 10) || 30,
        p_rounds_per_opponent: parseInt(roundsPerOpponent, 10),
        p_starts_at: startsIso,
        p_ends_at: endsIso,
        p_image_url: imageUrl,
        p_host_fee: freeToJoin ? hFee : 0,
        p_join_mode: joinMode,
        p_creator_plays: creatorPlays,
      });

      if (error) throw error;
      setCreated({ id: data.id, share_code: data.share_code });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create league.' });
    } finally {
      setLoading(false);
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  if (created) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
        <Head>
          <title>League Created | ApexDuel</title>
        </Head>
        <section style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 20, textTransform: 'uppercase' }}>
            League Created!
          </h2>
          <ShareInvite kind="league" entityId={created.id} shareCode={created.share_code} />
          <div style={{ marginTop: 20 }}>
            <button onClick={() => router.push('/leagues')} style={primaryButtonStyle}>
              Go to Leagues
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Create a League | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <button onClick={() => router.push('/leagues')} style={backLinkStyle}>
          ← Back to Leagues
        </button>

        <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginTop: 20 }}>
          Esports Arena
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 38px)', textTransform: 'uppercase', margin: '8px 0 8px' }}>
          Create a League
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
          Run a season-long league where every player faces every other player for ranking points.
        </p>

        {message && (
          <div
            style={{
              padding: 12,
              marginBottom: 20,
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Game</label>
            <select required value={gameId} onChange={(e) => setGameId(e.target.value)} style={inputStyle}>
              {games.length === 0 && <option value="">No games available</option>}
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>League name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Season 1 Ranked League" />
          </div>

          <div>
            <label style={labelStyle}>Max players (up to 30)</label>
            <input type="number" min="2" max="30" required value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Each player faces every other player</label>
            <select value={roundsPerOpponent} onChange={(e) => setRoundsPerOpponent(e.target.value as '1' | '2')} style={inputStyle}>
              <option value="1">Once</option>
              <option value="2">Twice</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Start time</label>
            <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>No one can join after this time.</p>
          </div>

          <div>
            <label style={labelStyle}>End time</label>
            <input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Anyone who never reported a pending match forfeits it to their opponent at this time.
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
              Shown as the background on this league's page.
            </p>
          </div>

          {/* Free to participate vs paid entry — categorization shown on the leagues page */}
          <div>
            <label style={labelStyle}>Entry type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setFreeToJoin(true)}
                style={toggleStyle(freeToJoin)}
              >
                Free to Participate
              </button>
              <button
                type="button"
                onClick={() => setFreeToJoin(false)}
                style={toggleStyle(!freeToJoin)}
              >
                Paid Entry
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              {freeToJoin
                ? 'Free for players to join. As the host, you pay a one-time hosting fee instead.'
                : 'Players pay a stake to join. The league is invite-only via your share code.'}
            </p>
          </div>

          {freeToJoin ? (
            <div>
              <label style={labelStyle}>Hosting fee ($, min 50) — paid by you</label>
              <input type="number" min="50" step="0.01" required value={hostFee} onChange={(e) => setHostFee(e.target.value)} style={inputStyle} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                Since this league is free for players, you cover the cost of hosting it — minimum $50.
              </p>
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Entry fee per player ($, min 1)</label>
              <input type="number" min="1" step="0.01" required value={entryFee} onChange={(e) => setEntryFee(e.target.value)} style={inputStyle} />
            </div>
          )}

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
                ? 'Anyone who requests to join gets in immediately.'
                : "You'll see each join request and can approve or decline it before that player is locked in."}
            </p>
          </div>

          <div>
            <label style={labelStyle}>Will you also play?</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setCreatorPlays(false)} style={toggleStyle(!creatorPlays)}>
                Just Hosting
              </button>
              <button type="button" onClick={() => setCreatorPlays(true)} style={toggleStyle(creatorPlays)}>
                I'll Play Too
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              {creatorPlays
                ? "You'll be added as a participant right away, and pay the entry fee if this league is paid entry."
                : "You won't play — you'll just host and can watch the standings as they come in."}
            </p>
          </div>

          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            After each match, players have 12 hours to mark win / loss / draw. If only one side marks a result in time, that result is applied automatically.
          </p>

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Creating...' : 'Create League'}
          </button>
        </form>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#131627',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#0a0b14',
  padding: '13px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  fontSize: 14,
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