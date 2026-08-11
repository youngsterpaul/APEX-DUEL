import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';

interface Game {
  id: string;
  title: string;
  category: string;
  image_url?: string;
}

interface Challenge {
  id: string;
  title: string;
  game_id: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  status: string;
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating a new challenge/competition
  const [selectedGameId, setSelectedGameId] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('2');
  const [creationMessage, setCreationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch games from database
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*');
      
      if (gamesError) throw gamesError;
      if (gamesData) setGames(gamesData);

      // Fetch active challenges/competitions from database
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .order('id', { ascending: false });

      if (challengeError) {
        console.log('Challenges table might need creation');
      } else if (challengeData) {
        setChallenges(challengeData);
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreationMessage({ type: 'error', text: 'You must be logged in to create a challenge or competition.' });
      return;
    }

    try {
      const { error } = await supabase.from('challenges').insert([
        {
          title: challengeTitle,
          game_id: selectedGameId,
          entry_fee: parseFloat(entryFee),
          max_players: parseInt(maxPlayers),
          current_players: 1,
          creator_id: session.user.id,
          status: 'open'
        }
      ]);

      if (error) throw error;

      setCreationMessage({ type: 'success', text: 'Challenge created successfully! Account transfer escrow secured.' });
      setChallengeTitle('');
      setEntryFee('');
      fetchData();
    } catch (err: any) {
      setCreationMessage({ type: 'error', text: err.message || 'Failed to create challenge.' });
    }
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ApexDuel | Find Your Match, Prove Your Gaming Skills & Earn</title>
      </Head>

      <Header />

      {/* Hero Section */}
      <section style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.02em', lineHeight: 1.2 }}>
          Find Your Match, <span style={{ color: 'var(--red)' }}>Prove Your Gaming Skills</span> & Earn
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.6, maxWidth: 720, margin: '0 auto 32px' }}>
          Welcome to ApexDuel. Discover games directly from our database, set up multi-player competitions, and join active matches. Pay entry fees securely via automated account transfers protected by our escrow contract logic.
        </p>
      </section>

      {/* Main Container Cards */}
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* CARD 1: Find or Create a Challenge */}
        <div style={cardStyle}>
          <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card One</span>
            <h2 style={{ fontSize: 22, marginTop: 4, textTransform: 'uppercase' }}>Create a Challenge</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Pick any game from our database, establish multi-player configurations, set your stakes, and launch your room.
          </p>

          {creationMessage && (
            <div style={{ padding: 10, marginBottom: 16, borderRadius: 4, fontSize: 13, background: creationMessage.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)', color: creationMessage.type === 'success' ? '#00ff64' : '#ff4444', border: `1px solid ${creationMessage.type === 'success' ? '#00ff64' : '#ff4444'}` }}>
              {creationMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateChallenge} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Select Database Game</label>
              <select 
                required 
                value={selectedGameId} 
                onChange={(e) => setSelectedGameId(e.target.value)}
                style={inputStyle}
              >
                <option value="">-- Choose a Game --</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>{game.title} ({game.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Competition Title</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Weekend Cup 1v1" 
                value={challengeTitle} 
                onChange={(e) => setChallengeTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Entry Price ($)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  required 
                  placeholder="5.00" 
                  value={entryFee} 
                  onChange={(e) => setEntryFee(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Max Players</label>
                <input 
                  type="number" 
                  min="2" 
                  max="50" 
                  required 
                  value={maxPlayers} 
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button type="submit" style={primaryButtonStyle}>
              Launch Challenge & Lock Escrow
            </button>
          </form>
        </div>

        {/* CARD 2: Join Organized Competitions & Smart Account Transfers */}
        <div style={cardStyle}>
          <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Two</span>
            <h2 style={{ fontSize: 22, marginTop: 4, textTransform: 'uppercase' }}>Join Organized Competitions</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Browse live player rooms. Pay game entry prices securely through standard account transfers backed by our built-in smart escrow protocol.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 390, overflowY: 'auto' }}>
            {challenges.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                No competitions found. Create one using Card One!
              </div>
            ) : (
              challenges.map((c) => (
                <div key={c.id} style={{ background: '#0a0b14', border: '1px solid var(--panel-border)', padding: 14, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#fff' }}>{c.title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Slots: {c.current_players} / {c.max_players} | Price: ${c.entry_fee}
                    </span>
                  </div>
                  <Link href={`/duels/${c.id}`} style={secondaryButtonStyle}>
                    Join Room
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#131627',
  border: '1px solid var(--panel-border)',
  borderRadius: 8,
  padding: 24,
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
};

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
  padding: '10px 12px',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#0a0b14',
  padding: '12px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: 8,
  borderRadius: 4,
  width: '100%',
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--red)',
  color: 'var(--red)',
  padding: '6px 14px',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  textDecoration: 'none',
  borderRadius: 4,
  display: 'inline-block',
  textAlign: 'center',
};