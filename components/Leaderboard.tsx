import type { Player } from '../lib/types';

interface LeaderboardProps {
  players?: Player[];
}

const rankColor: Record<string, string> = {
  Master: 'var(--red)',
  Diamond: 'var(--cyan)',
  Platinum: '#a3a9d1',
  Gold: 'var(--gold)',
  Bronze: '#c08552',
};

export default function Leaderboard({ players = [] }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.wins - b.losses - (a.wins - a.losses));

  return (
    <section id="leaderboard" className="container" style={{ padding: '64px 24px' }}>
      <h2 className="display" style={{ fontSize: 32, marginBottom: 24 }}>
        LEADERBOARD
      </h2>

      {sorted.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No players yet. Add rows to the `players` table in Supabase to populate this.</p>
      ) : (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--panel-border)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {sorted.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 100px 80px 80px',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: i === sorted.length - 1 ? 'none' : '1px solid var(--panel-border)',
              }}
            >
              <span className="mono" style={{ color: 'var(--muted)' }}>
                #{i + 1}
              </span>
              <span style={{ fontWeight: 600, fontSize: 18 }}>{p.username}</span>
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: rankColor[p.rank] || 'var(--muted)',
                  textTransform: 'uppercase',
                }}
              >
                {p.rank}
              </span>
              <span className="mono" style={{ color: 'var(--cyan)' }}>
                {p.wins}W
              </span>
              <span className="mono" style={{ color: 'var(--red)' }}>
                {p.losses}L
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}