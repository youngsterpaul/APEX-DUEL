import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Method = 'mpesa' | 'googlepay';

const DESTINATION_LABEL: Record<Method, string> = {
  mpesa: 'M-Pesa Phone Number',
  googlepay: 'Google Pay Email',
};

const DESTINATION_PLACEHOLDER: Record<Method, string> = {
  mpesa: '07XXXXXXXX',
  googlepay: 'you@email.com',
};

export default function Withdraw() {
  const [method, setMethod] = useState<Method>('mpesa');
  const [balance, setBalance] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    if (balance !== null && amt > balance) {
      setMessage({ type: 'error', text: 'Amount exceeds your available balance.' });
      return;
    }
    if (!destination.trim()) {
      setMessage({ type: 'error', text: `Enter your ${DESTINATION_LABEL[method]}.` });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc('request_withdrawal', {
      p_method: method,
      p_amount: amt,
      p_destination: destination.trim(),
    });
    setSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({
      type: 'success',
      text: `Withdrawal requested. $${amt.toFixed(2)} has been deducted from your balance and will be sent to your ${DESTINATION_LABEL[method].toLowerCase()} shortly.`,
    });
    setAmount('');
    setDestination('');
    loadProfile();
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Withdraw | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link href="/profile" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Profile
        </Link>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 36px)', textTransform: 'uppercase', margin: '16px 0 8px' }}>
          Withdraw Funds
        </h1>
        {balance !== null && (
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Available balance: <strong style={{ color: 'var(--gold)' }}>${balance.toFixed(2)}</strong>
          </p>
        )}

        {!signedIn && (
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Please sign in to withdraw funds.
          </div>
        )}

        {/* Method tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'mpesa', label: 'M-Pesa' },
            { key: 'googlepay', label: 'Google Pay' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMethod(m.key as Method);
                setMessage(null);
              }}
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

        {message && (
          <div
            style={{
              padding: 12,
              marginBottom: 18,
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Amount</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label style={labelStyle}>{DESTINATION_LABEL[method]}</label>
            <input
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={inputStyle}
              placeholder={DESTINATION_PLACEHOLDER[method]}
            />
          </div>
          <button type="submit" disabled={submitting || !signedIn} style={primaryButtonStyle}>
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
          Funds are deducted from your balance right away. Payouts are reviewed and sent manually — this usually
          takes up to 24 hours.
        </p>
      </section>
    </div>
  );
}

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
