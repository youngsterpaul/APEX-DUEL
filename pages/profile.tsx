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

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');

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
      setDiscordUsername(data.discord_username || '');
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

  const startEditing = () => {
    if (profile) {
      setUsername(profile.username || '');
      setGender(profile.gender || '');
      setWhatsappUsername(profile.whatsapp_username || '');
      setWhatsappPhone(profile.whatsapp_phone || '');
      setDiscordUsername(profile.discord_username || '');
    }
    setMessage(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setMessage(null);
    if (profile) {
      setUsername(profile.username || '');
      setGender(profile.gender || '');
      setWhatsappUsername(profile.whatsapp_username || '');
      setWhatsappPhone(profile.whatsapp_phone || '');
      setDiscordUsername(profile.discord_username || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      const { error } = await supabase.rpc('update_my_social_profile', {
        p_username: username,
        p_gender: gender,
        p_whatsapp_username: whatsappUsername,
        p_whatsapp_phone: whatsappPhone,
        p_discord_username: discordUsername,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated.' });
      setEditing(false);
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

        {/* Balance + wallet actions */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>Balance</span>
          <div style={{ fontSize: 36, fontWeight: 900, margin: '4px 0 20px' }}>${profile.balance.toFixed(2)}</div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/wallet/deposit" style={{ ...primaryButtonStyle, flex: 1, marginTop: 0, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Deposit
            </Link>
            <Link href="/wallet/withdraw" style={{ ...secondaryButtonStyle, flex: 1, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Withdraw
            </Link>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
            Choose M-Pesa, Crypto, or Google Pay on the next screen.
          </p>
        </div>

        {/* Profile details */}
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? 18 : 4 }}>
            <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: 14 }}>Account Details</h3>
            {!editing && (
              <button onClick={startEditing} style={editButtonStyle}>
                ✏️ Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <ViewRow label="Username" value={profile.username} />
              <ViewRow label="Gender" value={profile.gender ? capitalize(profile.gender) : null} />
              <ViewRow label="Country" value={profile.country} />
              <ViewRow label="WhatsApp Username" value={profile.whatsapp_username} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>WhatsApp Phone</span>
                {profile.whatsapp_phone ? (
                  <a
                    href={`https://wa.me/${profile.whatsapp_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 14, fontWeight: 700, color: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    💬 {profile.whatsapp_phone}
                  </a>
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>Not set</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>Discord Username</span>
                {profile.discord_username ? (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.discord_username || '');
                      setMessage({ type: 'success', text: 'Discord username copied to clipboard.' });
                    }}
                    style={{ background: 'transparent', border: 'none', fontSize: 14, fontWeight: 700, color: '#5865F2', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
                  >
                    🎮 {profile.discord_username} <span style={{ fontSize: 11, color: 'var(--muted)' }}>(copy)</span>
                  </button>
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>Not set</span>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <label style={labelStyle}>Username</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />

              <label style={labelStyle}>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <label style={labelStyle}>Country <span style={readOnlyTag}>cannot be edited</span></label>
              <input disabled value={profile.country || 'Not set'} style={disabledInputStyle} />

              <label style={labelStyle}>WhatsApp Username <span style={optionalTag}>optional</span></label>
              <input value={whatsappUsername} onChange={(e) => setWhatsappUsername(e.target.value)} style={inputStyle} placeholder="Display name" />

              <label style={labelStyle}>WhatsApp Phone <span style={optionalTag}>optional</span></label>
              <input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} style={inputStyle} placeholder="+254 7XX XXX XXX" />

              <label style={labelStyle}>Discord Username <span style={optionalTag}>optional</span></label>
              <input value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} style={inputStyle} placeholder="yourname" />

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" disabled={busy} style={{ ...primaryButtonStyle, flex: 1, marginTop: 0 }}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={cancelEditing} disabled={busy} style={{ ...secondaryButtonStyle, flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

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

function ViewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--panel-border)' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: value ? 700 : 400, color: value ? '#fff' : 'var(--muted)' }}>
        {value || 'Not set'}
      </span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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

const optionalTag: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: 10,
  textTransform: 'none',
  letterSpacing: 'normal',
  fontWeight: 400,
};

const readOnlyTag: React.CSSProperties = {
  color: '#ff4444',
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
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#1a1d2e',
  color: 'var(--muted)',
  cursor: 'not-allowed',
  opacity: 0.7,
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

const editButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  padding: '6px 14px',
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
  textTransform: 'uppercase',
  borderRadius: 4,
};