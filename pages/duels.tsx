import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import SkeletonGrid from '../components/SkeletonGrid';
import { Duel } from '../lib/types';

export default function DuelsPage() {
  const { isInCart, addToCart } = useCart();
  const [session, setSession] = useState<any>(null);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    fetchDuels();
  }, []);

  const fetchDuels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('duels')
      .select('*')
      .is('player2_id', null)
      .order('created_at', { ascending: false });
    setDuels(data || []);
    setLoading(false);
  };

  const handleAddToCart = async (id: string) => {
    setCartMessage(null);
    const { error } = await addToCart(id, 'duel');
    setCartMessage(error || 'Added to cart!');
    setTimeout(() => setCartMessage(null), 2000);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoinBusy(true);
    setJoinError(null);
    const { data, error } = await supabase.rpc('join_duel_by_code', { p_code: joinCode.trim() });
    setJoinBusy(false);
    if (error) {
      setJoinError(error.message);
      return;
    }
    window.location.href = `/duel/${data.id}`;
  };

  const openDuels = duels.filter((d) => d.status === 'scheduled');

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', paddingBottom: 80 }}>
      <Head>
        <title>1v1 Matches | ApexDuel</title>
      </Head>

      <section
        style={{
          padding: '48px 24px 24px',
          maxWidth: 1000,
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
            1v1 Matches
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Challenge someone directly. Once your opponent joins, you can chat and settle the result together.
          </p>
        </div>

        <Link
          href="/duel/create"
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
          <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>+ Create Match</span>
        </Link>
      </section>

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Have a match code?</span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="mono"
            style={{ padding: '8px 12px', background: '#0a0b14', border: '1px solid var(--panel-border)', color: '#fff', borderRadius: 4, fontSize: 13, letterSpacing: '0.1em', width: 140 }}
          />
          <button
            onClick={handleJoinByCode}
            disabled={joinBusy}
            style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {joinBusy ? 'Joining…' : 'Join'}
          </button>
          {joinError && <span style={{ fontSize: 12, color: '#ff4444' }}>{joinError}</span>}
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
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
          <SkeletonGrid count={6} height={140} minWidth={280} />
        ) : openDuels.length === 0 ? (
          <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            No open matches right now. Be the first to create one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {openDuels.map((d) => {
              const started = d.scheduled_at ? new Date(d.scheduled_at).getTime() <= Date.now() : false;
              const isMine = session && d.player1_id === session.user.id;
              return (
                <div
                  key={d.id}
                  style={{
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{d.game}</h4>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Entry {d.entry_fee > 0 ? `$${d.entry_fee}` : 'Free'}
                      {d.scheduled_at && (
                        <> · {started ? <span style={{ color: '#ff4444' }}>Started</span> : `Starts ${new Date(d.scheduled_at).toLocaleString()}`}</>
                      )}
                      {' · '}
                      Code: <strong className="mono" style={{ color: '#fff' }}>{d.share_code}</strong>
                    </span>
                  </div>
                  {!isMine && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleAddToCart(d.id)}
                        disabled={isInCart(d.id, 'duel') || started}
                        style={{
                          background: isInCart(d.id, 'duel') ? '#2a2d3a' : 'transparent',
                          border: '1px solid var(--panel-border)',
                          color: '#fff',
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          borderRadius: 4,
                          cursor: isInCart(d.id, 'duel') || started ? 'default' : 'pointer',
                          opacity: started ? 0.5 : 1,
                        }}
                      >
                        {isInCart(d.id, 'duel') ? 'In Cart' : 'Add to Cart'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}