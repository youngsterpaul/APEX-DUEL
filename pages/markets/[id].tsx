import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useCart } from '../../lib/cartContext';
import SkeletonGrid from '../../components/SkeletonGrid';
import Pagination from '../../components/Pagination';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url?: string;
}

interface Listing {
  id: string;
  game_id: string;
  in_game_username: string;
  price: number;
  rating: string | null;
  photos: string[] | null;
  status: 'active' | 'sold' | 'removed';
  seller_id: string;
  created_at: string;
}

const PAGE_SIZE = 9;

export default function GameMarket() {
  const router = useRouter();
  const { id: gameId } = router.query;
  const { isInCart, addToCart } = useCart();

  const [game, setGame] = useState<Game | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof gameId !== 'string') return;
    fetchGame(gameId);
    fetchListings(gameId);
    setPage(1);
  }, [gameId]);

  const fetchGame = async (id: string) => {
    setGameLoading(true);
    const { data } = await supabase.from('games').select('*').eq('id', id).single();
    setGame(data || null);
    setGameLoading(false);
  };

  const fetchListings = async (id: string) => {
    setListingsLoading(true);
    const { data } = await supabase
      .from('account_listings')
      .select('*')
      .eq('game_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setListings(data || []);
    setListingsLoading(false);
  };

  // "Add to Cart" — works whether signed in or not (guest cart merges on sign-in).
  const handleAddToCart = async (listingId: string) => {
    setMessage(null);
    await addToCart(listingId);
    setMessage({ type: 'success', text: 'Added to cart!' });
  };

  // "Get Now" — starts an escrowed transfer for exactly this one account immediately.
  // Requires sign-in and locks the price out of the buyer's balance right away.
  const handleGetNow = async (listingId: string) => {
    setMessage(null);
    setProcessingId(listingId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setProcessingId(null);
      router.push('/login');
      return;
    }

    const { data, error } = await supabase.rpc('start_transfer', { p_listing_id: listingId });
    setProcessingId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Could not start the transfer.' });
      return;
    }
    router.push(`/transfer/${data.id}`);
  };

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const pageListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{game ? `${game.title} Accounts` : 'Game Market'} | ApexDuel</title>
      </Head>

      <section style={{ padding: '40px 24px 8px', maxWidth: 1200, margin: '0 auto' }}>
        <Link href="/markets" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
          ← Back to Markets
        </Link>
      </section>

      {gameLoading ? (
        <div className="skeleton" style={{ margin: '16px 24px 0', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto', height: 200, borderRadius: 10 }} />
      ) : game ? (
        <section
          style={{
            margin: '16px 24px 0',
            maxWidth: 1200,
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: 10,
            overflow: 'hidden',
            height: 200,
            backgroundImage: game.image_url
              ? `linear-gradient(180deg, rgba(10,11,20,0.2), rgba(10,11,20,0.92)), url(${game.image_url})`
              : 'linear-gradient(135deg, rgba(255,59,92,0.3), rgba(41,231,205,0.2))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 24,
          }}
        >
          <span className="mono" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
            {game.category}
          </span>
          <h1 className="display" style={{ fontSize: 32, textTransform: 'uppercase', margin: '4px 0 0' }}>
            {game.title} — Accounts For Sale
          </h1>
        </section>
      ) : null}

      {message && (
        <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 24px' }}>
          <div
            style={{
              padding: 12,
              borderRadius: 4,
              fontSize: 13,
              background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
              color: message.type === 'success' ? '#00ff64' : '#ff4444',
              border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}`,
            }}
          >
            {message.text}
          </div>
        </div>
      )}

      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        {listingsLoading ? (
          <SkeletonGrid count={9} height={260} minWidth={260} />
        ) : listings.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>
            No accounts currently for sale for this game.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {pageListings.map((listing) => {
                const inCart = isInCart(listing.id);
                const thumbnail = listing.photos && listing.photos.length > 0 ? listing.photos[0] : null;
                const isProcessing = processingId === listing.id;

                return (
                  <div
                    key={listing.id}
                    style={{
                      background: '#131627',
                      border: '1px solid var(--panel-border)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: 140,
                        backgroundImage: thumbnail
                          ? `url(${thumbnail})`
                          : 'linear-gradient(135deg, rgba(255,59,92,0.2), rgba(41,231,205,0.15))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>{listing.in_game_username}</h4>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                        {listing.rating && (
                          <span className="mono" style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Rank: {listing.rating}
                          </span>
                        )}
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                          Qty: 1 (unique account)
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>
                          ${listing.price.toFixed(2)}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleAddToCart(listing.id)}
                            disabled={inCart}
                            style={{
                              background: 'transparent',
                              color: inCart ? 'var(--muted)' : '#fff',
                              border: '1px solid var(--panel-border)',
                              padding: '8px 12px',
                              fontWeight: 700,
                              fontSize: 11,
                              textTransform: 'uppercase',
                              borderRadius: 4,
                              cursor: inCart ? 'default' : 'pointer',
                            }}
                          >
                            {inCart ? 'In Cart' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => handleGetNow(listing.id)}
                            disabled={isProcessing}
                            style={{
                              background: 'var(--red)',
                              color: '#0a0b14',
                              border: 'none',
                              padding: '8px 14px',
                              fontWeight: 700,
                              fontSize: 11,
                              textTransform: 'uppercase',
                              borderRadius: 4,
                              cursor: isProcessing ? 'default' : 'pointer',
                              opacity: isProcessing ? 0.7 : 1,
                            }}
                          >
                            {isProcessing ? '...' : 'Get Now'}
                          </button>
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