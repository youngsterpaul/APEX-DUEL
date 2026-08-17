import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkeletonGrid from '../components/SkeletonGrid';
import Pagination from '../components/Pagination';
import { useCart } from '../lib/cartContext';

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
  type?: string;
}

const GAMES_PAGE_SIZE = 8;
const LOBBIES_PAGE_SIZE = 6;

export default function Challenges() {
  const { isInCart, addToCart } = useCart();
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(true);
  const [lobbiesPage, setLobbiesPage] = useState(1);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const handleAddToCart = async (id: string) => {
    setCartMessage(null);
    const { error } = await addToCart(id, 'challenge');
    setCartMessage(error || 'Added to cart!');
    setTimeout(() => setCartMessage(null), 2000);
  };

  useEffect(() => {
    fetchGames();
    fetchChallenges();
  }, []);

  const fetchGames = async () => {
    setGamesLoading(true);
    const { data } = await supabase.from('games').select('*').order('title', { ascending: true });
    setGames(data || []);
    setGamesLoading(false);
  };

  const fetchChallenges = async () => {
    setLobbiesLoading(true);
    const { data } = await supabase.from('challenges').select('*').order('id', { ascending: false });
    setChallenges(data || []);
    setLobbiesLoading(false);
  };

  const gameTitleFor = (gameId: string) => games.find((g) => g.id === gameId)?.title || 'Unknown Game';

  const gamesTotalPages = Math.max(1, Math.ceil(games.length / GAMES_PAGE_SIZE));
  const pageGames = games.slice((gamesPage - 1) * GAMES_PAGE_SIZE, gamesPage * GAMES_PAGE_SIZE);

  const lobbiesTotalPages = Math.max(1, Math.ceil(challenges.length / LOBBIES_PAGE_SIZE));
  const pageChallenges = challenges.slice((lobbiesPage - 1) * LOBBIES_PAGE_SIZE, lobbiesPage * LOBBIES_PAGE_SIZE);

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

        {/* Create Challenge Button */}
        <Link
          href="/challenges/create"
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
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>+ Create Challenge</span>
        </Link>
      </section>

      {/* Available games grid */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        {gamesLoading ? (
          <SkeletonGrid count={8} height={180} minWidth={260} />
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>No games available yet.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {pageGames.map((g) => (
                <div
                  key={g.id}
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
                </div>
              ))}
            </div>
            <Pagination page={gamesPage} totalPages={gamesTotalPages} onChange={setGamesPage} />
          </>
        )}
      </section>

      {/* Active challenges list */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 className="display" style={{ fontSize: 26, marginBottom: 18, textTransform: 'uppercase' }}>
          Live Lobbies
        </h2>

        {cartMessage && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 4,
              fontSize: 13,
              textAlign: 'center',
              background: 'rgba(41,231,205,0.1)',
              color: '#29e7cd',
              border: '1px solid #29e7cd',
            }}
          >
            {cartMessage}
          </div>
        )}

        {lobbiesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72 }} />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>
            No active competitions yet. Tap "Create Challenge" above to launch one.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pageChallenges.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    padding: 16,
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{c.title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {(c.type || '1v1').toUpperCase()} · {gameTitleFor(c.game_id)} · Slots {c.current_players}/{c.max_players} · Entry ${c.entry_fee}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleAddToCart(c.id)}
                      disabled={isInCart(c.id, 'challenge')}
                      style={{
                        background: isInCart(c.id, 'challenge') ? '#2a2d3a' : 'transparent',
                        border: '1px solid var(--panel-border)',
                        color: '#fff',
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        borderRadius: 4,
                        cursor: isInCart(c.id, 'challenge') ? 'default' : 'pointer',
                      }}
                    >
                      {isInCart(c.id, 'challenge') ? 'In Cart' : 'Add to Cart'}
                    </button>
                    <Link
                      href={`/duels/${c.id}`}
                      style={{
                        border: '1px solid var(--red)',
                        color: 'var(--red)',
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        borderRadius: 4,
                        textDecoration: 'none',
                      }}
                    >
                      Join Room
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={lobbiesPage} totalPages={lobbiesTotalPages} onChange={setLobbiesPage} />
          </>
        )}
      </section>
    </div>
  );
}