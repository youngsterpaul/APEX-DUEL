import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 11, 20, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--panel-border)',
        height: '64px',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
      }}
    >
      {/* Left Column: Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: 800, fontSize: '20px' }}>
          APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
        </Link>
      </div>

      {/* Center Column: Quick Nav */}
      <nav
        className="desktop-quick-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          justifyContent: 'center',
        }}
      >
        <Link href="/" style={navLinkStyle(router.pathname === '/')}>
          Home
        </Link>
        <Link href="/active" style={navLinkStyle(router.pathname === '/active')}>
          Active
        </Link>
        <Link href="/transfers" style={navLinkStyle(router.pathname === '/transfers')}>
          Transfers
        </Link>
        <Link href="/wallet" style={navLinkStyle(router.pathname === '/wallet')}>
          Wallet
        </Link>
      </nav>

      {/* Right Column: Profile / Login Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        {user ? (
          <Link href="/profile" style={profileBtnStyle}>
            Profile
          </Link>
        ) : (
          <Link href="/login" style={loginBtnStyle}>
            Log In
          </Link>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-quick-nav {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  color: isActive ? '#fff' : 'var(--muted)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: isActive ? 700 : 500,
  borderBottom: isActive ? '2px solid var(--red)' : '2px solid transparent',
  paddingBottom: '4px',
  transition: 'color 0.2s ease, border-bottom 0.2s ease',
});

const profileBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  padding: '6px 16px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 600,
  textDecoration: 'none',
};

const loginBtnStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  padding: '6px 16px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 700,
  textDecoration: 'none',
};