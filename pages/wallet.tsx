import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payout' | 'purchase' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  description?: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        router.push('/login');
      }
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchWalletData();
    }
  }, [session]);

  const fetchWalletData = async () => {
    setLoading(true);

    const [{ data: profile }, { data: txs }] = await Promise.all([
      supabase.from('profiles').select('balance').eq('id', session.user.id).single(),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (profile) setBalance(profile.balance || 0);
    if (txs) setTransactions(txs as Transaction[]);

    setLoading(false);
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Wallet | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '48px 16px 80px' }}>
        <h1 className="display" style={{ fontSize: '26px', textTransform: 'uppercase', marginBottom: '8px' }}>
          My Wallet
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          View your total balance, manage funds, and track financial transactions.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '140px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '200px', borderRadius: '8px' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Balance Overview Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #131627 0%, #1a1e36 100%)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
                  Available Balance
                </span>
                <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', color: '#29e7cd' }}>
                  ${balance.toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => alert('Deposit modal / action triggered')}
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Deposit
                </button>
                <button
                  onClick={() => alert('Withdraw modal / action triggered')}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    border: '1px solid var(--panel-border)',
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Transaction History Section */}
            <div>
              <h2 className="display" style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Transaction History
              </h2>

              {transactions.length === 0 ? (
                <div
                  style={{
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: '14px',
                  }}
                >
                  No recent transactions found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {transactions.map((tx) => {
                    const isPositive = tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'refund';
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#131627',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '8px',
                          padding: '16px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', textTransform: 'capitalize' }}>
                            {tx.description || tx.type}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: isPositive ? '#29e7cd' : '#ff4444',
                            }}
                          >
                            {isPositive ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              color: 'var(--muted)',
                              marginTop: '2px',
                            }}
                          >
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}