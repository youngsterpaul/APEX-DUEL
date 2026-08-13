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

  return (
    <div style={containerStyle}>
      <Head>
        <title>Sign In / Sign Up | ApexDuel</title>
      </Head>

      <div style={cardStyle}>
        <h1 className="display" style={headerStyle}>
          APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
        </h1>

        {/* Tab Navigation (Only shown for Sign In and Sign Up) */}
        {tab !== 'reset' && tab !== 'forgot' && (
          <div style={tabContainerStyle}>
            {(['signin', 'signup'] as const).map((tKey) => {
              const isActive = tab === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => switchTab(tKey)}
                  style={{
                    ...tabButtonStyle,
                    background: isActive ? 'var(--red)' : 'transparent',
                    color: isActive ? '#0a0b14' : 'var(--muted)',
                  }}
                >
                  {tKey === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback Alert Message */}
        {message && (
          <div
            style={{
              ...messageStyle,
              background: message.type === 'success' ? 'rgba(0, 255, 100, 0.08)' : 'rgba(255, 68, 68, 0.08)',
              color: message.type === 'success' ? '#00ff64' : '#ff4444',
              border: `1px solid ${message.type === 'success' ? 'rgba(0, 255, 100, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
            }}
          >
            {message.text}
          </div>
        )}

        {/* SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={formStyle}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button type="button" onClick={() => switchTab('forgot')} style={linkButtonStyle}>
                Forgot your password?
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} style={formStyle}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Password (min {MIN_PASSWORD_LENGTH} characters)</label>
              <input
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={formStyle}>
            <h2 style={formTitleStyle}>Reset Password</h2>
            <p style={subtextStyle}>
              Enter your registered email and we'll send you a link to reset your password.
            </p>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <button type="button" onClick={() => switchTab('signin')} style={linkButtonStyle}>
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword} style={formStyle}>
            <h2 style={formTitleStyle}>New Password</h2>
            <p style={subtextStyle}>
              Enter a new password for your account below.
            </p>
            <div>
              <label style={labelStyle}>New Password (min {MIN_PASSWORD_LENGTH} characters)</label>
              <input
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
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

const containerStyle: React.CSSProperties = {
  background: '#0a0b14',
  color: '#fff',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  background: '#131627',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: '36px 32px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  textTransform: 'uppercase',
  marginBottom: 28,
  textAlign: 'center',
  letterSpacing: '0.08em',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  background: '#0a0b14',
  padding: 4,
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.05)',
  marginBottom: 28,
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  border: 'none',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  borderRadius: 7,
  transition: 'all 0.2s ease',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const formTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const subtextStyle: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: 13,
  margin: '0 0 8px 0',
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: '#0a0b14',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#fff',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#0a0b14',
  padding: '14px',
  fontWeight: 800,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderRadius: 8,
  fontSize: 14,
  marginTop: 4,
};

const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  padding: 0,
};

const messageStyle: React.CSSProperties = {
  padding: '12px 16px',
  marginBottom: 20,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
};