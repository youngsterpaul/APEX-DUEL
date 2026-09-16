import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SkeletonGrid from '../components/SkeletonGrid';
import Pagination from '../components/Pagination';
import { useCart } from '../lib/cartContext';

interface LeagueRow {
  id: string;
  game_id: string;
  name: string;
  created_by: string;
  status: string;
  entry_fee?: number | null;
  share_code: string;
  created_at: string;
}

interface Game {
  id: string;
  title: string;
  image_url?: string;
}

const PAGE_SIZE = 6;

export default function Leagues() {
  const { isInCart, addToCart } = useCart();
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [gamesMap, setGamesMap] = useState<Record<string, Game>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const handleAddToCart = async (id: string) => {
    setCartMessage(null);
    const { error } = await addToCart(id, 'league');
    setCartMessage(error || 'Added to cart!');
    setTimeout(() => setCartMessage(null), 2000);
  };

  useEffect(() => {
    fetchLeaguesAndGames();
  }, []);

  const fetchLeaguesAndGames = async () => {
    setLoading(true);

    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .order('created_at', { ascending: false });

    if (leagueError) {
      console.error('Error fetching leagues:', leagueError);
    } else if (leagueData) {
      setLeagues(leagueData);

      const gameIds = Array.from(new Set(leagueData.map((l) => l.game_id).filter(Boolean)));
      if (gameIds.length > 0) {
        const { data: gamesData } = await supabase.from('games').select('id, title, image_url').in('id', gameIds);
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

  const isFree = (l: LeagueRow) => !l.entry_fee || l.entry_fee <= 0;

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return { label: 'Open', bg: 'rgba(41, 231, 205, 0.15)', color: '#29e7cd', border: '#29e7cd' };
      case 'active':
        return { label: 'Live Now', bg: 'rgba(255, 59, 92, 0.2)', color: 'var(--red)', border: 'var(--red)' };
      case 'completed':
        return { label: 'Completed', bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--muted)', border: 'rgba(255,255,255,0.2)' };
      default:
        return { label: status || 'N/A', bg: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'rgba(255,255,255,0.3)' };
    }
  };

  const filteredLeagues = leagues.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'free') return isFree(l);
    return !isFree(l);
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeagues.length / PAGE_SIZE));
  const pageLeagues = filteredLeagues.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', paddingBottom: 80 }}>
      <Head>
        <title>Leagues | ApexDuel</title>
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
            Leagues
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Join a season-long league and face every opponent for ranking points.
          </p>
        </div>

        <Link
          href="/leagues/create"
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
          <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>+ Create League</span>
        </Link>
      </section>

      {/* Filters Bar — categorize free-to-join vs paid leagues */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Leagues' },
            { key: 'free', label: 'Free to Join' },
            { key: 'paid', label: 'Paid Entry' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key as 'all' | 'free' | 'paid');
                setPage(1);
              }}
              style={{
                background: filter === f.key ? 'var(--red)' : '#131627',
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
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* League Cards Grid */}
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
        ) : pageLeagues.length === 0 ? (
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
            No leagues found for this category. Tap "Create League" above to launch one.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {pageLeagues.map((l) => {
                const badge = getStatusBadge(l.status);
                const game = gamesMap[l.game_id];
                const free = isFree(l);

                return (
                  <div
                    key={l.id}
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
                          : 'linear-gradient(135deg, rgba(41,231,205,0.3), rgba(255,59,92,0.15))',
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

                    {/* League Body Details */}
                    <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '8px 0 12px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {l.name}
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
                            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Entry</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: free ? '#29e7cd' : '#fff' }}>
                              {free ? 'FREE' : `$${l.entry_fee}`}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>Access</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{free ? 'Open to All' : 'Invite / Code'}</span>
                          </div>
                        </div>

                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '4px 10px',
                            borderRadius: 12,
                            marginBottom: 4,
                            background: free ? 'rgba(41, 231, 205, 0.12)' : 'rgba(255, 178, 56, 0.12)',
                            color: free ? '#29e7cd' : 'var(--gold)',
                            border: `1px solid ${free ? '#29e7cd' : 'var(--gold)'}`,
                          }}
                        >
                          {free ? 'Free to Participate' : 'Paid to Join'}
                        </span>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                          CODE: <strong style={{ color: '#fff' }}>{l.share_code || 'N/A'}</strong>
                        </span>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAddToCart(l.id)}
                            disabled={isInCart(l.id, 'league')}
                            style={{
                              background: isInCart(l.id, 'league') ? '#2a2d3a' : 'transparent',
                              border: '1px solid var(--panel-border)',
                              color: '#fff',
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              borderRadius: 4,
                              cursor: isInCart(l.id, 'league') ? 'default' : 'pointer',
                            }}
                          >
                            {isInCart(l.id, 'league') ? 'In Cart' : 'Add to Cart'}
                          </button>
                          <Link
                            href={`/leagues/${l.id}`}
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