import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkeletonGrid from '../components/SkeletonGrid';
import Pagination from '../components/Pagination';

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

const GAMES_PAGE_SIZE = 6;
const LOBBIES_PAGE_SIZE = 5;

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);
  const [lobbiesPage, setLobbiesPage] = useState(1);

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

          <Link href="/challenges" style={categoryCardStyle('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 24, marginBottom: 8 }}>⚔️</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 18, fontWeight: 800 }}>1. Create or Find a Challenge</h4>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>Launch or join 1v1 match challenges instantly</p>
            </div>
          </Link>

          <Link href="/markets" style={categoryCardStyle('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 24, marginBottom: 8 }}>🛒</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 18, fontWeight: 800 }}>2. Sell or Buy Account</h4>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>Secure account marketplace protected by escrow</p>
            </div>
          </Link>

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
          {loading ? (
            <SkeletonGrid count={GAMES_PAGE_SIZE} height={200} minWidth={260} />
          ) : games.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>No games found.</div>
          ) : (
            games.slice((gamesPage - 1) * GAMES_PAGE_SIZE, gamesPage * GAMES_PAGE_SIZE).map((g) => (
              <Link
                key={g.id}
                href={`/challenges/game/${g.id}`}
                style={{
                  position: 'relative',
                  minHeight: 200,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--panel-border)',
                  backgroundImage: g.image_url
                    ? `linear-gradient(180deg, rgba(10,11,20,0.2), rgba(10,11,20,0.92)), url(${g.image_url})`
                    : 'linear-gradient(135deg, rgba(255,59,92,0.25), rgba(41,231,205,0.15))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 16,
                  textDecoration: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{g.category}</span>
                <h4 style={{ margin: '6px 0 8px', fontSize: 16, color: '#fff' }}>{g.title}</h4>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>
                  {g.description || 'Compete in organized matches, climb rankings, and win cash prizes through secure smart account transfer escrows.'}
                </p>
              </Link>
            ))
          )}
        </div>
        {!loading && games.length > 0 && (
          <Pagination page={gamesPage} totalPages={Math.max(1, Math.ceil(games.length / GAMES_PAGE_SIZE))} onChange={setGamesPage} />
        )}
      </section>
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