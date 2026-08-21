import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import PopupMenu from './PopupMenu';
import CartModal from './CartModal';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/markets', label: 'Markets' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leagues', label: 'Leagues' },
  { href: '/duels', label: '1v1' },
  { href: '/transfers', label: 'Transfers' },
];

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();

  const isHomePage = router.pathname === '/';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) checkAdmin(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
    setIsAdmin(Boolean(data?.is_admin));
  };

  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--panel-border)',
          background: 'rgba(10,11,20,0.95)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 72,
            padding: '0 16px',
            maxWidth: '100%',
          }}
        >
          {/* Home Logo */}
          <Link href="/" className="display" style={{ fontSize: 22, fontWeight: 800, textDecoration: 'none', color: '#fff', letterSpacing: '0.02em' }}>
            APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ gap: 28, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: router.pathname === link.href ? '#fff' : 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 4,
                border: '1px solid var(--panel-border)',
                background: 'transparent',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              🛒
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 999,
                    minWidth: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {count}
                </span>
              )}
            </button>

            {/* Challenge CTA Button */}
            <Link
              href="/challenges"
              style={{
                background: 'var(--red)',
                color: '#fff',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 12,
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

        {/* Mobile Sub-Header Navigation Bar (Index Page Only) */}
        {isHomePage && (
          <div
            className="mobile-subnav"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: '#0a0b14',
              padding: '8px 12px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: router.pathname === link.href ? 'var(--red)' : '#ccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: router.pathname === link.href ? 'rgba(255,59,92,0.12)' : 'transparent',
                    flexShrink: 0,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* CSS Rule for showing/hiding desktop vs mobile elements */}
      <style jsx global>{`
        .desktop-nav {
          display: none;
        }
        .mobile-subnav {
          display: block;
        }

        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-subnav {
            display: none !important;
          }
        }
      `}</style>

      {/* Render modular Popup Menu */}
      <PopupMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onSignOut={async () => { await supabase.auth.signOut(); }}
      />

      {/* Cart popup */}
      <CartModal isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}