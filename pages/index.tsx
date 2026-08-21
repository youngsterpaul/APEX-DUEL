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

const GAMES_PAGE_SIZE = 6;

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);

  useEffect(() => {
    fetchData();
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

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Head>
        <title>ApexDuel | Find Your Match, Prove Your Gaming Skills & Earn</title>
      </Head>

      {/* Hero Section */}
      <section style={{ padding: '30px 16px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 44px)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.02em', lineHeight: 1.2 }}>
          Find Your Match, <span style={{ color: 'var(--red)' }}>Prove Your Gaming Skills</span> & Earn
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: 1.5, maxWidth: 700, margin: '0 auto' }}>
          Explore game descriptions from our database, create or find challenges, buy and sell accounts securely, and join or host multiplayer competitions with escrow account transfers.
        </p>
      </section>

      {/* THREE MAIN INTERACTIVE CARDS SECTION */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 30px' }}>
        <h3 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 700 }}>
          Platform Action Hub
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

          <Link href="/challenges" style={categoryCardStyle('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>⚔️</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 16, fontWeight: 800 }}>1. Create or Find a Challenge</h4>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Launch or join 1v1 match challenges instantly</p>
            </div>
          </Link>

          <Link href="/markets" style={categoryCardStyle('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>🛒</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 18, fontWeight: 800 }}>2. Sell or Buy Account</h4>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Secure account marketplace protected by escrow</p>
            </div>
          </Link>

          <Link href="/tournaments" style={categoryCardStyle('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80')}>
            <div style={categoryOverlayStyle}>
              <span style={{ fontSize: 20, marginBottom: 4 }}>🏆</span>
              <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 16, fontWeight: 800 }}>3. Join Competition or Create a Competition</h4>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Participate in or host multi-player tournaments</p>
            </div>
          </Link>

        </div>
      </section>

      {/* GAMES DATABASE DESCRIPTIONS SECTION (Strict 2-Column Grid) */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 60px' }}>
        <h3 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 700 }}>
          Supported Games & Descriptions
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {loading ? (
            <SkeletonGrid count={GAMES_PAGE_SIZE} height={180} minWidth={140} />
          ) : games.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0', gridColumn: 'span 2' }}>
              No games found.
            </div>
          ) : (
            games.slice((gamesPage - 1) * GAMES_PAGE_SIZE, gamesPage * GAMES_PAGE_SIZE).map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                style={{
                  textDecoration: 'none',
                  position: 'relative',
                  minHeight: 180,
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
                  justify: 'flex-end',
                  padding: 12,
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {g.category}
                </span>
                <h4 style={{ margin: '4px 0 6px', fontSize: 'clamp(14px, 3.5vw, 16px)', color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
                  {g.title}
                </h4>
                <p
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.8)',
                    margin: 0,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
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
  minHeight: 110,
  display: 'flex',
  alignItems: 'flex-end',
  textDecoration: 'none',
  overflow: 'hidden',
  border: '1px solid var(--panel-border)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
});

const categoryOverlayStyle: React.CSSProperties = {
  padding: 12,
  width: '100%',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
};