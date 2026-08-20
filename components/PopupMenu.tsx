import Link from 'next/link';

interface PopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isAdmin?: boolean;
  onSignOut: () => void;
}

const menuLinks = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Categories' },
  { href: '/markets', label: 'Markets' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leagues', label: 'Leagues' },
  { href: '/duels', label: '1v1 Matches' },
];

export default function PopupMenu({ isOpen, onClose, user, isAdmin, onSignOut }: PopupMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,11,20,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 280,
          maxWidth: '85vw',
          height: '100%',
          background: '#0f1120',
          borderLeft: '1px solid var(--panel-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 800 }}>
            APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{
                padding: '12px 8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid var(--panel-border)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--panel-border)' }}>
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={onClose}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  marginBottom: 10,
                  textDecoration: 'none',
                }}
              >
                My Profile
              </Link>
              <Link
                href="/transfers"
                onClick={onClose}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  marginBottom: 10,
                  textDecoration: 'none',
                }}
              >
                My Transfers
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    border: '1px solid var(--panel-border)',
                    color: '#fff',
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'uppercase',
                    borderRadius: 4,
                    marginBottom: 10,
                    textDecoration: 'none',
                  }}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--red)',
                  color: 'var(--red)',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'var(--red)',
                color: '#fff',
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'uppercase',
                borderRadius: 4,
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}