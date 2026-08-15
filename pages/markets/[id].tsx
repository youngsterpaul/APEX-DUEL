import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useCart } from '../../lib/cartContext';
import { AccountListing } from '../../lib/types';

interface Game {
  id: string;
  title: string;
}

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();

  const [listing, setListing] = useState<AccountListing | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    fetchListing(id);
  }, [id]);

  const fetchListing = async (listingId: string) => {
    setLoading(true);
    const { data } = await supabase.from('account_listings').select('*').eq('id', listingId).single();
    if (data) {
      setListing(data as any);
      const { data: g } = await supabase.from('games').select('id, title').eq('id', data.game_id).single();
      if (g) setGame(g);
    }
    setLoading(false);
  };

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async () => {
    if (!listing) return;
    const { error } = await addToCart(listing.id);
    showToast(error || 'Added to cart.');
  };

  const handleBuyNow = async () => {
    if (!listing) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setBuying(true);
    const { error } = await supabase.rpc('buy_listing', { p_listing_id: listing.id });
    setBuying(false);
    if (error) {
      showToast(error.message);
      return;
    }
    showToast('Purchase complete!');
    fetchListing(listing.id);
  };

  if (loading) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading listing…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>This listing was not found.</p>
        <Link href="/markets" style={{ color: 'var(--red)' }}>
          Back to Market
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{listing.in_game_username} | ApexDuel Market</title>
      </Head>

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link href="/markets" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Market
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, marginTop: 20 }}>
          <div>
            <div
              style={{
                height: 340,
                borderRadius: 10,
                overflow: 'hidden',
                background: listing.photos?.[activePhoto]
                  ? `center/cover no-repeat url(${listing.photos[activePhoto]})`
                  : 'linear-gradient(135deg, rgba(255,59,92,0.25), rgba(41,231,205,0.15))',
                border: '1px solid var(--panel-border)',
              }}
            />
            {listing.photos?.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {listing.photos.map((p, i) => (
                  <button
                    key={p + i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 6,
                      border: i === activePhoto ? '2px solid var(--red)' : '1px solid var(--panel-border)',
                      background: `center/cover no-repeat url(${p})`,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
              {game?.title || 'Unknown Game'}
            </span>
            <h1 className="display" style={{ fontSize: 30, textTransform: 'uppercase', margin: '6px 0 16px' }}>
              {listing.in_game_username}
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {listing.rating && (
                <Row label="Squad Strength Rating" value={listing.rating} />
              )}
              {listing.ranking && <Row label="Ranking" value={listing.ranking} />}
              <Row label="Status" value={listing.status === 'active' ? 'Available' : 'Sold'} />
              <Row label="Share code" value={(listing as any).share_code || '—'} mono />
            </div>

            <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 20 }}>${Number(listing.price).toFixed(2)}</div>

            {listing.status === 'active' ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleAddToCart} style={outlineButtonStyle}>
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} disabled={buying} style={primaryButtonStyle}>
                  {buying ? 'Processing…' : 'Buy Now'}
                </button>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>This account has already been sold.</p>
            )}
          </div>
        </div>
      </section>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#131627',
            border: '1px solid var(--panel-border)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 6,
            fontSize: 13,
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: 8 }}>
      <span style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: 13, fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

const outlineButtonStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  padding: '13px',
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--red)',
  border: 'none',
  color: '#0a0b14',
  padding: '13px',
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 800,
  textTransform: 'uppercase',
  cursor: 'pointer',
};