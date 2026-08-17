import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkeletonGrid from '../components/SkeletonGrid';
import Pagination from '../components/Pagination';
import { useCart } from '../lib/cartContext';

interface Tournament {
  id: string;
  game_id: string;
  name: string;
  format: string;
  created_by: string;
  entry_fee: number;
  prize_pool: number;
  payout_places: number;
  status: string;
  current_stage: number;
  share_code: string;
  created_at: string;
}

interface Game {
  id: string;
  title: string;
  image_url?: string;
}

const PAGE_SIZE = 6;

export default function Tournaments() {
  const { isInCart, addToCart } = useCart();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [gamesMap, setGamesMap] = useState<Record<string, Game>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const handleAddToCart = async (id: string) => {
    setCartMessage(null);
    const { error } = await addToCart(id, 'tournament');
    setCartMessage(error || 'Added to cart!');
    setTimeout(() => setCartMessage(null), 2000);
  };

  useEffect(() => {
    fetchTournamentsAndGames();
  }, []);

  const fetchTournamentsAndGames = async () => {
    setLoading(true);

    // 1. Fetch Tournaments
    const { data: tourneyData, error: tourneyError } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (tourneyError) {
      console.error('Error fetching tournaments:', tourneyError);
    } else if (tourneyData) {
      setTournaments(tourneyData);

      // Extract unique game IDs to fetch game titles & banners
      const gameIds = Array.from(new Set(tourneyData.map((t) => t.game_id).filter(Boolean)));
      if (gameIds.length > 0) {
        const { data: gamesData } = await supabase
          .from('games')
          .select('id, title, image_url')
          .in('id', gameIds);

        if (gamesData) {
          const map: Record<string, Game> = {};
          gamesData.forEach((g) => {
            map[g.id] = g;
          });
          setGamesMap(map);
        }
      }
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registration':
      case 'open':
        return { label: 'Registration Open', bg: 'rgba(41, 231, 205, 0.15)', color: '#29e7cd', border: '#29e7cd' };
      case 'ongoing':
      case 'live':
        return { label: 'Live Now', bg: 'rgba(255, 59, 92, 0.2)', color: 'var(--red)', border: 'var(--red)' };
      case 'completed':
      case 'finished':
        return { label: 'Completed', bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--muted)', border: 'rgba(255,255,255,0.2)' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'rgba(255,255,255,0.3)' };
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status.toLowerCase() === filterStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / PAGE_SIZE));
  const pageTournaments = filteredTournaments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', paddingBottom: 80 }}>
      <Head>
        <title>Tournaments | ApexDuel</title>
      </Head>

      {/* Hero Header Section */}
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
            Esports Arena
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 8, textTransform: 'uppercase' }}>
            Tournaments
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Compete in bracket & round-robin tournaments to win cash prizes.
          </p>
        </div>

        <Link
          href="/tournaments/create"
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
          <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>+ Host Tournament</span>
        </Link>
      </section>

      {/* Filters Bar */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['all', 'registration', 'live', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setFilterStatus(st);
                setPage(1);
              }}
              style={{
                background: filterStatus === st ? 'var(--red)' : '#131627',
                color: '#fff',
                border: '1px solid var(--panel-border)',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {st === 'all' ? 'All Events' : st}
            </button>
          ))}
        </div>
      </section>

      {/* Tournament Cards Grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
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
        {loading ? (
          <SkeletonGrid count={6} height={240} minWidth={320} />
        ) : pageTournaments.length === 0 ? (
          <div
            style={{
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            No tournaments found for this category.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {pageTournaments.map((t) => {
                const badge = getStatusBadge(t.status);
                const game = gamesMap[t.game_id];

                return (
                  <div
                    key={t.id}
                    style={{
                      background: '#131627',
                      border: '1px solid var(--panel-border)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {/* Header Image / Fallback Gradient */}
                    <div
                      style={{
                        height: 120,
                        backgroundImage: game?.image_url
                          ? `linear-gradient(180deg, rgba(10,11,20,0.2), rgba(19,22,39,0.95)), url(${game.image_url})`
                          : 'linear-gradient(135deg, rgba(255,59,92,0.3), rgba(41,231,205,0.15))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        padding: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: 'var(--gold)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: 'rgba(0,0,0,0.6)',
                          padding: '4px 8px',
                          borderRadius: 3,
                        }}
                      >
                        {game?.title || 'ESPORTS'}
                      </span>

                      {/* Status Tag */}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: 12,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Tournament Body Details */}
                    <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '8px 0 12px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {t.name}
                        </h3>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 12,
                            background: '#0a0b14',
                            padding: 12,
                            borderRadius: 6,
                            marginBottom: 16,
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Prize Pool</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#29e7cd' }}>${t.prize_pool}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Entry Fee</span>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>{t.entry_fee === 0 ? 'FREE' : `$${t.entry_fee}`}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Format</span>
                            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                              {t.format ? t.format.replace('_', ' ') : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Payouts</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Top {t.payout_places}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                          CODE: <strong style={{ color: '#fff' }}>{t.share_code || 'N/A'}</strong>
                        </span>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAddToCart(t.id)}
                            disabled={isInCart(t.id, 'tournament')}
                            style={{
                              background: isInCart(t.id, 'tournament') ? '#2a2d3a' : 'transparent',
                              border: '1px solid var(--panel-border)',
                              color: '#fff',
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              borderRadius: 4,
                              cursor: isInCart(t.id, 'tournament') ? 'default' : 'pointer',
                            }}
                          >
                            {isInCart(t.id, 'tournament') ? 'In Cart' : 'Add to Cart'}
                          </button>
                          <Link
                            href={`/tournaments/${t.id}`}
                            style={{
                              border: '1px solid var(--red)',
                              color: 'var(--red)',
                              padding: '8px 16px',
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              borderRadius: 4,
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
}