import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
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

const GAMES_PAGE_SIZE = 6;

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: gamesData } = await supabase.from('games').select('*');
      if (gamesData) setGames(gamesData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredSuggestions([]);
      setIsSearching(false);
      return;
    }

    const matches = games.filter(
      (g) =>
        g.title.toLowerCase().includes(query.toLowerCase()) ||
        g.category.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredSuggestions(matches);
    setIsSearching(true);
  };

  const handleSelectGame = (gameId: string) => {
    setIsSearching(false);
    setSearchQuery('');
    router.push(`/challenges/game/${gameId}`);
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ApexDuel | Find Your Match, Prove Your Gaming Skills & Earn</title>
      </Head>

      {/* Hero Section */}
      <section style={{ padding: '40px 20px 30px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.02em', lineHeight: 1.2 }}>
          Find Your Match, <span style={{ color: 'var(--red)' }}>Prove Your Gaming Skills</span> & Earn
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6, maxWidth: 700, margin: '0 auto' }}>
          Explore games, create or find challenges, buy and sell accounts securely, and join or host multiplayer competitions with escrow account transfers.
        </p>
      </section>

      {/* THREE MAIN INTERACTIVE CARDS SECTION */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 40px' }}>
        <h3 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontWeight: 700 }}>
          Platform Action Hub
        </h3>

        <div className="action-hub-grid">
          <Link href="/challenges" style={categoryCardStyle('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 18, marginBottom: 4 }}>⚔️</span>
              <h4 style={cardTitleStyle}>1. Create / Find Challenge</h4>
              <p style={cardDescriptionStyle}>1v1 match challenges</p>
            </div>
          </Link>

          <Link href="/markets" style={categoryCardStyle('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 18, marginBottom: 4 }}>🛒</span>
              <h4 style={cardTitleStyle}>2. Sell / Buy Account</h4>
              <p style={cardDescriptionStyle}>Secure escrow marketplace</p>
            </div>
          </Link>

          <Link href="/tournaments" style={categoryCardStyle('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 18, marginBottom: 4 }}>🏆</span>
              <h4 style={cardTitleStyle}>3. Join / Host Competition</h4>
              <p style={cardDescriptionStyle}>Multi-player tournaments</p>
            </div>
          </Link>
        </div>
      </section>

      {/* GAME SEARCH & SUGGESTION SECTION */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 30px' }}>
        <div ref={searchRef} style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 14, fontSize: 16, color: 'var(--muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search available games by title or genre..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() !== '' && setIsSearching(true)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--panel-border)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {isSearching && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 6,
                background: '#121422',
                border: '1px solid var(--panel-border)',
                borderRadius: 8,
                maxHeight: 280,
                overflowY: 'auto',
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {game.image_url && (
                      <img
                        src={game.image_url}
                        alt={game.title}
                        style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{game.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {game.category}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '14px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                  No games matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* GAMES DATABASE DESCRIPTIONS SECTION */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
        <h3 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontWeight: 700 }}>
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

      <style jsx>{`
        .action-hub-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* On small screens, keep cards strictly in 1 single scrollable row */
        @media (max-width: 640px) {
          .action-hub-grid {
            grid-template-columns: repeat(3, minmax(140px, 1fr));
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
          }
          .action-hub-grid > :global(a) {
            scroll-snap-align: start;
          }
        }
      `}</style>
    </div>
  );
}

const categoryCardStyle = (bgImage: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.85)), url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: 8,
  height: 105,
  display: 'flex',
  alignItems: 'flex-end',
  textDecoration: 'none',
  overflow: 'hidden',
  border: '1px solid var(--panel-border)',
  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
  flexShrink: 0,
});

const categoryOverlayStyle: React.CSSProperties = {
  padding: 10,
  width: '100%',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  textTransform: 'uppercase',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.25,
};

const cardDescriptionStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--muted)',
  margin: '3px 0 0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};