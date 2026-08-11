import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import PopupMenu from './PopupMenu';

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
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
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
            padding: '0 24px',
          }}
        >
          <Link href="/" className="display" style={{ fontSize: 22, fontWeight: 800, textDecoration: 'none', color: '#fff' }}>
            APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
          </Link>

          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
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
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
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
                textDecoration: 'none',
              }}
            >
              Challenge
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              aria-label="Open Menu"
            >
              <span style={{ width: 20, height: 2, background: '#fff' }}></span>
              <span style={{ width: 20, height: 2, background: '#fff' }}></span>
              <span style={{ width: 20, height: 2, background: '#fff' }}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Render modular Popup Menu */}
      <PopupMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        onSignOut={handleSignOut}
      />
    </>
  );
}