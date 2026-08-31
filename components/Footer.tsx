import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--panel-border)',
        marginTop: 80,
        padding: '32px 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <span className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>
          © {new Date().getFullYear()} APEX DUEL — built for the arena.
        </span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/termsofplay" className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>
            Terms of Play
          </Link>
          {['Discord', 'Twitch', 'X'].map((s) => (
            <a key={s} href="#" className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}