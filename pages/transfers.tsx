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

  const pendingTransfers = rows.filter((r) => r.status === 'in_progress' || r.status === 'disputed');
  const completedTransfers = rows.filter((r) => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>My Transfers | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '48px 16px 80px' }}>
        <h1 className="display" style={{ fontSize: '26px', textTransform: 'uppercase', marginBottom: '8px' }}>
          My Transfers
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Manage your active account purchases and transfer history.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '8px' }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div
            style={{
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            No transfers yet. Buy or sell an account on the Marketplace to start one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Pending Transfers Section */}
            <div>
              <h2 className="display" style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Pending Transfers ({pendingTransfers.length})
              </h2>
              {pendingTransfers.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No active or pending transfers.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingTransfers.map((t) => (
                    <TransferCard key={t.id} transfer={t} />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Transfers Section */}
            <div>
              <h2 className="display" style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Completed & History ({completedTransfers.length})
              </h2>
              {completedTransfers.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No past transfer history.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {completedTransfers.map((t) => (
                    <TransferCard key={t.id} transfer={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TransferCard({ transfer: t }: { transfer: Row }) {
  const badge = getStatusInfo(t.status);
  return (
    <Link
      href={`/transfer/${t.id}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        background: '#131627',
        border: '1px solid var(--panel-border)',
        borderRadius: '8px',
        padding: '16px',
        textDecoration: 'none',
        color: '#fff',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{t.listing_username || 'Account'}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
          {t.role === 'buyer' ? 'Buying from' : 'Selling to'} {t.other_party || 'unknown'} · ${t.price.toFixed(2)}
        </div>
      </div>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: '12px',
          background: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.color}`,
        }}
      >
        {badge.label}
      </span>
    </Link>
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