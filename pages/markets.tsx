import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url?: string;
}

export default function Markets() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    const { data } = await supabase.from('games').select('*').order('title', { ascending: true });
    if (data) setGames(data);
    setLoading(false);
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Markets | ApexDuel</title>
      </Head>

      <section style={{ padding: '48px 24px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Markets
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 8, textTransform: 'uppercase' }}>
          Available Games
        </h1>
      </section>

      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>Loading games...</div>
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0' }}>No games available yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {games.map((g) => (
              <div
                key={g.id}
                style={{
                  position: 'relative',
                  height: 220,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--panel-border)',
                  backgroundImage: g.image_url
                    ? `linear-gradient(180deg, rgba(10,11,20,0.15), rgba(10,11,20,0.9)), url(${g.image_url})`
                    : 'linear-gradient(135deg, rgba(255,59,92,0.25), rgba(41,231,205,0.15))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 18,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {g.category}
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 6px', textTransform: 'uppercase' }}>
                  {g.title}
                </h3>
                {g.description && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>
                    {g.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}