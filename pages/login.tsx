import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, gender } },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! Check your email to confirm, then sign in.' });
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>{mode === 'signup' ? 'Sign Up' : 'Sign In'} | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 420, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
          APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </p>

        <div style={{ display: 'flex', marginBottom: 20, border: '1px solid var(--panel-border)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            onClick={() => setMode('signin')}
            style={{ flex: 1, padding: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', background: mode === 'signin' ? 'var(--red)' : 'transparent', color: '#fff' }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{ flex: 1, padding: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', background: mode === 'signup' ? 'var(--red)' : 'transparent', color: '#fff' }}
          >
            Sign Up
          </button>
        </div>

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

        <form onSubmit={handleSubmit} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24 }}>
          {mode === 'signup' && (
            <>
              <label style={labelStyle}>Username</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} placeholder="ApexKing99" />

              <label style={labelStyle}>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </>
          )}

          <label style={labelStyle}>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@email.com" />

          <label style={labelStyle}>Password</label>
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />

          <button type="submit" disabled={busy} style={primaryButtonStyle}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 6,
  marginTop: 16,
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