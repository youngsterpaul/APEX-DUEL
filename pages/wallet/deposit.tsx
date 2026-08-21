import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Method = 'mpesa' | 'crypto' | 'googlepay';
type MpesaMode = 'stk' | 'paybill';

export default function Deposit() {
  const [method, setMethod] = useState<Method>('mpesa');
  const [mpesaMode, setMpesaMode] = useState<MpesaMode>('stk');

  const [balance, setBalance] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [accountRef, setAccountRef] = useState<string | null>(null);
  const paybillNumber = process.env.NEXT_PUBLIC_MPESA_PAYBILL || 'YOUR_PAYBILL_NUMBER';

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadProfile();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSignedIn(false);
      return;
    }
    setSignedIn(true);

    const { data } = await supabase.from('profiles').select('balance').eq('id', session.user.id).single();
    if (data) setBalance(Number(data.balance));
  };

  const loadAccountRef = async () => {
    const { data, error } = await supabase.rpc('get_or_create_mpesa_account_ref');
    if (!error) setAccountRef(data);
  };

  useEffect(() => {
    if (mpesaMode === 'paybill' && signedIn && !accountRef) {
      loadAccountRef();
    }
  }, [mpesaMode, signedIn]);

  const pollDepositStatus = (checkoutRequestId: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const { data } = await supabase
        .from('deposit_requests')
        .select('status')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (data?.status === 'completed') {
        clearInterval(pollRef.current!);
        setSubmitting(false);
        setMessage({ type: 'success', text: 'Deposit successful! Your balance has been updated.' });
        loadProfile();
      } else if (data?.status === 'failed') {
        clearInterval(pollRef.current!);
        setSubmitting(false);
        setMessage({ type: 'error', text: 'Payment was not completed. You can try again.' });
      } else if (attempts >= 20) {
        // ~60s of polling at 3s intervals
        clearInterval(pollRef.current!);
        setSubmitting(false);
        setMessage({ type: 'info', text: 'Still waiting on confirmation — your balance will update automatically once M-Pesa confirms.' });
      }
    }, 3000);
  };

  const handleStkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: 'error', text: 'Please sign in to deposit.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount: parseFloat(amount), phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitting(false);
        setMessage({ type: 'error', text: data.error || 'Failed to start deposit.' });
        return;
      }

      setMessage({ type: 'info', text: data.message });
      pollDepositStatus(data.checkoutRequestId);
    } catch (err: any) {
      setSubmitting(false);
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    }
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Deposit | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link href="/profile" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Profile
        </Link>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 36px)', textTransform: 'uppercase', margin: '16px 0 8px' }}>
          Deposit Funds
        </h1>
        {balance !== null && (
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Current balance: <strong style={{ color: 'var(--gold)' }}>{balance.toFixed(2)}</strong>
          </p>
        )}

        {!signedIn && (
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Please sign in to deposit funds.
          </div>
        )}

        {/* Method tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'mpesa', label: 'M-Pesa' },
            { key: 'crypto', label: 'Crypto' },
            { key: 'googlepay', label: 'Google Pay' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key as Method)}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: method === m.key ? 'var(--red)' : 'transparent',
                color: method === m.key ? '#0a0b14' : 'var(--muted)',
                border: '1px solid var(--panel-border)',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {method === 'crypto' && (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>
            Crypto deposits are coming soon.
          </div>
        )}
        {method === 'googlepay' && (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>
            Google Pay deposits are coming soon.
          </div>
        )}

        {method === 'mpesa' && (
          <>
            {/* M-Pesa sub-tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setMpesaMode('stk')}
                style={subTabStyle(mpesaMode === 'stk')}
              >
                Get Prompted (STK Push)
              </button>
              <button
                onClick={() => setMpesaMode('paybill')}
                style={subTabStyle(mpesaMode === 'paybill')}
              >
                Pay via Paybill
              </button>
            </div>

            {message && (
              <div
                style={{
                  padding: 12,
                  marginBottom: 18,
                  borderRadius: 4,
                  fontSize: 13,
                  background:
                    message.type === 'success' ? 'rgba(0,255,100,0.1)' : message.type === 'error' ? 'rgba(255,0,0,0.1)' : 'rgba(41,231,205,0.1)',
                  color: message.type === 'success' ? '#00ff64' : message.type === 'error' ? '#ff4444' : 'var(--cyan)',
                  border: `1px solid ${message.type === 'success' ? '#00ff64' : message.type === 'error' ? '#ff4444' : 'var(--cyan)'}`,
                }}
              >
                {message.text}
              </div>
            )}

            {mpesaMode === 'stk' && (
              <form onSubmit={handleStkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Amount (KES)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label style={labelStyle}>M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                    placeholder="07XXXXXXXX"
                  />
                </div>
                <button type="submit" disabled={submitting || !signedIn} style={primaryButtonStyle}>
                  {submitting ? 'Waiting for confirmation...' : 'Get Prompted'}
                </button>
              </form>
            )}

            {mpesaMode === 'paybill' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Go to M-Pesa on your phone → Lipa na M-Pesa → Pay Bill, then enter these details:
                </p>
                <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>Paybill Number</span>
                    <span className="mono" style={{ fontWeight: 700 }}>{paybillNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>Account Number</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--gold)' }}>
                      {accountRef || 'Loading...'}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Your balance updates automatically within a minute of a confirmed payment — no need to refresh.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const subTabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 8px',
  background: active ? 'var(--panel)' : 'transparent',
  color: active ? '#fff' : 'var(--muted)',
  border: '1px solid var(--panel-border)',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  cursor: 'pointer',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#131627',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#0a0b14',
  padding: '13px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  fontSize: 14,
};