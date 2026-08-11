import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/duels', label: 'Duels' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Header() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--panel-border)',
        background: 'rgba(10,11,20,0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 72,
        }}
      >
        <Link href="/" className="display" style={{ fontSize: 22, fontWeight: 800 }}>
          APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
        </Link>

        <nav style={{ display: 'flex', gap: 32 }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/duels"
          className="mono"
          style={{
            background: 'var(--red)',
            color: '#0a0b14',
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
          }}
        >
          Challenge
        </Link>
      </div>
    </header>
  );
}