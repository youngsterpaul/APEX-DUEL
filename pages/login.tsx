import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (mode === 'signup') {
      if (!country) {
        setMessage({ type: 'error', text: 'Please select your country.' });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match. Please make sure both passwords are identical.' });
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent! Check your email inbox.' });
      } else if (mode === 'signup') {
        // Check if username already exists in database (case-insensitive)
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username.trim())
          .maybeSingle();

        if (existingUser) {
          throw new Error('This username is already taken. Please choose another one.');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              gender,
              country,
              whatsapp_username: whatsappUsername || null,
              whatsapp_phone: whatsappPhone || null,
              discord_username: discordUsername || null,
            },
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! Check your email to confirm, then sign in.' });
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
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
        <title>
          {mode === 'signup' ? 'Sign Up' : mode === 'reset' ? 'Reset Password' : 'Sign In'} | ApexDuel
        </title>
      </Head>

      <section style={{ maxWidth: 420, margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
          APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>
          {mode === 'signup'
            ? 'Create your account'
            : mode === 'reset'
            ? 'Reset your account password'
            : 'Welcome back'}
        </p>

        <div style={{ display: 'flex', marginBottom: 20, border: '1px solid var(--panel-border)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setMessage(null); }}
            style={{ flex: 1, padding: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', background: mode === 'signin' ? 'var(--red)' : 'transparent', color: '#fff' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMessage(null); }}
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

              <label style={labelStyle}>Country</label>
              <select required value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
                <option value="">Select your country</option>
                {COUNTRY_LIST.map((c) => (
                  <option key={c} value={c} style={{ background: '#131627', color: '#fff' }}>
                    {c}
                  </option>
                ))}
              </select>

              <label style={labelStyle}>WhatsApp Username <span style={optionalTag}>optional</span></label>
              <input value={whatsappUsername} onChange={(e) => setWhatsappUsername(e.target.value)} style={inputStyle} placeholder="Display name" />

              <label style={labelStyle}>WhatsApp Phone <span style={optionalTag}>optional</span></label>
              <input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} style={inputStyle} placeholder="+254 7XX XXX XXX" />

              <label style={labelStyle}>Discord Username <span style={optionalTag}>optional</span></label>
              <input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} style={inputStyle} placeholder="yourname" />
            </>
          )}

          <label style={labelStyle}>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@email.com" />

          {mode !== 'reset' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginTop: 0, marginBottom: 0 }}>Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setMessage(null); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', fontWeight: 600, padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 40 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={togglePasswordButtonStyle}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {mode === 'signup' && (
                <>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 40 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={togglePasswordButtonStyle}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" disabled={busy} style={primaryButtonStyle}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send Reset Link' : 'Sign in'}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(null); }}
              style={{ ...secondaryButtonStyle, width: '100%', marginTop: 10 }}
            >
              Back to Sign In
            </button>
          )}
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

const optionalTag: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: 10,
  textTransform: 'none',
  letterSpacing: 'normal',
  fontWeight: 400,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
  boxSizing: 'border-box',
};

const togglePasswordButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  padding: 0,
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
  padding: '10px',
  fontWeight: 700,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  fontSize: 12,
};

const COUNTRY_LIST = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];