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

const PAGE_SIZE = 8;

export default function Markets() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    const { data } = await supabase.from('games').select('*').order('title', { ascending: true });
    if (data) setGames(data);
    setLoading(false);
  };

  const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const pageGames = games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Markets | ApexDuel</title>
      </Head>

      <section
        style={{
          padding: '48px 24px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Markets
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 8, textTransform: 'uppercase' }}>
            Choose a Game
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
            Tap a game to see accounts currently for sale.
          </p>
        </div>

        {/* Sell Account Button */}
        <Link
          href="/markets/sell"
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
            marginTop: 12,
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>Sell Account</span>
        </Link>
      </section>

      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        {loading ? (
          <SkeletonGrid count={8} height={220} />
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>No games available yet.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {pageGames.map((g) => (
                <Link
                  key={g.id}
                  href={`/markets/${g.id}`}
                  style={{
                    position: 'relative',
                    height: 220,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--panel-border)',
                    backgroundImage: g.image_url
                      ? `linear-gradient(180deg, rgba(10,11,20,0.15), rgba(10,11,20,0.9)), url(${g.image_url})`
                      : 'linear-gradient(135deg, rgba(255,59,92,0.25), rgba(41,231,205,0.15))',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 18,
                    textDecoration: 'none',
                    color: '#fff',
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {g.category}
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 6px', textTransform: 'uppercase' }}>
                    {g.title}
                  </h3>
                  {g.description && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>
                      {g.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}