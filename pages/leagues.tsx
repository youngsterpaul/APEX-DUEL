import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface LeagueRow {
  id: string;
  title: string;
  game_id: string;
  creator_id: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  status: string;
  type: 'league';
  join_code: string;
  requires_approval: boolean;
  config: Record<string, any>;
}

interface GameRow {
  id: string;
  title: string;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedStake, setSelectedStake] = useState<string>('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [{ data: gamesData }, { data: leaguesData }] = await Promise.all([
      supabase.from('games').select('id, title'),
      supabase.from('challenges').select('*').eq('type', 'league').order('created_at', { ascending: false }),
    ]);

    setGames(gamesData || []);
    setLeagues((leaguesData as LeagueRow[]) || []);
    setLoading(false);
  };

  const filteredLeagues = leagues.filter((league) => {
    const matchesGame = selectedGame === 'all' || league.game_id === selectedGame;
    let matchesStake = true;
    if (selectedStake === 'free') {
      matchesStake = !league.entry_fee || league.entry_fee === 0;
    } else if (selectedStake === 'paid') {
      matchesStake = league.entry_fee > 0;
    }
    return matchesGame && matchesStake;
  });

  const gameMap = games.reduce((acc, g) => {
    acc[g.id] = g.title;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', paddingBottom: '80px' }}>
      <Head>
        <title>Leagues | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Link href="/challenges" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
              ← Back to Overview
            </Link>
            <h1 className="display" style={{ fontSize: 'clamp(24px, 4vw, 34px)', textTransform: 'uppercase', margin: '8px 0 4px' }}>
              Leagues
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Browse active leagues, filter by game and stake, and join the competition.</p>
          </div>
          <Link href="/challenges/create?type=league" style={primaryBtnStyle}>
            Create League
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            background: '#131627',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>
              Filter by Game
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>
              Filter by Stake
            </label>
            <select
              value={selectedStake}
              onChange={(e) => setSelectedStake(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Stakes</option>
              <option value="free">Free ($0)</option>
              <option value="paid">Paid Stakes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>Loading leagues…</div>
        ) : filteredLeagues.length === 0 ? (
          <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No leagues found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredLeagues.map((league) => {
              const free = !league.entry_fee || league.entry_fee <= 0;
              const full = league.current_players >= league.max_players;
              return (
                <div
                  key={league.id}
                  style={{
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 8,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {gameMap[league.game_id] || 'Game'} · LEAGUE
                      </span>
                      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0' }}>{league.title}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: free ? '#29e7cd' : 'var(--gold)',
                          background: free ? 'rgba(41,231,205,0.1)' : 'rgba(212,175,55,0.1)',
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: `1px solid ${free ? '#29e7cd' : 'var(--gold)'}`,
                        }}
                      >
                        {free ? 'Free Entry' : `$${league.entry_fee}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    <div>
                      Players: <strong style={{ color: '#fff' }}>{league.current_players} / {league.max_players}</strong>
                    </div>
                    <div>
                      Status:{' '}
                      <strong style={{ color: league.status === 'open' && !full ? '#29e7cd' : '#ff4444' }}>
                        {league.status === 'open' ? (full ? 'Full' : 'Open') : league.status}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <Link
                      href={`/challenges/${league.id}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid #fff',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                      }}
                    >
                      View League →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  borderRadius: 4,
  color: '#fff',
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '10px 16px',
  fontWeight: 700,
  fontSize: 13,
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
  cursor: 'pointer',
};