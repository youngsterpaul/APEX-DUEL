import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Game {
  id: string;
  title: string;
}

interface ChallengeRow {
  id: string;
  title: string;
  game_id: string;
  creator_id: string;
  entry_fee: number;
  max_players: number;
  current_players: number;
  status: string;
  type: '1v1' | 'tournament' | 'league';
  join_code: string;
  creator_funds_prize: boolean;
  requires_approval: boolean;
  config: Record<string, any>;
}

export default function LeaguesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [leagues, setLeagues] = useState<ChallengeRow[]>([]);
  const [creatorMap, setCreatorMap] = useState<Record<string, string>>({});
  const [gameMap, setGameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [stakeFilter, setStakeFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch games list
    const { data: gamesData } = await supabase.from('games').select('id, title');
    const gList = gamesData || [];
    setGames(gList);

    const gMap: Record<string, string> = {};
    gList.forEach((g) => {
      gMap[g.id] = g.title;
    });
    setGameMap(gMap);

    // Fetch leagues
    const { data: leaguesData } = await supabase
      .from('challenges')
      .select('*')
      .eq('type', 'league')
      .order('id', { ascending: false });

    const lList = (leaguesData as ChallengeRow[]) || [];
    setLeagues(lList);

    // Fetch creators
    if (lList.length > 0) {
      const creatorIds = Array.from(new Set(lList.map((l) => l.creator_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', creatorIds);

      const cMap: Record<string, string> = {};
      (profilesData || []).forEach((p: any) => {
        cMap[p.id] = p.username;
      });
      setCreatorMap(cMap);
    }

    setLoading(false);
  };

  const filteredLeagues = useMemo(() => {
    return leagues.filter((league) => {
      // Game Filter
      if (selectedGame !== 'all' && league.game_id !== selectedGame) {
        return false;
      }

      // Stake/Entry Fee Filter
      const fee = league.entry_fee || 0;
      if (stakeFilter === 'free' && fee > 0) return false;
      if (stakeFilter === '1-10' && (fee < 1 || fee > 10)) return false;
      if (stakeFilter === '10-50' && (fee <= 10 || fee > 50)) return false;
      if (stakeFilter === '50+' && fee <= 50) return false;

      return true;
    });
  }, [leagues, selectedGame, stakeFilter]);

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Leagues | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>
            Competitive Play
          </span>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 38px)', textTransform: 'uppercase', margin: '4px 0' }}>
            Leagues
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Join a league, climb the standings, and claim your rewards.
          </p>
        </div>

        {/* Filters Controls */}
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
          {/* Game Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>
              Filter by Game
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Games</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stake Amount Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>
              Filter by Stake Amount
            </label>
            <select
              value={stakeFilter}
              onChange={(e) => setStakeFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Stakes</option>
              <option value="free">Free ($0)</option>
              <option value="1-10">$1 – $10</option>
              <option value="10-50">$10 – $50</option>
              <option value="50+">$50+</option>
            </select>
          </div>
        </div>

        {/* Leagues Listing */}
        {loading ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 20px' }}>
            Loading leagues…
          </div>
        ) : filteredLeagues.length === 0 ? (
          <div
            style={{
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            No leagues match your selected filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredLeagues.map((league) => {
              const free = !league.entry_fee || league.entry_fee <= 0;
              const full = league.current_players >= league.max_players;

              return (
                <Link
                  key={league.id}
                  href={`/challenges/${league.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      background: '#131627',
                      border: '1px solid var(--panel-border)',
                      borderRadius: 8,
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {gameMap[league.game_id] || 'Game'} · LEAGUE
                      </span>
                      <h3 style={{ fontSize: 18, margin: '2px 0 4px', textTransform: 'uppercase' }}>
                        {league.title}
                      </h3>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Hosted by {creatorMap[league.creator_id] || 'a player'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>
                          Stake
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: free ? '#29e7cd' : '#fff' }}>
                          {free ? 'Free' : `$${league.entry_fee}`}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>
                          Players
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: full ? '#ff4444' : '#fff' }}>
                          {league.current_players} / {league.max_players}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: league.status === 'open' ? 'rgba(41,231,205,0.1)' : '#1a1d2e',
                            color: league.status === 'open' ? '#29e7cd' : 'var(--muted)',
                            border: `1px solid ${league.status === 'open' ? '#29e7cd' : 'var(--panel-border)'}`,
                          }}
                        >
                          {league.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
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
  color: '#fff',
  border: '1px solid var(--panel-border)',
  borderRadius: 4,
  padding: '10px',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};