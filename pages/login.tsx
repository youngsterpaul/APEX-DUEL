import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

type Tab = 'signin' | 'signup' | 'forgot' | 'verifyDevice';
type ForgotStep = 'request' | 'confirm';

const MIN_PASSWORD_LENGTH = 8;
const INACTIVITY_LIMIT_DAYS = 7;
const DEVICE_ID_KEY = 'apexduel_device_id';

// A device id that persists in this browser across visits.
function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('signin');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('request');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [deviceCode, setDeviceCode] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFormState = () => {
    setPassword('');
    setConfirmPassword('');
    setCode('');
    setDeviceCode('');
    setMessage(null);
    setForgotStep('request');
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setMessage({ type: 'error', text: error.message });
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Sign in failed. Please try again.' });
      return;
    }

    const deviceId = getDeviceId();
    const { data: deviceRow } = await supabase
      .from('user_devices')
      .select('last_login')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();

    const isNewDevice = !deviceRow;
    const isStale =
      !!deviceRow &&
      Date.now() - new Date(deviceRow.last_login).getTime() > INACTIVITY_LIMIT_DAYS * 24 * 60 * 60 * 1000;

    if (isNewDevice || isStale) {
      // Don't grant access yet — revoke this session and require an emailed code first.
      await supabase.auth.signOut();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      setLoading(false);

      if (otpError) {
        setMessage({ type: 'error', text: otpError.message });
        return;
      }

      setMessage({
        type: 'success',
        text: isNewDevice
          ? `New device detected. A 6-digit code was sent to ${email} to confirm it's you.`
          : `It's been a while since your last login. A 6-digit code was sent to ${email} to confirm it's you.`,
      });
      setTab('verifyDevice');
      return;
    }

    // Known device, recent login — update last_login and go straight in.
    await supabase
      .from('user_devices')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    setLoading(false);
    setMessage({ type: 'success', text: 'Signed in! Redirecting...' });
    setTimeout(() => router.push('/'), 800);
  };

  const handleVerifyDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!deviceCode || deviceCode.trim().length < 6) {
      setMessage({ type: 'error', text: 'Enter the 6-digit code sent to your email.' });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: deviceCode.trim(),
      type: 'email',
    });

    if (error || !data.user) {
      setLoading(false);
      setMessage({ type: 'error', text: error?.message || 'Invalid or expired code.' });
      return;
    }

    // Code confirmed — remember this device so future logins skip this step (until it goes stale).
    const deviceId = getDeviceId();
    await supabase.from('user_devices').upsert(
      { user_id: data.user.id, device_id: deviceId, last_login: new Date().toISOString() },
      { onConflict: 'user_id,device_id' }
    );

    setLoading(false);
    setMessage({ type: 'success', text: 'Device confirmed! Redirecting...' });
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

  // Step 1: request a 6-digit code by email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setMessage({ type: 'success', text: `A 6-digit confirmation code was sent to ${email}. Enter it below with your new password.` });
    setForgotStep('confirm');
  };

  // Step 2: enter new password + confirm password + the emailed code, all together
  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
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
    if (!code || code.trim().length < 6) {
      setMessage({ type: 'error', text: 'Enter the 6-digit code sent to your email.' });
      return;
    }

    setLoading(true);

    // Verify the emailed code — this logs the user in via a recovery session.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    });

    if (verifyError) {
      setLoading(false);
      setMessage({ type: 'error', text: verifyError.message || 'Invalid or expired code.' });
      return;
    }

    // Code confirmed — now apply the new password.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setMessage({ type: 'error', text: updateError.message });
      return;
    }

    setMessage({ type: 'success', text: 'Password changed successfully! Redirecting to sign in...' });
    setTimeout(() => {
      switchTab('signin');
      router.push('/login');
    }, 1200);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'signin', label: 'Sign In' },
    { key: 'signup', label: 'Sign Up' },
    { key: 'forgot', label: 'Change Password' },
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

        {tab !== 'verifyDevice' && (
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

        {/* VERIFY NEW/RETURNING DEVICE */}
        {tab === 'verifyDevice' && (
          <form onSubmit={handleVerifyDevice} style={formStyle}>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              For your security, confirm the 6-digit code sent to <strong style={{ color: '#fff' }}>{email}</strong>.
            </p>
            <div>
              <label style={labelStyle}>6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: 18 }}
                placeholder="000000"
              />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button type="button" onClick={() => switchTab('signin')} style={linkButtonStyle}>
              Cancel
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

        {/* CHANGE PASSWORD — step 1: request code */}
        {tab === 'forgot' && forgotStep === 'request' && (
          <form onSubmit={handleSendCode} style={formStyle}>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              Enter your email — we'll send a 6-digit code to confirm the password change.
            </p>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Sending Code...' : 'Send Code'}
            </button>
            <button type="button" onClick={() => switchTab('signin')} style={linkButtonStyle}>
              Back to Sign In
            </button>
          </form>
        )}

        {/* CHANGE PASSWORD — step 2: new password + confirm + emailed code, submitted together */}
        {tab === 'forgot' && forgotStep === 'confirm' && (
          <form onSubmit={handleConfirmPasswordChange} style={formStyle}>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              Check <strong style={{ color: '#fff' }}>{email}</strong> for your 6-digit code, then set your new password below.
            </p>
            <div>
              <label style={labelStyle}>New Password (min {MIN_PASSWORD_LENGTH} characters)</label>
              <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" required minLength={MIN_PASSWORD_LENGTH} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            <div>
              <label style={labelStyle}>6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: 18 }}
                placeholder="000000"
              />
            </div>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Confirming...' : 'Confirm & Change Password'}
            </button>
            <button type="button" onClick={() => setForgotStep('request')} style={linkButtonStyle}>
              Didn't get a code? Send again
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