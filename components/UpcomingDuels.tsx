import type { Duel } from '../lib/types';

interface UpcomingDuelsProps {
  duels?: Duel[];
}

function formatTime(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function UpcomingDuels({ duels = [] }: UpcomingDuelsProps) {
  return (
    <section className="container" style={{ padding: '0 24px 64px' }}>
      <h2 className="display" style={{ fontSize: 32, marginBottom: 24 }}>
        UPCOMING DUELS
      </h2>

      {duels.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No duels scheduled yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {duels.map((d) => (
            <div
              key={d.id}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--panel-border)',
                borderRadius: 4,
                padding: 20,
              }}
            >
              <div
                className="mono"
                style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 12, textTransform: 'uppercase' }}
              >
                {d.game} · {formatTime(d.scheduled_at)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--red)' }}>
                  {d.player1?.username || '???'}
                </span>
                <span className="display" style={{ color: 'var(--muted)', fontSize: 14 }}>
                  VS
                </span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--cyan)' }}>
                  {d.player2?.username || '???'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}