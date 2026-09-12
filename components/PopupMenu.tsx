import Link from 'next/link';

interface PopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isAdmin: boolean;
  onSignOut: () => void;
}

export default function PopupMenu({ isOpen, onClose, user, isAdmin, onSignOut }: PopupMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Align to top
        paddingTop: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 32px)',
          maxWidth: 420,
          background: '#131627',
          border: '1px solid var(--panel-border)',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          animation: 'slideFromTop 0.25s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/transfer" onClick={onClose} style={menuLinkStyle}>
            💸 Transfer Funds
          </Link>

          {user ? (
            <>
              <Link href="/profile" onClick={onClose} style={menuLinkStyle}>
                👤 Profile
              </Link>
              <Link href="/wallet" onClick={onClose} style={menuLinkStyle}>
                💳 Wallet
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={onClose} style={{ ...menuLinkStyle, color: 'var(--red)' }}>
                  ⚙️ Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{
                  ...menuLinkStyle,
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                🚪 Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" onClick={onClose} style={menuLinkStyle}>
              🔑 Sign In / Register
            </Link>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

const menuLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 6,
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
};