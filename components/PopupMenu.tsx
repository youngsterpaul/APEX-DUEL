import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
}

export default function PopupMenu({ isOpen, onClose, user, onSignOut }: PopupMenuProps) {
  const [authModal, setAuthModal] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'newpassword' | null>(null);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View / Hide Password Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return minLength && hasUpper && hasLower && hasNum && hasSpecial;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (authModal === 'signup') {
        if (!validatePassword(password)) {
          throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        if (existingUser) {
          throw new Error('Username is already taken. Please choose another one.');
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: data.user.id, email, username }]);

          if (profileError) throw profileError;
        }

        setMessage({ type: 'success', text: 'Account created successfully! Check your email for confirmation code.' });
        setAuthModal('verify');
      } 
      else if (authModal === 'verify') {
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Email verified successfully! You can now log in.' });
        setAuthModal('login');
      }
      else if (authModal === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthModal(null);
        onClose();
      } 
      else if (authModal === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage({ type: 'success', text: 'An 8-digit verification code has been sent to your email.' });
        setAuthModal('newpassword');
      }
      else if (authModal === 'newpassword') {
        if (!validatePassword(password)) {
          throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { error: otpError } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
        if (otpError) throw otpError;

        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;

        setMessage({ type: 'success', text: 'Password successfully changed! Please log in.' });
        setAuthModal('login');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred during authentication.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Drawer Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 320,
            height: '100%',
            background: '#0e101c',
            borderLeft: '1px solid var(--panel-border)',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>MENU</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>
              &times;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {/* Navigation links for small screens & full menu */}
            <Link href="/" onClick={onClose} style={menuItemStyle}>Home</Link>
            <Link href="/categories" onClick={onClose} style={menuItemStyle}>Categories</Link>
            <Link href="/games" onClick={onClose} style={menuItemStyle}>Games</Link>
            <Link href="/markets" onClick={onClose} style={menuItemStyle}>Markets</Link>
            <Link href="/events" onClick={onClose} style={menuItemStyle}>Events</Link>
            <Link href="/duels" onClick={onClose} style={menuItemStyle}>Challenges</Link>
            <Link href="/leaderboard" onClick={onClose} style={menuItemStyle}>Leaderboard</Link>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

            {user ? (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
                  Logged in as <br /><strong style={{ color: '#fff' }}>{user.email}</strong>
                </div>
                <button
                  onClick={() => { onSignOut(); onClose(); }}
                  style={{
                    ...menuItemStyle,
                    background: 'rgba(255,50,50,0.1)',
                    color: 'var(--red)',
                    border: '1px solid var(--red)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthModal('login')}
                style={{
                  ...menuItemStyle,
                  background: 'var(--red)',
                  color: '#0a0b14',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {authModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            padding: 16,
          }}
          onClick={() => setAuthModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#131627',
              border: '1px solid var(--panel-border)',
              padding: 32,
              width: '100%',
              maxWidth: 400,
              borderRadius: 8,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#fff', textTransform: 'uppercase' }}>
                {authModal === 'login' && 'Database Login'}
                {authModal === 'signup' && 'Create Account'}
                {authModal === 'verify' && 'Verify Code'}
                {authModal === 'forgot' && 'Reset Password'}
                {authModal === 'newpassword' && 'Change Password'}
              </h3>
              <button onClick={() => setAuthModal(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            {message && (
              <div
                style={{
                  padding: 10,
                  marginBottom: 16,
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

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authModal === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Unique Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. apex_player"
                  />
                </div>
              )}

              {authModal !== 'verify' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Email Address (User ID)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    placeholder="name@example.com"
                  />
                </div>
              )}

              {(authModal === 'verify' || authModal === 'newpassword') && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>8-Digit Code Received via Email</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={inputStyle}
                    placeholder="Enter 8-digit code"
                  />
                </div>
              )}

              {(authModal === 'signup' || authModal === 'newpassword') && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                      Password (Min 8 chars: Upper, Lower, Number, Special)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 60 }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={toggleButtonStyle}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 60 }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={toggleButtonStyle}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {authModal === 'login' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 60 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={toggleButtonStyle}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--red)',
                  color: '#0a0b14',
                  padding: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: 8,
                }}
              >
                {loading ? 'Processing...' : 
                 authModal === 'login' ? 'Sign In' : 
                 authModal === 'signup' ? 'Create Account' : 
                 authModal === 'verify' ? 'Confirm Code' :
                 authModal === 'forgot' ? 'Send Code' : 'Update Password'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                {authModal === 'login' && (
                  <>
                    <button type="button" onClick={() => setAuthModal('forgot')} style={linkButtonStyle}>
                      Forgot Password?
                    </button>
                    <button type="button" onClick={() => setAuthModal('signup')} style={linkButtonStyle}>
                      Create Account
                    </button>
                  </>
                )}
                {authModal === 'signup' && (
                  <button type="button" onClick={() => setAuthModal('login')} style={linkButtonStyle}>
                    Already have an account? Sign In
                  </button>
                )}
                {authModal === 'verify' && (
                  <button type="button" onClick={() => setAuthModal('login')} style={linkButtonStyle}>
                    Back to Login
                  </button>
                )}
                {authModal === 'forgot' && (
                  <button type="button" onClick={() => setAuthModal('login')} style={linkButtonStyle}>
                    Back to Login
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 600,
  textTransform: 'uppercase',
  padding: '8px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
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

const toggleButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
};