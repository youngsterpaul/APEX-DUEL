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
  account_count?: number;
  hidden?: boolean;
}

export default function MarketsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketGames();
  }, []);

  const fetchMarketGames = async () => {
    setLoading(true);
    try {
      // Fetch games from database where hidden is false or null
      const { data: gamesData, error } = await supabase
        .from('games')
        .select('*')
        .or('hidden.eq.false,hidden.is.null');

      if (error) throw error;

      if (gamesData) {
        // Fetch active account listings counts per game
        const { data: listingsData } = await supabase
          .from('market_listings')
          .select('game_title, status')
          .eq('status', 'active');

        // Attach account counts to each game card
        const enrichedGames = gamesData.map((game) => {
          const count = listingsData 
            ? listingsData.filter((l) => l.game_title && l.game_title.toLowerCase() === game.title.toLowerCase()).length 
            : 0;
          return { ...game, account_count: count };
        });

        setGames(enrichedGames);
      }
    } catch (err) {
      console.error('Error loading market games from database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter games based on search input
  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ApexDuel | Account Marketplace - Search Games</title>
      </Head>

      <Header />

      {/* Hero Header & Search Bar */}
      <section style={{ padding: '50px 20px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
          Game Account <span style={{ color: 'var(--red)' }}>Marketplace</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
          Search our database for available games, view active accounts for sale on each game card, and open specific game listings protected by secure escrow.
        </p>

        {/* Database Game Search Bar */}
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search game name or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px 14px 46px',
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 16,
              outline: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          />
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--muted)' }}>
            🔍
          </span>
        </div>
      </section>

      {/* Games Grid with Fixed Card Layout Responsive to Screen Width */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px' }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, fontWeight: 700 }}>
          Available Games ({filteredGames.length})
        </h3>

        {loading ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '50px 0' }}>Loading database games...</div>
        ) : filteredGames.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '50px 0' }}>No games found matching your search query.</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: 24,
            width: '100%'
          }}>
            {filteredGames.map((game) => (
              <Link 
                key={game.id} 
                href={`/markets/game/${game.id}`}
                style={{
                  background: '#131627',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                {/* Game Image with Overlaid Account Count Badge */}
                <div style={{ position: 'relative', height: 160, width: '100%', background: '#0a0b14' }}>
                  <img 
                    src={game.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'} 
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(10, 11, 20, 0.85)',
                    border: '1px solid var(--red)',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                  }}>
                    🛒 {game.account_count || 0} Accounts For Sale
                  </div>
                </div>

                {/* Game Details & Description */}
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                    {game.category}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>
                    {game.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.4, flexGrow: 1 }}>
                    {game.description || 'Explore verified accounts on sale for this game with instant secure escrow delivery.'}
                  </p>
                  <div style={{
                    background: 'var(--red)',
                    color: '#0a0b14',
                    textAlign: 'center',
                    padding: '10px',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    View Accounts on Sale
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}