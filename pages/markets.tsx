import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import FindByCode from '../components/FindByCode';
import SkeletonGrid from '../components/SkeletonGrid';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  hidden?: boolean;
}

export default function MarketsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketGames();
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
              .from('game-images')
              .getPublicUrl(game.image_url);
            resolvedImageUrl = publicUrlData.publicUrl;
          }
          return {
            ...game,
            image_url: resolvedImageUrl,
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

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ApexDuel | Game Account Marketplace</title>
      </Head>

      <section style={{ padding: '50px 20px 0', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          href="/sell"
          style={{
            background: 'var(--red)',
            color: '#fff',
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textDecoration: 'none',
            borderRadius: 2,
            transform: 'skewX(-10deg)',
            display: 'inline-block',
            boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>+ Sell Your Account</span>
        </Link>
      </section>

      <section style={{ padding: '30px 20px 50px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
          Game Account <span style={{ color: 'var(--red)' }}>Marketplace</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
          Pick a game to browse the accounts currently for sale.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <FindByCode />
        </div>
      </section>

      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px' }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, fontWeight: 700 }}>
          Available Games ({games.length})
        </h3>

        {loading ? (
          <SkeletonGrid count={8} height={260} minWidth={280} />
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '50px 0' }}>No games available yet.</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
              width: '100%',
            }}
          >
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/markets/game/${game.id}`}
                style={{
                  position: 'relative',
                  minHeight: 260,
                  borderRadius: 10,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  border: '1px solid var(--panel-border)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  ...(game.image_url
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(10,11,20,0.25) 0%, rgba(10,11,20,0.8) 60%, rgba(10,11,20,0.95) 100%), url(${game.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : { background: '#131627' }),
                }}
              >
                <div style={{ padding: 18 }}>
                  <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                    {game.category}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>
                    {game.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#d8dae0', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    {game.description || 'Explore verified accounts on sale for this game.'}
                  </p>
                  <div
                    style={{
                      background: 'var(--red)',
                      color: '#0a0b14',
                      textAlign: 'center',
                      padding: '10px',
                      fontWeight: 700,
                      fontSize: 13,
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
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