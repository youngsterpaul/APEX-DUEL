import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart, cartItemLabel, cartItemPrice, cartItemTypeLabel, CartItem, CartItemType } from '../lib/cartContext';

const DETAIL_PATH: Record<CartItemType, (id: string) => string> = {
  listing: (id) => `/markets/listing/${id}`,
  tournament: (id) => `/tournaments/${id}`,
  league: (id) => `/leagues/${id}`,
  duel: (id) => `/duel/${id}`,
  challenge: (id) => `/challenges/${id}`,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading, removeFromCart } = useCart();
  const [session, setSession] = useState<any>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const keyFor = (item: CartItem) => `${item.item_type}:${item.item_id}`;

  const setResult = (item: CartItem, result: { type: 'success' | 'error'; text: string } | undefined) => {
    setResults((prev) => ({ ...prev, [keyFor(item)]: result as any }));
  };

  // Accounts: checkout starts an escrowed transfer for that ONE account and takes you to its chat.
  const checkoutListing = async (item: CartItem) => {
    setBusyKey(keyFor(item));
    const { data, error } = await supabase.rpc('start_transfer', { p_listing_id: item.item_id });
    setBusyKey(null);
    if (error) {
      setResult(item, { type: 'error', text: error.message });
      return;
    }
    router.push(`/transfer/${data.id}`);
  };

  // Tournament / league / duel / challenge: checkout means "join" — pays the entry fee (if any) right now,
  // or sends a join request if the host requires approval.
  const checkoutJoin = async (item: CartItem) => {
    setBusyKey(keyFor(item));
    setResult(item, undefined);

    const rpcName =
      item.item_type === 'tournament'
        ? 'register_for_tournament'
        : item.item_type === 'league'
        ? 'join_league'
        : item.item_type === 'challenge'
        ? 'join_challenge'
        : 'join_duel';
    const paramName =
      item.item_type === 'tournament'
        ? 'p_tournament_id'
        : item.item_type === 'league'
        ? 'p_league_id'
        : item.item_type === 'challenge'
        ? 'p_challenge_id'
        : 'p_duel_id';

    const { error } = await supabase.rpc(rpcName, { [paramName]: item.item_id });
    setBusyKey(null);

    if (error) {
      setResult(item, { type: 'error', text: error.message });
      return;
    }

    await removeFromCart(item.item_id, item.item_type);

    if (item.item_type === 'duel') {
      router.push(`/duel/${item.item_id}`);
      return;
    }

    if (item.item_type === 'challenge') {
      setResult(item, { type: 'success', text: "You're in! Redirecting…" });
      setTimeout(() => router.push(`/challenges/${item.item_id}`), 1200);
      return;
    }

    setResult(item, {
      type: 'success',
      text: item.item_type === 'tournament' ? "You're in! Redirecting to Tournaments…" : "You're in! Redirecting to Leagues…",
    });
    setTimeout(() => router.push(item.item_type === 'tournament' ? '/tournaments' : '/leagues'), 1200);
  };

  if (!session && !loading) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Sign in to check out.</p>
        <Link href="/login" style={{ color: 'var(--red)' }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Checkout | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
        <h1 className="display" style={{ fontSize: 26, textTransform: 'uppercase', marginBottom: 6 }}>
          Checkout
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
          Each item checks out on its own — accounts start an escrowed transfer, tournaments/leagues/matches/challenges charge the entry fee and add you as a participant right away.
        </p>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading your cart…</p>
        ) : items.length === 0 ? (
          <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            Your cart is empty. <Link href="/markets" style={{ color: 'var(--red)' }}>Browse the marketplace</Link>,{' '}
            <Link href="/tournaments" style={{ color: 'var(--red)' }}>tournaments</Link>, or{' '}
            <Link href="/leagues" style={{ color: 'var(--red)' }}>leagues</Link>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((item) => {
              const price = cartItemPrice(item);
              const free = item.item_type !== 'listing' && price <= 0;
              const busy = busyKey === keyFor(item);
              const result = results[keyFor(item)];
              const d = item.details as any;
              const startsAt = item.item_type === 'tournament' || item.item_type === 'league' ? d?.starts_at : item.item_type === 'duel' ? d?.scheduled_at : null;
              const started = startsAt ? new Date(startsAt).getTime() <= Date.now() : false;

              return (
                <div
                  key={keyFor(item)}
                  style={{
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 8,
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {cartItemTypeLabel(item.item_type)}
                      </span>
                      <Link href={DETAIL_PATH[item.item_type](item.item_id)} style={{ display: 'block', textDecoration: 'none' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0', color: '#fff' }}>{cartItemLabel(item)}</h3>
                      </Link>
                      {startsAt && (
                        <p style={{ fontSize: 12, color: started ? '#ff4444' : 'var(--muted)' }}>
                          {started ? 'Already started — can no longer be joined' : `Starts ${new Date(startsAt).toLocaleString()}`}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 900, color: free ? '#29e7cd' : '#fff', whiteSpace: 'nowrap' }}>
                      {free ? 'FREE' : `$${price.toFixed(2)}`}
                    </span>
                  </div>

                  {result && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 8,
                        borderRadius: 4,
                        fontSize: 12,
                        background: result.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
                        color: result.type === 'success' ? '#00ff64' : '#ff4444',
                        border: `1px solid ${result.type === 'success' ? '#00ff64' : '#ff4444'}`,
                      }}
                    >
                      {result.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => (item.item_type === 'listing' ? checkoutListing(item) : checkoutJoin(item))}
                      disabled={busy || started}
                      style={{
                        flex: 1,
                        background: started ? '#2a2d3a' : 'var(--red)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '11px',
                        fontWeight: 700,
                        fontSize: 13,
                        textTransform: 'uppercase',
                        cursor: busy || started ? 'default' : 'pointer',
                        opacity: busy ? 0.7 : 1,
                      }}
                    >
                      {busy
                        ? 'Processing…'
                        : started
                        ? 'Started'
                        : item.item_type === 'listing'
                        ? 'Start Transfer'
                        : item.item_type === 'tournament'
                        ? 'Join Tournament'
                        : item.item_type === 'league'
                        ? 'Join League'
                        : item.item_type === 'challenge'
                        ? 'Join Challenge'
                        : 'Join Match'}
                    </button>
                    <button
                      onClick={() => removeFromCart(item.item_id, item.item_type)}
                      disabled={busy}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--panel-border)',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '11px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}