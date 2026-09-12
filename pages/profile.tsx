import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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

    // Save only editable fields (username and gender are locked)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        discord_username: discordUsername,
        whatsapp_username: whatsappUsername,
        whatsapp_mobile: whatsappMobile,
        country,
      })
      .eq('id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile details saved successfully!' });
      setIsEditing(false);
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
          Manage your account details and contact information.
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
            {/* Header Avatar & Edit Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Edit Profile
                </button>
              )}
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
                {/* Username - ALWAYS LOCKED */}
                <div>
                  <label style={labelStyle}>Username (Cannot be changed)</label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    style={disabledInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    style={isEditing ? inputStyle : disabledInputStyle}
                  />
                </div>

                {/* Gender - ALWAYS LOCKED */}
                <div>
                  <label style={labelStyle}>Gender (Cannot be changed)</label>
                  <input
                    type="text"
                    value={gender || 'Not specified'}
                    disabled
                    style={disabledInputStyle}
                  />
                </div>

                {/* Country Dropdown */}
                <div>
                  <label style={labelStyle}>Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={!isEditing}
                    style={{
                      ...(isEditing ? inputStyle : disabledInputStyle),
                      cursor: isEditing ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <option value="" style={optionStyle}>Select Country</option>
                    {WORLD_COUNTRIES.map((c) => (
                      <option key={c} value={c} style={optionStyle}>
                        {c}
                      </option>
                    ))}
                  </select>
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
                    disabled={!isEditing}
                    style={isEditing ? inputStyle : disabledInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp Username</label>
                  <input
                    type="text"
                    placeholder="WhatsApp tag/name"
                    value={whatsappUsername}
                    onChange={(e) => setWhatsappUsername(e.target.value)}
                    disabled={!isEditing}
                    style={isEditing ? inputStyle : disabledInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+254700000000"
                    value={whatsappMobile}
                    onChange={(e) => setWhatsappMobile(e.target.value)}
                    disabled={!isEditing}
                    style={isEditing ? inputStyle : disabledInputStyle}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {isEditing ? (
                  <>
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
                      onClick={() => {
                        setIsEditing(false);
                        fetchProfile(); // Reset to current saved values
                      }}
                      style={{
                        background: 'transparent',
                        color: '#fff',
                        border: '1px solid var(--panel-border)',
                        padding: '12px 24px',
                        fontWeight: 700,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
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
                )}
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

const disabledInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--panel-border)',
  borderRadius: '4px',
  color: 'var(--muted)',
  fontSize: '14px',
  cursor: 'not-allowed',
};

const optionStyle: React.CSSProperties = {
  background: '#0a0b14',
  color: '#fff',
};