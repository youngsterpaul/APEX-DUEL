import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProfileData {
  id: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username || '');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setProfile((prev) => (prev ? { ...prev, username } : null));
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
          Manage your identity and account details.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '240px', borderRadius: '8px' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Account Details Card */}
            <div
              style={{
                background: '#131627',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                padding: '24px',
              }}
            >
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
                  {profile?.username ? profile.username.charAt(0).toUpperCase() : '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px' }}>{profile?.username || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    {session?.user?.email}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
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

                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#0a0b14',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '4px',
                      color: 'var(--muted)',
                      fontSize: '14px',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={updating}
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
                      opacity: updating ? 0.7 : 1,
                    }}
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>

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
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}