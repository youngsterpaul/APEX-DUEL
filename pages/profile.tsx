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

interface Game {
  id: string;
  title: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Field Values
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [whatsappMobile, setWhatsappMobile] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');

  // Per-field Edit Toggle state
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});

  // Per-game competing usernames — e.g. { [gameId]: "MyIGN123" }
  const [games, setGames] = useState<Game[]>([]);
  const [gameUsernames, setGameUsernames] = useState<Record<string, string>>({});
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameUsernameDraft, setGameUsernameDraft] = useState('');
  const [savingGameUsername, setSavingGameUsername] = useState(false);

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

  useEffect(() => {
    supabase
      .from('games')
      .select('id, title')
      .or('hidden.eq.false,hidden.is.null')
      .order('title')
      .then(({ data }) => {
        if (data) setGames(data);
      });
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, discord_username, whatsapp_username, whatsapp_mobile, gender, country, game_usernames')
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
      setGameUsernames(data.game_usernames || {});
    }
    setLoading(false);
  };

  const toggleEditField = (fieldName: string) => {
    setEditingFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleSaveField = async (fieldName: string, dbColumn: string, value: string) => {
    setUpdatingField(fieldName);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ [dbColumn]: value })
      .eq('id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Field updated successfully!' });
      setEditingFields((prev) => ({ ...prev, [fieldName]: false }));
    }
    setUpdatingField(null);
  };

  const startEditGameUsername = (gameId: string) => {
    setMessage(null);
    setEditingGameId(gameId);
    setGameUsernameDraft(gameUsernames[gameId] || '');
  };

  const cancelEditGameUsername = () => {
    setEditingGameId(null);
    setGameUsernameDraft('');
  };

  const saveGameUsername = async (gameId: string) => {
    const trimmed = gameUsernameDraft.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }

    setSavingGameUsername(true);
    setMessage(null);

    const updated = { ...gameUsernames, [gameId]: trimmed };
    const { error } = await supabase
      .from('profiles')
      .update({ game_usernames: updated })
      .eq('id', session.user.id);

    setSavingGameUsername(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setGameUsernames(updated);
    setEditingGameId(null);
    setMessage({ type: 'success', text: 'Game username saved!' });
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
            {/* Header Avatar */}
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

            {message && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  background: message.type === 'success' ? 'rgba(41,231,205,0.15)' : 'rgba(255,68,68,0.15)',
                  color: message.type === 'success' ? '#29e7cd' : '#ff4444',
                  border: `1px solid ${message.type === 'success' ? '#29e7cd' : '#ff4444'}`,
                }}
              >
                {message.text}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Personal Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Username - ALWAYS LOCKED */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>Username</label>
                    <span style={lockedTagStyle}>Locked</span>
                  </div>
                  <input type="text" value={username} disabled style={disabledInputStyle} />
                </div>

                {/* Gender - ALWAYS LOCKED */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>Gender</label>
                    <span style={lockedTagStyle}>Locked</span>
                  </div>
                  <input type="text" value={gender || 'Not specified'} disabled style={disabledInputStyle} />
                </div>

                {/* Full Name */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>Full Name</label>
                    <button
                      type="button"
                      onClick={() => toggleEditField('fullName')}
                      style={inlineEditBtnStyle}
                    >
                      {editingFields['fullName'] ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingFields['fullName'] ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('fullName', 'full_name', fullName)}
                        disabled={updatingField === 'fullName'}
                        style={saveBtnStyle}
                      >
                        {updatingField === 'fullName' ? '...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <input type="text" value={fullName || 'Not provided'} disabled style={disabledInputStyle} />
                  )}
                </div>

                {/* Country Dropdown */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>Country</label>
                    <button
                      type="button"
                      onClick={() => toggleEditField('country')}
                      style={inlineEditBtnStyle}
                    >
                      {editingFields['country'] ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingFields['country'] ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="" style={optionStyle}>Select Country</option>
                        {WORLD_COUNTRIES.map((c) => (
                          <option key={c} value={c} style={optionStyle}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleSaveField('country', 'country', country)}
                        disabled={updatingField === 'country'}
                        style={saveBtnStyle}
                      >
                        {updatingField === 'country' ? '...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <input type="text" value={country || 'Not selected'} disabled style={disabledInputStyle} />
                  )}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '8px 0' }} />

              {/* Social & Contact Information */}
              <h3 className="display" style={{ fontSize: '16px', textTransform: 'uppercase' }}>
                Contact & Social Handles
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Discord Username */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>Discord Username</label>
                    <button
                      type="button"
                      onClick={() => toggleEditField('discordUsername')}
                      style={inlineEditBtnStyle}
                    >
                      {editingFields['discordUsername'] ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingFields['discordUsername'] ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="username#0000"
                        value={discordUsername}
                        onChange={(e) => setDiscordUsername(e.target.value)}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('discordUsername', 'discord_username', discordUsername)}
                        disabled={updatingField === 'discordUsername'}
                        style={saveBtnStyle}
                      >
                        {updatingField === 'discordUsername' ? '...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <input type="text" value={discordUsername || 'Not connected'} disabled style={disabledInputStyle} />
                  )}
                </div>

                {/* WhatsApp Username */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>WhatsApp Username</label>
                    <button
                      type="button"
                      onClick={() => toggleEditField('whatsappUsername')}
                      style={inlineEditBtnStyle}
                    >
                      {editingFields['whatsappUsername'] ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingFields['whatsappUsername'] ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="WhatsApp handle"
                        value={whatsappUsername}
                        onChange={(e) => setWhatsappUsername(e.target.value)}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('whatsappUsername', 'whatsapp_username', whatsappUsername)}
                        disabled={updatingField === 'whatsappUsername'}
                        style={saveBtnStyle}
                      >
                        {updatingField === 'whatsappUsername' ? '...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <input type="text" value={whatsappUsername || 'Not provided'} disabled style={disabledInputStyle} />
                  )}
                </div>

                {/* WhatsApp Mobile */}
                <div>
                  <div style={labelHeaderStyle}>
                    <label style={labelStyle}>WhatsApp Mobile Number</label>
                    <button
                      type="button"
                      onClick={() => toggleEditField('whatsappMobile')}
                      style={inlineEditBtnStyle}
                    >
                      {editingFields['whatsappMobile'] ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editingFields['whatsappMobile'] ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="tel"
                        placeholder="+254700000000"
                        value={whatsappMobile}
                        onChange={(e) => setWhatsappMobile(e.target.value)}
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveField('whatsappMobile', 'whatsapp_mobile', whatsappMobile)}
                        disabled={updatingField === 'whatsappMobile'}
                        style={saveBtnStyle}
                      >
                        {updatingField === 'whatsappMobile' ? '...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <input type="text" value={whatsappMobile || 'Not provided'} disabled style={disabledInputStyle} />
                  )}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '8px 0' }} />

              {/* Per-Game Competing Usernames */}
              <h3 className="display" style={{ fontSize: '16px', textTransform: 'uppercase' }}>
                Your In-Game Usernames
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '-12px' }}>
                Set the username you compete with for each game. When you join or create a league, tournament, or
                1v1 match for that game, this is what other players will see — and you'll be asked to confirm it.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {games.map((g) => {
                  const isEditing = editingGameId === g.id;
                  const value = gameUsernames[g.id];

                  return (
                    <div key={g.id}>
                      <div style={labelHeaderStyle}>
                        <label style={labelStyle}>{g.title}</label>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditGameUsername(g.id)}
                            style={inlineEditBtnStyle}
                          >
                            {value ? 'Edit' : 'Set'}
                          </button>
                        )}
                      </div>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder={`Your ${g.title} username`}
                            value={gameUsernameDraft}
                            onChange={(e) => setGameUsernameDraft(e.target.value)}
                            style={inputStyle}
                          />
                          <button
                            type="button"
                            onClick={() => saveGameUsername(g.id)}
                            disabled={savingGameUsername}
                            style={saveBtnStyle}
                          >
                            {savingGameUsername ? '...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditGameUsername}
                            style={{ ...inlineEditBtnStyle, color: 'var(--muted)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <input type="text" value={value || 'Not set'} disabled style={disabledInputStyle} />
                      )}
                    </div>
                  );
                })}
                {games.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No games available yet.</p>
                )}
              </div>

              {/* Account Actions */}
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    background: 'transparent',
                    color: '#ff4444',
                    border: '1px solid rgba(255,68,68,0.4)',
                    padding: '10px 20px',
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
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const labelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const lockedTagStyle: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  opacity: 0.6,
};

const inlineEditBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#29e7cd',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  textTransform: 'uppercase',
  padding: 0,
};

const saveBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: 'none',
  padding: '0 16px',
  fontWeight: 700,
  fontSize: '12px',
  textTransform: 'uppercase',
  borderRadius: '4px',
  cursor: 'pointer',
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