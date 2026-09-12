import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProfileData {
  id: string;
  username: string;
  full_name?: string;
  discord_username?: string;
  whatsapp_username?: string;
  whatsapp_mobile?: string;
  gender?: string;
  country?: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [whatsappMobile, setWhatsappMobile] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        router.push('/login');
      }
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, discord_username, whatsapp_username, whatsapp_mobile, gender, country')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setUsername(data.username || '');
      setFullName(data.full_name || '');
      setDiscordUsername(data.discord_username || '');
      setWhatsappUsername(data.whatsapp_username || '');
      setWhatsappMobile(data.whatsapp_mobile || '');
      setGender(data.gender || '');
      setCountry(data.country || '');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        full_name: fullName,
        discord_username: discordUsername,
        whatsapp_username: whatsappUsername,
        whatsapp_mobile: whatsappMobile,
        gender,
        country,
      })
      .eq('id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile details saved successfully!' });
    }
    setUpdating(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>My Profile | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '48px 16px 80px' }}>
        <h1 className="display" style={{ fontSize: '26px', textTransform: 'uppercase', marginBottom: '8px' }}>
          My Profile
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Update your identity, contact handles, and personal account details.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '320px', borderRadius: '8px' }} />
          </div>
        ) : (
          <div
            style={{
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            {/* Header Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--panel-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                }}
              >
                {username ? username.charAt(0).toUpperCase() : '👤'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{username || 'User'}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {session?.user?.email}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {message && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    background: message.type === 'success' ? 'rgba(41,231,205,0.15)' : 'rgba(255,68,68,0.15)',
                    color: message.type === 'success' ? '#29e7cd' : '#ff4444',
                    border: `1px solid ${message.type === 'success' ? '#29e7cd' : '#ff4444'}`,
                  }}
                >
                  {message.text}
                </div>
              )}

              {/* Personal Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="" style={optionStyle}>Select Gender</option>
                    <option value="Male" style={optionStyle}>Male</option>
                    <option value="Female" style={optionStyle}>Female</option>
                    <option value="Other" style={optionStyle}>Other</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Kenya, United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '12px 0' }} />

              {/* Social & Contact Information */}
              <h3 className="display" style={{ fontSize: '16px', textTransform: 'uppercase' }}>
                Contact & Social Handles
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Discord Username</label>
                  <input
                    type="text"
                    placeholder="username#0000"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp Username</label>
                  <input
                    type="text"
                    placeholder="WhatsApp tag/name"
                    value={whatsappUsername}
                    onChange={(e) => setWhatsappUsername(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+254700000000"
                    value={whatsappMobile}
                    onChange={(e) => setWhatsappMobile(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: updating ? 0.7 : 1,
                  }}
                >
                  {updating ? 'Saving...' : 'Save Profile'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    background: 'transparent',
                    color: '#ff4444',
                    border: '1px solid rgba(255,68,68,0.4)',
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '14px',
};

const optionStyle: React.CSSProperties = {
  background: '#0a0b14',
  color: '#fff',
};