export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--panel-border)',
        background:
          'linear-gradient(90deg, rgba(255,59,92,0.12) 0%, rgba(10,11,20,1) 50%, rgba(41,231,205,0.12) 100%)',
      }}
    >
      <div
        className="container"
        style={{
          padding: '96px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <span className="mono" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.15em' }}>
          RANKED 1V1 · WINNER TAKES ALL
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 1.05 }}>
          PICK A RIVAL.
          <br />
          <span style={{ color: 'var(--red)' }}>SETTLE IT</span>{' '}
          <span style={{ color: 'var(--cyan)' }}>IN THE ARENA.</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 520 }}>
          Apex Duel matches gamers head-to-head, tracks every result, and ranks the arena live from your Supabase data.
        </p>
        <a
          href="#leaderboard"
          className="mono"
          style={{
            marginTop: 12,
            padding: '14px 32px',
            background: 'var(--text)',
            color: 'var(--bg)',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          }}
        >
          View Leaderboard
        </a>
      </div>
    </section>
  );
}