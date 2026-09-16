import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkeletonGrid from '../components/SkeletonGrid';
import Pagination from '../components/Pagination';
import FindByCode from '../components/FindByCode';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url?: string;
}

const GAMES_PAGE_SIZE = 8;

export default function Challenges() {
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setGamesLoading(true);
    const { data } = await supabase.from('games').select('*').order('title', { ascending: true });
    setGames(data || []);
    setGamesLoading(false);
  };

  const gamesTotalPages = Math.max(1, Math.ceil(games.length / GAMES_PAGE_SIZE));
  const pageGames = games.slice((gamesPage - 1) * GAMES_PAGE_SIZE, gamesPage * GAMES_PAGE_SIZE);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Challenges | ApexDuel</title>
      </Head>

      <section
        style={{
          padding: '48px 24px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Challenges
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 8, textTransform: 'uppercase' }}>
            Available Games
          </h1>
        </div>
      </section>

      {/* Search by share code — 1v1, tournament, or league */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 32px' }}>
        <div
          style={{
            background: '#131627',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            padding: '18px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Have a code?
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
              Find a 1v1 challenge, tournament, or league and jump straight to it to join.
            </p>
          </div>
          <FindByCode />
        </div>
      </section>

      {/* Available games grid */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        {gamesLoading ? (
          <SkeletonGrid count={8} height={180} minWidth={260} />
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>No games available yet.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {pageGames.map((g) => (
                <Link
                  key={g.id}
                  href={`/challenges/game/${g.id}`}
                  style={{
                    position: 'relative',
                    height: 180,
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
                    padding: 16,
                    textDecoration: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {g.category}
                  </span>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '4px 0 0', textTransform: 'uppercase' }}>
                    {g.title}
                  </h3>
                </Link>
              ))}
            </div>
            <Pagination page={gamesPage} totalPages={gamesTotalPages} onChange={setGamesPage} />
          </>
        )}
      </section>
    </div>
  );
}