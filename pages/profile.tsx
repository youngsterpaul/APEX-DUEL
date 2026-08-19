import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LedgerEntry, Profile } from '../lib/types';

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      setProfile(data);
      setUsername(data.username || '');
      setGender(data.gender || '');
      setWhatsappUsername(data.whatsapp_username || '');
      setWhatsappPhone(data.whatsapp_phone || '');
    }
    const { data: ledgerData } = await supabase
      .from('ledger')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setLedger(ledgerData || []);
    setLoading(false);
  };

  const handleDeposit = async () => {
    setMessage(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMessage({ type: 'error', text: 'Enter a valid amount.' });
    setBusy(true);
    try {
      const { error } = await supabase.rpc('simulate_deposit', { p_amount: amt });
      if (error) throw error;
      setMessage({ type: 'success', text: `Deposited $${amt.toFixed(2)}.` });
      setAmount('');
      if (session) fetchProfile(session.user.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    setMessage(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMessage({ type: 'error', text: 'Enter a valid amount.' });
    setBusy(true);
    try {
      const { error } = await supabase.rpc('simulate_withdrawal', { p_amount: amt });
      if (error) throw error;
      setMessage({ type: 'success', text: `Withdrew $${amt.toFixed(2)}.` });
      setAmount('');
      if (session) fetchProfile(session.user.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await supabase.rpc('update_my_profile', { p_username: username, p_gender: gender });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated.' });
      if (session) fetchProfile(session.user.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await supabase.rpc('update_my_whatsapp', { p_username: whatsappUsername, p_phone: whatsappPhone });
      if (error) throw error;
      setMessage({ type: 'success', text: 'WhatsApp contact updated.' });
      if (session) fetchProfile(session.user.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px' }}>Loading…</div>;

  if (!session || !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#fff' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Sign in to see your profile.</p>
        <Link href="/login" style={{ color: 'var(--red)' }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>My Profile | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '50px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', marginBottom: 24 }}>My Profile</h1>

        {message && (
          <div
            style={{
              padding: 10,
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

        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>Balance</span>
          <div style={{ fontSize: 36, fontWeight: 900, margin: '4px 0 20px' }}>${profile.balance.toFixed(2)}</div>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount (USD)"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDeposit} disabled={busy} style={{ ...primaryButtonStyle, flex: 1, marginTop: 0 }}>
              Deposit
            </button>
            <button onClick={handleWithdraw} disabled={busy} style={{ ...secondaryButtonStyle, flex: 1 }}>
              Withdraw
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
            Simulated wallet — no real payment gateway connected yet.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: 14 }}>Account settings</h3>
          <label style={labelStyle}>Username</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
          <label style={labelStyle}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" disabled={busy} style={primaryButtonStyle}>
            Save changes
          </button>
        </form>

        <form onSubmit={handleSaveWhatsapp} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: 14 }}>💬 Connect WhatsApp</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Shown to your match opponent once you both join a duel, and to your buyer/seller during an account transfer.
          </p>
          <label style={labelStyle}>WhatsApp username</label>
          <input value={whatsappUsername} onChange={(e) => setWhatsappUsername(e.target.value)} style={inputStyle} placeholder="Optional display name" />
          <label style={labelStyle}>WhatsApp phone number</label>
          <input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} style={inputStyle} placeholder="+1 555 123 4567" />
          <button type="submit" disabled={busy} style={primaryButtonStyle}>
            Save WhatsApp contact
          </button>
        </form>

        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24 }}>
          <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: 14 }}>Recent activity</h3>
          {ledger.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ledger.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--panel-border)', paddingBottom: 6 }}>
                  <span style={{ textTransform: 'capitalize', color: 'var(--muted)' }}>{l.entry_type.replace('_', ' ')}</span>
                  <span style={{ color: l.amount >= 0 ? '#00ff64' : '#ff4444' }}>
                    {l.amount >= 0 ? '+' : ''}${l.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 6,
  marginTop: 14,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--red)',
  color: '#fff',
  padding: '12px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  marginTop: 20,
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#fff',
  border: '1px solid var(--panel-border)',
  padding: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
};