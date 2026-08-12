import Head from 'next/head';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadGameImage } from '../lib/storage';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
}

export default function AdminGames() {
  const [session, setSession] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    fetchGames();
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchGames = async () => {
    const { data } = await supabase.from('games').select('*').order('title');
    if (data) setGames(data);
  };

  const handleFile = async (game: Game, file: File | undefined) => {
    if (!file) return;
    if (!session) {
      setMessage({ type: 'error', text: 'Sign in first — uploads require an authenticated session.' });
      return;
    }
    setBusyId(game.id);
    setMessage(null);
    try {
      const publicUrl = await uploadGameImage(game.id, file);
      const { error } = await supabase.from('games').update({ image_url: publicUrl }).eq('id', game.id);
      if (error) throw error;
      setMessage({ type: 'success', text: `${game.title} image updated.` });
      fetchGames();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', color: '#fff' }}>
      <Head>
        <title>Manage Game Images | ApexDuel</title>
      </Head>
      <h1 style={{ fontSize: 24, textTransform: 'uppercase', marginBottom: 8 }}>Manage Game Images</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Uploads go to the <code>game-images</code> storage bucket and set each game's <code>image_url</code>.
      </p>

      {!session && (
        <div style={{ padding: 12, marginBottom: 20, borderRadius: 4, background: 'rgba(255,0,0,0.1)', border: '1px solid #ff4444', fontSize: 13 }}>
          You must be signed in to upload images.
        </div>
      )}

      {message && (
        <div
          style={{
            padding: 10,
            marginBottom: 20,
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

      <div style={{ display: 'grid', gap: 14 }}>
        {games.map((g) => (
          <div
            key={g.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 6,
                backgroundImage: g.image_url ? `url(${g.image_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                background: g.image_url ? undefined : '#0a0b14',
                flexShrink: 0,
                border: '1px solid var(--panel-border)',
              }}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 15 }}>{g.title}</h4>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{g.category}</span>
            </div>
            <label
              style={{
                padding: '8px 14px',
                borderRadius: 4,
                border: '1px solid var(--red)',
                color: 'var(--red)',
                fontSize: 12,
                textTransform: 'uppercase',
                cursor: busyId === g.id ? 'wait' : 'pointer',
                fontWeight: 700,
              }}
            >
              {busyId === g.id ? 'Uploading…' : 'Upload image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: 'none' }}
                disabled={busyId === g.id}
                onChange={(e) => handleFile(g, e.target.files?.[0])}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}