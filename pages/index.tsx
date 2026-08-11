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
  { href: '/categories', label: 'Categories' },
  { href: '/markets', label: 'Markets' },
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
          <Link href="/" className="display" style={{ fontSize: 22, fontWeight: 800, textDecoration: 'none', color: '#fff', letterSpacing: '0.02em' }}>
            APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontWeight: 600,
                  fontSize: 14,
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

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {/* Challenge CTA Button */}
            <Link
              href="/challenges"
              style={{
                background: 'var(--red)',
                color: '#fff',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textDecoration: 'none',
                borderRadius: 2,
                transform: 'skewX(-10deg)',
                display: 'inline-block',
                boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
              }}
            >
              <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>Challenge</span>
            </Link>

            {/* Hamburger / Menu toggle button */}
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                padding: '8px 10px',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                justifyContent: 'center',
                alignItems: 'center',
                height: 38,
                width: 42,
              }}
              aria-label="Open Menu"
            >
              <span style={{ width: 18, height: 2, background: '#fff' }}></span>
              <span style={{ width: 18, height: 2, background: '#fff' }}></span>
              <span style={{ width: 18, height: 2, background: '#fff' }}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Render modular Popup Menu */}
      <PopupMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        onSignOut={async () => { await supabase.auth.signOut(); }}
      />

      <style jsx global>{`
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}