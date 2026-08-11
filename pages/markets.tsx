import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url?: string;
  hidden?: boolean;
}

export default function MarketsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMarketGames();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMarketGames = async () => {
    setLoading(true);
    try {
      const { data: gamesData, error } = await supabase
        .from('games')
        .select('*')
        .or('hidden.eq.false,hidden.is.null');

      if (error) throw error;

      if (gamesData) {
        const formattedGames = gamesData.map((game) => {
          let resolvedImageUrl = game.image_url;
          if (game.image_url && !game.image_url.startsWith('http')) {
            const { data: publicUrlData } = supabase.storage
              .from('game-covers')
              .getPublicUrl(game.image_url);
            resolvedImageUrl = publicUrlData.publicUrl;
          }
          return {
            ...game,
            image_url: resolvedImageUrl
          };
        });

        setGames(formattedGames);
      }
    } catch (err) {
      console.error('Error loading games from database:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ApexDuel | Game Account Marketplace</title>
      </Head>

      <Header />

      <section style={{ padding: '50px 20px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
          Game Account <span style={{ color: 'var(--red)' }}>Marketplace</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 28 }}>
          Explore games fetched directly from our database with bucket storage images. Search with instant suggestions, select a game, and view accounts available for sale.
        </p>

        <div ref={searchRef} style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search games in database..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
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

          {showSuggestions && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              zIndex: 50,
              maxHeight: 260,
              overflowY: 'auto',
              textAlign: 'left'
            }}>
              {filteredGames.length === 0 ? (
                <div style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 14 }}>
                  No matching games found in database.
                </div>
              ) : (
                filteredGames.map((game) => (
                  <Link 
                    key={game.id}
                    href={`/markets/game/${game.id}`}
                    onClick={() => setShowSuggestions(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      textDecoration: 'none',
                      color: '#fff',
                      borderBottom: '1px solid var(--panel-border)',
                      background: 'transparent',
                    }}
                  >
                    <img 
                      src={game.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'} 
                      alt={game.title}
                      style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{game.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase' }}>{game.category}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px' }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, fontWeight: 700 }}>
          Database Games Catalog ({filteredGames.length})
        </h3>

        {loading ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '50px 0' }}>Loading database games...</div>
        ) : filteredGames.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '50px 0' }}>No games match your search.</div>
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
                <div style={{ height: 160, width: '100%', background: '#0a0b14' }}>
                  <img 
                    src={game.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'} 
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                    {game.category}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>
                    {game.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.4, flexGrow: 1 }}>
                    {game.description || 'Explore verified accounts on sale for this game with secure escrow protection.'}
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