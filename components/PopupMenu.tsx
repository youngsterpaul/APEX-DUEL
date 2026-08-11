import Link from 'next/link';

interface PopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
}

export default function PopupMenu({ isOpen, onClose, user, onSignOut }: PopupMenuProps) {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.05em' }}>
            Navigation Menu
          </h3>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/" onClick={onClose} style={linkStyle}>
            Home
          </Link>
          <Link href="/categories" onClick={onClose} style={linkStyle}>
            Categories
          </Link>
          <Link href="/markets" onClick={onClose} style={linkStyle}>
            Markets
          </Link>
          <Link href="/challenges" onClick={onClose} style={linkStyle}>
            Challenges & Competitions
          </Link>

          <hr style={{ borderColor: 'var(--panel-border)', margin: '10px 0' }} />

          {user ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
                Logged in as: <strong style={{ color: '#fff' }}>{user.email}</strong>
              </div>
              <button 
                onClick={() => { onSignOut(); onClose(); }} 
                style={signOutButtonStyle}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" onClick={onClose} style={authButtonStyle}>
              Sign In / Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  zIndex: 100,
  display: 'flex',
  justifyContent: 'flex-end',
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  height: '100%',
  background: '#131627',
  borderLeft: '1px solid var(--panel-border)',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: 28,
  cursor: 'pointer',
  lineHeight: 1,
};

const linkStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 600,
  padding: '10px 12px',
  borderRadius: 4,
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const authButtonStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#0a0b14',
  textAlign: 'center',
  padding: '12px',
  fontWeight: 700,
  borderRadius: 4,
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const signOutButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #ff4444',
  color: '#ff4444',
  padding: '10px',
  fontWeight: 700,
  borderRadius: 4,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};