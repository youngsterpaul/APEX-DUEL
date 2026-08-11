import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string;
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
      const { data: gamesData } = await supabase.from('games').select('*');
      if (gamesData) setGames(gamesData);

      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .order('id', { ascending: false });
      if (challengeData) setChallenges(challengeData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreationMessage({ type: 'error', text: 'You must be logged in to create a challenge.' });
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
      <section style={{ padding: '50px 20px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 50px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.02em', lineHeight: 1.2 }}>
          Find Your Match, <span style={{ color: 'var(--red)' }}>Prove Your Gaming Skills</span> & Earn
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 700, margin: '0 auto' }}>
          Explore game descriptions from our database, create or find challenges, buy and sell accounts securely, and join or host multiplayer competitions with escrow account transfers.
        </p>
      </section>

      {/* THREE MAIN INTERACTIVE CARDS SECTION */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 40px' }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontWeight: 700 }}>
          Platform Action Hub
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          
          {/* Card 1: Create or Find a Challenge */}
          <Link href="/challenges" style={categoryCardStyle('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 24, marginBottom: 8 }}>⚔️</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 18, fontWeight: 800 }}>1. Create or Find a Challenge</h4>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>Launch or join 1v1 match challenges instantly</p>
            </div>
          </Link>

          {/* Card 2: Sell or Buy Account */}
          <Link href="/markets" style={categoryCardStyle('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 24, marginBottom: 8 }}>🛒</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 18, fontWeight: 800 }}>2. Sell or Buy Account</h4>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>Secure account marketplace protected by escrow</p>
            </div>
          </Link>

          {/* Card 3: Join Competition or Create a Competition */}
          <Link href="/tournaments" style={categoryCardStyle('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 24, marginBottom: 8 }}>🏆</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 18, fontWeight: 800 }}>3. Join Competition or Create a Competition</h4>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>Participate in or host multi-player tournaments</p>
            </div>
          </Link>

        </div>
      </section>

      {/* GAMES DATABASE DESCRIPTIONS SECTION */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 40px' }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontWeight: 700 }}>
          Supported Games & Descriptions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {games.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>Loading game titles and descriptions from database...</div>
          ) : (
            games.map((g) => (
              <div key={g.id} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{g.category}</span>
                <h4 style={{ margin: '6px 0 8px', fontSize: 16, color: '#fff' }}>{g.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                  {g.description || 'Compete in organized matches, climb rankings, and win cash prizes through secure smart account transfer escrows.'}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* QUICK CHALLENGE CREATION & LIVE ROOMS */}
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* Challenge Creator Form */}
        <div style={cardStyle}>
          <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Launch</span>
            <h2 style={{ fontSize: 22, marginTop: 4, textTransform: 'uppercase' }}>Create a Challenge</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Pick any database game, set your stakes, and launch your room.
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

        {/* Live Competitions List */}
        <div style={cardStyle}>
          <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Lobbies</span>
            <h2 style={{ fontSize: 22, marginTop: 4, textTransform: 'uppercase' }}>Join Active Competitions</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Browse open rooms and join matches backed by account transfer escrow.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 390, overflowY: 'auto' }}>
            {challenges.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                No active competitions found. Create one using the form!
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

const categoryCardStyle = (bgImage: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: 8,
  height: 140,
  display: 'flex',
  alignItems: 'flex-end',
  textDecoration: 'none',
  overflow: 'hidden',
  border: '1px solid var(--panel-border)',
  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
});

const categoryOverlayStyle: React.CSSProperties = {
  padding: 16,
  width: '100%',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
};

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