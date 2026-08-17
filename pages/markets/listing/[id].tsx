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
}

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, items } = useCart();

  const [listing, setListing] = useState<AccountListing | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (typeof id === 'string') fetchListing(id);
  }, [id]);

  const fetchListing = async (listingId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('account_listings')
      .select('*, seller:profiles(id, username, avatar_url, email)')
      .eq('id', listingId)
      .maybeSingle();
    setListing(data as any);
    if (data) {
      const { data: gameData } = await supabase.from('games').select('id, title').eq('id', data.game_id).maybeSingle();
      setGame(gameData);
    }
    setLoading(false);
  };

  const inCart = listing ? items.some((i) => i.listing_id === listing.id) : false;

  const handleAddToCart = async () => {
    if (!listing) return;
    setMessage(null);
    const { error } = await addToCart(listing.id);
    setMessage(error ? { type: 'error', text: error } : { type: 'success', text: 'Added to cart.' });
  };

  const handleBuyNow = async () => {
    if (!listing) return;
    if (!session) {
      setMessage({ type: 'error', text: 'Sign in to buy this account.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.rpc('start_transfer', { p_listing_id: listing.id });
      if (error) throw error;
      router.push(`/transfer/${data.id}`);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not start the transfer.' });
      setBusy(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px' }}>Loading…</div>;
  }
  if (!listing) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#fff' }}>
        <p style={{ color: 'var(--muted)' }}>Listing not found.</p>
        <Link href="/markets" style={{ color: 'var(--red)' }}>Back to markets</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{listing.in_game_username} — {game?.title} Account | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px' }}>
        <Link href={`/markets/game/${listing.game_id}`} style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← {game?.title} accounts
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 1fr', gap: 32, marginTop: 20 }}>
          <div>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#131627', marginBottom: 10 }}>
              {listing.photos[activePhoto] && (
                <img src={listing.photos[activePhoto]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            {listing.photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {listing.photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: 64,
                      height: 64,
                      padding: 0,
                      border: i === activePhoto ? '2px solid var(--red)' : '1px solid var(--panel-border)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  >
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>{game?.title}</span>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: '6px 0 14px' }}>{listing.in_game_username}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: listing.seller?.avatar_url ? undefined : 'var(--red)',
                  backgroundImage: listing.seller?.avatar_url ? `url(${listing.seller.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {!listing.seller?.avatar_url && (listing.seller?.username?.[0]?.toUpperCase() || '?')}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{listing.seller?.username || 'Unknown seller'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Listed {new Date(listing.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 18 }}>
              <Row label="Ranking" value={listing.ranking} />
              {listing.squad_strength != null && <Row label="Squad strength" value={String(listing.squad_strength)} />}
              {listing.level != null && <Row label="Level" value={String(listing.level)} />}
              {listing.rating && <Row label="Notes" value={listing.rating} />}
              <Row label="Status" value={listing.status === 'active' ? 'Available' : listing.status === 'sold' ? 'Sold' : 'Removed'} />
              <Row label="Share code" value={listing.share_code} mono />
            </div>

            {(session?.user.id === listing.seller_id || session?.user.id === listing.buyer_id) && listing.account_email && (
              <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Ownership details (private — visible only to buyer & seller)
                </p>
                <Row label="Account email" value={listing.account_email} />
                {listing.email_proof_photo && (
                  <img src={listing.email_proof_photo} alt="Email ownership proof" style={{ width: '100%', borderRadius: 6, marginTop: 10 }} />
                )}
              </div>
            )}

            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 18 }}>${listing.price.toFixed(2)}</div>

            {message && (
              <div
                style={{
                  padding: 10,
                  marginBottom: 14,
                  borderRadius: 4,
                  fontSize: 13,
                  background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
                  color: message.type === 'success' ? '#00ff64' : '#ff4444',
                  border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}`,
                }}
              >
                {message.text}
              </div>
            )}

            {listing.status === 'active' ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleAddToCart} disabled={inCart} style={{ ...secondaryBtn, flex: 1, opacity: inCart ? 0.6 : 1 }}>
                  {inCart ? 'In cart' : 'Add to cart'}
                </button>
                <button onClick={handleBuyNow} disabled={busy} style={{ ...primaryBtn, flex: 1 }}>
                  {busy ? 'Starting…' : 'Buy Now'}
                </button>
              </div>
            ) : (
              <div style={{ padding: 12, textAlign: 'center', background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 4, color: 'var(--muted)', fontSize: 13 }}>
                This account is no longer available.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--panel-border)' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: mono ? 'monospace' : undefined, letterSpacing: mono ? '0.1em' : undefined }}>{value}</span>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '12px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#fff',
  border: '1px solid var(--panel-border)',
  borderRadius: 4,
  padding: '12px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  cursor: 'pointer',
};