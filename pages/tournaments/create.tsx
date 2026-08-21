import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { uploadEventImage } from '../../lib/storage';

interface Game {
  id: string;
  title: string;
}

export default function CreateTournament() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const [gameId, setGameId] = useState('');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'round_robin' | 'elimination'>('elimination');
  const [gamesPerStage, setGamesPerStage] = useState('1');
  const [freeToJoin, setFreeToJoin] = useState(true);
  const [entryFee, setEntryFee] = useState('0');
  const [prizePool, setPrizePool] = useState('0');
  const [payoutPlaces, setPayoutPlaces] = useState<'1' | '2' | '3'>('1');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
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
      setMessage({ type: 'error', text: 'You must be signed in to host a tournament.' });
      return;
    }

    if (!gameId) {
      setMessage({ type: 'error', text: 'Please select a game.' });
      return;
    }

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Give your tournament a name.' });
      return;
    }

    const fee = freeToJoin ? 0 : parseFloat(entryFee) || 0;
    if (!freeToJoin && fee < 1) {
      setMessage({ type: 'error', text: 'Entry fee must be at least $1, or mark the tournament as free to join.' });
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

    const stages = [
      {
        name: format === 'round_robin' ? 'Group Stage' : 'Round 1',
        games_per_pairing: parseInt(gamesPerStage, 10) || 1,
        advance_count: null,
      },
    ];

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        imageUrl = await uploadEventImage('tournament', session.user.id, photo);
      }

      const { data, error } = await supabase.rpc('create_tournament', {
        p_game_id: gameId,
        p_name: name,
        p_format: format,
        p_stages: stages,
        p_entry_fee: fee,
        p_prize_pool: parseFloat(prizePool) || 0,
        p_payout_places: Number(payoutPlaces),
        p_starts_at: startsIso,
        p_ends_at: endsIso,
        p_image_url: imageUrl,
      });

      if (error) throw error;
      setCreatedCode(data?.share_code ?? null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create tournament.' });
    } finally {
      setLoading(false);
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  if (createdCode) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
        <Head>
          <title>Tournament Created | ApexDuel</title>
        </Head>
        <section style={{ maxWidth: 620, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 12, textTransform: 'uppercase' }}>
            Tournament Created!
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Share this code so others can find and join it:
          </p>
          <div
            className="mono"
            style={{
              display: 'inline-block',
              background: '#131627',
              border: '1px solid var(--panel-border)',
              padding: '16px 32px',
              fontSize: 28,
              letterSpacing: '0.3em',
              borderRadius: 6,
              color: 'var(--gold)',
              marginBottom: 24,
            }}
          >
            {createdCode}
          </div>
          <div>
            <button onClick={() => router.push('/tournaments')} style={primaryButtonStyle}>
              Go to Tournaments
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Host a Tournament | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <button onClick={() => router.push('/tournaments')} style={backLinkStyle}>
          ← Back to Tournaments
        </button>

        <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginTop: 20 }}>
          Esports Arena
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 38px)', textTransform: 'uppercase', margin: '8px 0 8px' }}>
          Host a Tournament
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
          Set up a bracket or round-robin event. Matches are assigned automatically once the field is full.
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
            <label style={labelStyle}>Tournament name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Friday Night Faceoff" />
          </div>

          <div>
            <label style={labelStyle}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as any)} style={inputStyle}>
              <option value="elimination">Single elimination</option>
              <option value="round_robin">Round robin (ranking)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Games per matchup (before the final)</label>
            <select value={gamesPerStage} onChange={(e) => setGamesPerStage(e.target.value)} style={inputStyle}>
              <option value="1">1 game</option>
              <option value="2">2 games</option>
            </select>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>The final is always a single game.</p>
          </div>

          <div>
            <label style={labelStyle}>Start time</label>
            <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>No one can register after this time.</p>
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
              Shown as the background on this tournament's page.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
            <input type="checkbox" checked={freeToJoin} onChange={(e) => setFreeToJoin(e.target.checked)} />
            Make this tournament free to join
          </label>

          {!freeToJoin && (
            <div>
              <label style={labelStyle}>Entry fee per player ($, min 1)</label>
              <input type="number" min="1" step="0.01" required value={entryFee} onChange={(e) => setEntryFee(e.target.value)} style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Prize pool ($, optional)</label>
            <input type="number" min="0" step="0.01" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Paid places</label>
            <select value={payoutPlaces} onChange={(e) => setPayoutPlaces(e.target.value as any)} style={inputStyle}>
              <option value="1">Top 1</option>
              <option value="2">Top 2</option>
              <option value="3">Top 3</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Creating...' : 'Create Tournament'}
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