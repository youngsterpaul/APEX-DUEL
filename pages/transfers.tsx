import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Transfer } from '../lib/types';

interface Row extends Transfer {
  listing_username?: string;
  other_party?: string;
  role: 'buyer' | 'seller';
}

export default function MyTransfers() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        router.push('/login');
      }
    });
  }, []);

  useEffect(() => {
    if (session) fetchTransfers();
  }, [session]);

  const fetchTransfers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transfers')
      .select('*')
      .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const listingIds = Array.from(new Set(data.map((t) => t.listing_id)));
    const otherIds = Array.from(
      new Set(data.map((t) => (t.buyer_id === session.user.id ? t.seller_id : t.buyer_id)))
    );

    const [{ data: listings }, { data: profiles }] = await Promise.all([
      supabase.from('account_listings').select('id, in_game_username').in('id', listingIds),
      supabase.from('profiles').select('id, username').in('id', otherIds),
    ]);

    const listingMap: Record<string, string> = {};
    (listings || []).forEach((l: any) => (listingMap[l.id] = l.in_game_username));
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => (profileMap[p.id] = p.username));

    setRows(
      (data as Transfer[]).map((t) => ({
        ...t,
        listing_username: listingMap[t.listing_id],
        other_party: profileMap[t.buyer_id === session.user.id ? t.seller_id : t.buyer_id],
        role: t.buyer_id === session.user.id ? 'buyer' : 'seller',
      }))
    );
    setLoading(false);
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>My Transfers | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '48px 16px 80px' }}>
        <h1 className="display" style={{ fontSize: 26, textTransform: 'uppercase', marginBottom: 20 }}>
          My Transfers
        </h1>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : rows.length === 0 ? (
          <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            No transfers yet. Buy or sell an account on the Marketplace to start one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((t) => {
              const badge = getStatusInfo(t.status);
              return (
                <Link
                  key={t.id}
                  href={`/transfer/${t.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 8,
                    padding: 16,
                    textDecoration: 'none',
                    color: '#fff',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.listing_username || 'Account'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {t.role === 'buyer' ? 'Buying from' : 'Selling to'} {t.other_party || 'unknown'} · ${t.price.toFixed(2)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 12,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.color}`,
                    }}
                  >
                    {badge.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function getStatusInfo(status: Transfer['status']) {
  switch (status) {
    case 'in_progress':
      return { label: 'In Progress', bg: 'rgba(41,231,205,0.15)', color: '#29e7cd' };
    case 'disputed':
      return { label: 'Disputed', bg: 'rgba(255,68,68,0.15)', color: '#ff4444' };
    case 'completed':
      return { label: 'Completed', bg: 'rgba(41,231,205,0.15)', color: '#29e7cd' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'rgba(255,255,255,0.1)', color: 'var(--muted)' };
    default:
      return { label: status, bg: 'rgba(255,255,255,0.1)', color: '#fff' };
  }
}