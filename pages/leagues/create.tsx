import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

interface Game {
  id: string;
  title: string;
}

export default function CreateLeague() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const [gameId, setGameId] = useState('');
  const [name, setName] = useState('');
  const [freeToJoin, setFreeToJoin] = useState(true);
  const [entryFee, setEntryFee] = useState('5');
  const [maxPlayers, setMaxPlayers] = useState('30');
  const [roundsPerOpponent, setRoundsPerOpponent] = useState<'1' | '2'>('1');

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

    setLoading(true);
    const { data, error } = await supabase.rpc('create_league', {
      p_game_id: gameId,
      p_name: name,
      p_entry_fee: fee,
      p_max_players: parseInt(maxPlayers, 10) || 30,
      p_rounds_per_opponent: parseInt(roundsPerOpponent, 10),
    });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setCreatedCode(data?.share_code ?? null);
  };

  if (createdCode) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
        <Head>
          <title>League Created | ApexDuel</title>
        </Head>
        <section style={{ maxWidth: 620, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 12, textTransform: 'uppercase' }}>
            League Created!
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
                ? 'Anyone can find and join this league for free from the Leagues page.'
                : 'Players pay a stake to join. The league is invite-only via your share code.'}
            </p>
          </div>

          {!freeToJoin && (
            <div>
              <label style={labelStyle}>Entry fee per player ($, min 1)</label>
              <input type="number" min="1" step="0.01" required value={entryFee} onChange={(e) => setEntryFee(e.target.value)} style={inputStyle} />
            </div>
          )}

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