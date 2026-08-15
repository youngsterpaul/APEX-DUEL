import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import { findByCode, codeMatchHref } from '../lib/searchByCode';
import { AccountListing } from '../lib/types';

interface Game {
  id: string;
  title: string;
}

export default function Markets() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [listings, setListings] = useState<AccountListing[]>([]);
  const [games, setGames] = useState<Record<string, Game>>({});
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'searching' | 'not_found'>('idle');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const [{ data: listingData }, { data: gameData }] = await Promise.all([
      supabase
        .from('account_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase.from('games').select('id, title'),
    ]);
    if (listingData) setListings(listingData as any);
    if (gameData) {
      const map: Record<string, Game> = {};
      gameData.forEach((g: Game) => (map[g.id] = g));
      setGames(map);
    }
    setLoading(false);
  };

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = async (listingId: string) => {
    const { error } = await addToCart(listingId);
    showToast(error || 'Added to cart.');
  };

  const handleBuyNow = async (listingId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setBuyingId(listingId);
    const { error } = await supabase.rpc('buy_listing', { p_listing_id: listingId });
    setBuyingId(null);
    if (error) {
      showToast(error.message);
      return;
    }
    showToast('Purchase complete! Check your email for handover details.');
    fetchListings();
  };

  const handleCodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setCodeStatus('searching');
    const match = await findByCode(code);
    if (!match) {
      setCodeStatus('not_found');
      return;
    }
    setCodeStatus('idle');
    router.push(codeMatchHref(match));
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Markets | ApexDuel</title>
      </Head>

      <section style={{ padding: '48px 24px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Markets
            </span>
            <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 8, textTransform: 'uppercase' }}>
              Account Marketplace
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6, maxWidth: 520 }}>
              Buy and sell verified game accounts. Every listing comes with a share code buyers can
              search for directly.
            </p>
          </div>

          <Link
            href="/sell-account"
            style={{
              background: 'var(--red)',
              color: '#0a0b14',
              padding: '12px 22px',
              fontWeight: 800,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: 'none',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            + Sell Your Account
          </Link>
        </div>

        <form
          onSubmit={handleCodeSearch}
          style={{ marginTop: 24, display: 'flex', gap: 10, maxWidth: 420, flexWrap: 'wrap' }}
        >
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeStatus('idle');
            }}
            placeholder="Have a code? Search tournaments, duels, leagues or listings"
            className="mono"
            style={{
              flex: 1,
              minWidth: 220,
              padding: '10px 14px',
              background: '#131627',
              border: '1px solid var(--panel-border)',
              color: '#fff',
              borderRadius: 4,
              fontSize: 13,
              letterSpacing: '0.05em',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'transparent',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 12,
              textTransform: 'uppercase',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Find
          </button>
        </form>
        {codeStatus === 'not_found' && (
          <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>No match found for that code.</p>
        )}
      </section>

      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>Loading listings...</div>
        ) : listings.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>
            No accounts on sale yet. Be the first —{' '}
            <Link href="/sell-account" style={{ color: 'var(--red)' }}>
              list yours
            </Link>
            .
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {listings.map((l) => (
              <div
                key={l.id}
                style={{
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#131627',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Link href={`/markets/${l.id}`} style={{ display: 'block', textDecoration: 'none', color: '#fff' }}>
                  <div
                    style={{
                      height: 160,
                      backgroundImage: l.photos?.[0]
                        ? `linear-gradient(180deg, rgba(10,11,20,0.05), rgba(10,11,20,0.85)), url(${l.photos[0]})`
                        : 'linear-gradient(135deg, rgba(255,59,92,0.25), rgba(41,231,205,0.15))',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: 14,
                    }}
                  >
                    <span className="mono" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {games[l.game_id]?.title || 'Unknown Game'}
                    </span>
                  </div>
                </Link>

                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{l.in_game_username}</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
                    {l.rating && <span>Rating: {l.rating}</span>}
                    {l.ranking && <span>· Rank: {l.ranking}</span>}
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>${Number(l.price).toFixed(2)}</span>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => handleAddToCart(l.id)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: '1px solid var(--panel-border)',
                        color: '#fff',
                        padding: '10px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleBuyNow(l.id)}
                      disabled={buyingId === l.id}
                      style={{
                        flex: 1,
                        background: 'var(--red)',
                        border: 'none',
                        color: '#0a0b14',
                        padding: '10px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      {buyingId === l.id ? '...' : 'Buy Now'}
                    </button>
                  </div>
                  <Link
                    href={`/markets/${l.id}`}
                    style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 4, textDecoration: 'underline' }}
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
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
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}