import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useCart } from '../../../lib/cartContext';
import { AccountListing } from '../../../lib/types';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
}

export default function GameMarketPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, items } = useCart();

  const [game, setGame] = useState<Game | null>(null);
  const [listings, setListings] = useState<AccountListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof id === 'string') fetchData(id);
  }, [id]);

  const fetchData = async (gameId: string) => {
    setLoading(true);
    const { data: gameData } = await supabase.from('games').select('*').eq('id', gameId).maybeSingle();
    setGame(gameData);

    const { data: listingData } = await supabase
      .from('account_listings')
      .select('*, seller:profiles(id, username, avatar_url, email)')
      .eq('game_id', gameId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setListings((listingData as any) || []);
    setLoading(false);
  };

  const inCart = (listingId: string) => items.some((i) => i.listing_id === listingId);

  const handleAddToCart = async (listingId: string) => {
    setMessage(null);
    const { error } = await addToCart(listingId);
    if (error) setMessage({ type: 'error', text: error });
    else setMessage({ type: 'success', text: 'Added to cart.' });
  };

  const handleBuyNow = async (listingId: string) => {
    setMessage(null);
    setBusyId(listingId);
    try {
      const { error } = await supabase.rpc('buy_listing', { p_listing_id: listingId });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Purchase recorded! The seller will be in touch to transfer the account.' });
      if (typeof id === 'string') fetchData(id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not complete purchase.' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px' }}>Loading…</div>;
  }
  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#fff' }}>
        <p style={{ color: 'var(--muted)' }}>Game not found.</p>
        <Link href="/markets" style={{ color: 'var(--red)' }}>Back to markets</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{game.title} Accounts | ApexDuel Marketplace</title>
      </Head>

      <section
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          ...(game.image_url
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(10,11,20,0.4) 0%, rgba(10,11,20,0.92) 100%), url(${game.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
        }}
      >
        <Link href="/markets" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← All games
        </Link>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, textTransform: 'uppercase', margin: '10px 0' }}>
          {game.title} <span style={{ color: 'var(--red)' }}>Accounts</span>
        </h1>
        <p style={{ color: '#d8dae0', fontSize: 14, marginBottom: 20 }}>{listings.length} accounts currently for sale</p>
        <Link
          href="/markets/sell"
          style={{
            background: 'var(--red)',
            color: '#fff',
            padding: '10px 22px',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            textDecoration: 'none',
            borderRadius: 4,
            display: 'inline-block',
          }}
        >
          Sell Your Account
        </Link>
      </section>

      {message && (
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto 20px',
            padding: 10,
            borderRadius: 4,
            fontSize: 13,
            textAlign: 'center',
            background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
            color: message.type === 'success' ? '#00ff64' : '#ff4444',
            border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px' }}>
        {listings.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
            No accounts for sale yet for this game. Be the first to list one.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {listings.map((listing) => (
              <div key={listing.id} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                <Link href={`/markets/listing/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <PhotoGrid photos={listing.photos} />
                </Link>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: listing.seller?.avatar_url ? undefined : 'var(--red)',
                        backgroundImage: listing.seller?.avatar_url ? `url(${listing.seller.avatar_url})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {!listing.seller?.avatar_url && (listing.seller?.username?.[0]?.toUpperCase() || '?')}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{listing.seller?.username || 'Unknown seller'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Listed {new Date(listing.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Link href={`/markets/listing/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      <span style={{ color: 'var(--muted)' }}>Account: </span>
                      <strong>{listing.in_game_username}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                      {listing.ranking || listing.rating}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>View details →</div>
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 900 }}>${listing.price.toFixed(2)}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleAddToCart(listing.id)}
                        disabled={inCart(listing.id)}
                        style={{
                          background: inCart(listing.id) ? '#2a2d3a' : 'transparent',
                          border: '1px solid var(--panel-border)',
                          color: '#fff',
                          borderRadius: 4,
                          padding: '8px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: inCart(listing.id) ? 'default' : 'pointer',
                        }}
                      >
                        {inCart(listing.id) ? 'In cart' : 'Add to cart'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(listing.id)}
                        disabled={busyId === listing.id}
                        style={{
                          background: 'var(--red)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          cursor: busyId === listing.id ? 'wait' : 'pointer',
                        }}
                      >
                        {busyId === listing.id ? '…' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PhotoGrid({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return <div style={{ height: 160, background: '#0a0b14' }} />;
  }
  if (photos.length === 1) {
    return <img src={photos[0]} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />;
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: photos.length === 2 ? '1fr 1fr' : '2fr 1fr',
        gridTemplateRows: photos.length <= 2 ? '160px' : '80px 80px',
        gap: 2,
        height: 160,
      }}
    >
      <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', gridRow: photos.length > 2 ? 'span 2' : undefined }} />
      {photos.slice(1, 4).map((p, i) => (
        <img key={i} src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ))}
    </div>
  );
}
