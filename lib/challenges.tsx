import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Game {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url?: string;
}

interface Challenge {
  id: string;
  title: string;
  game_id: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  status: string;
}

export default function Challenges() {
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: gamesData } = await supabase.from('games').select('*').order('title', { ascending: true });
    if (gamesData) setGames(gamesData);

    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .order('id', { ascending: false });
    if (challengeData) setChallenges(challengeData);

    setLoading(false);
  };

  const gameTitleFor = (gameId: string) => games.find((g) => g.id === gameId)?.title || 'Unknown Game';

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Challenges | ApexDuel</title>
      </Head>

      <section style={{ padding: '48px 24px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Challenges
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginTop: 8, textTransform: 'uppercase' }}>
          Available Games
        </h1>
      </section>

      {/* Available games grid, same card style as Markets */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>Loading games...</div>
        ) : games.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>No games available yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {games.map((g) => (
              <div
                key={g.id}
                style={{
                  position: 'relative',
                  height: 180,
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
                  padding: 16,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {g.category}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '4px 0 0', textTransform: 'uppercase' }}>
                  {g.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active challenges list */}
      <section className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 className="display" style={{ fontSize: 26, marginBottom: 18, textTransform: 'uppercase' }}>
          Live Lobbies
        </h2>

        {challenges.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>
            No active competitions yet. Head to the Home page to launch one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challenges.map((c) => (
              <div
                key={c.id}
                style={{
                  background: '#131627',
                  border: '1px solid var(--panel-border)',
                  padding: 16,
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{c.title}</h4>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {gameTitleFor(c.game_id)} · Slots {c.current_players}/{c.max_players} · Entry ${c.entry_fee}
                  </span>
                </div>
                <Link
                  href={`/duels/${c.id}`}
                  style={{
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderRadius: 4,
                    textDecoration: 'none',
                  }}
                >
                  Join Room
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}