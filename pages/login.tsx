import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

type Tab = 'signin' | 'signup' | 'forgot' | 'reset';

const MIN_PASSWORD_LENGTH = 8;

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // If the user arrived via a password-reset email link, Supabase appends a
  // recovery token and fires PASSWORD_RECOVERY — switch straight to the reset form.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTab('reset');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const resetFormState = () => {
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    resetFormState();
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Signed in! Redirecting...' });
    setTimeout(() => router.push('/'), 800);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setMessage({ type: 'error', text: pwdError });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({
      type: 'success',
      text: 'Account created! Check your email for a confirmation code/link to activate your account.',
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
    });

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Reset code/link sent! Check your email to continue.' });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setMessage({ type: 'error', text: pwdError });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({ type: 'success', text: 'Password updated! Redirecting to sign in...' });
    setTimeout(() => {
      switchTab('signin');
      router.push('/login');
    }, 1200);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'signin', label: 'Sign In' },
    { key: 'signup', label: 'Sign Up' },
    { key: 'forgot', label: 'Forgot Password' },
  ];

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '80vh', display: 'flex', justifyContent: 'center', padding: '64px 24px' }}>
      <Head>
        <title>Sign In / Sign Up | ApexDuel</title>
      </Head>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 className="display" style={{ fontSize: 28, textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' }}>
          APEX<span style={{ color: 'var(--red)' }}>DUEL</span> Account
        </h1>

        {tab !== 'reset' && (
          <div style={{ display: 'flex', border: '1px solid var(--panel-border)', borderRadius: 6, overflow: 'hidden', marginBottom: 24 }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: tab === t.key ? 'var(--red)' : 'transparent',
                  color: tab === t.key ? '#0a0b14' : 'var(--muted)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

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

        {/* SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={formStyle}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <button type="button" onClick={() => switchTab('forgot')} style={linkButtonStyle}>
              Forgot your password?
            </button>
          </form>
        )}

        {/* SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} style={formStyle}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Password (min {MIN_PASSWORD_LENGTH} characters)</label>
              <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={formStyle}>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              Enter your email and we'll send you a code/link to reset your password.
            </p>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <button type="button" onClick={() => switchTab('signin')} style={linkButtonStyle}>
              Back to Sign In
            </button>
          </form>
        )}

        {/* RESET / CHANGE PASSWORD — shown after clicking the emailed reset link */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword} style={formStyle}>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              Enter a new password for your account.
            </p>
            <div>
              <label style={labelStyle}>New Password (min {MIN_PASSWORD_LENGTH} characters)</label>
              <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

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

const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 13,
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0,
  textAlign: 'center',
};