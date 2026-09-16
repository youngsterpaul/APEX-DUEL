import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
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
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leagues', label: 'Leagues' },
  { href: '/duels', label: '1v1' },
];

interface CreateOption {
  href: string;
  label: string;
}

const createOptions: CreateOption[] = [
  { href: '/leagues/create', label: 'Create League' },
  { href: '/tournaments/create', label: 'Create Tournament' },
  { href: '/duel/create', label: 'Create 1v1 Match' },
];

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { count } = useCart();
  const createDesktopRef = useRef<HTMLDivElement>(null);
  const createMobileRef = useRef<HTMLDivElement>(null);

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

  // Close the Create dropdown when clicking anywhere outside of it
  useEffect(() => {
    if (!createOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = createDesktopRef.current?.contains(target);
      const insideMobile = createMobileRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [createOpen]);

  // Close the dropdown on route change
  useEffect(() => {
    const handleRouteChange = () => setCreateOpen(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router.events]);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
    setIsAdmin(Boolean(data?.is_admin));
  };

  const createButtonStyle: React.CSSProperties = {
    background: 'var(--red)',
    color: '#fff',
    padding: '8px 14px',
    fontWeight: 700,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '2px',
    transform: 'skewX(-10deg)',
    display: 'inline-block',
    boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
    cursor: 'pointer',
  };

  const mobileCreateButtonStyle: React.CSSProperties = {
    background: 'var(--red)',
    color: '#fff',
    padding: '10px 14px',
    fontWeight: 700,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '4px',
    display: 'block',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
    cursor: 'pointer',
  };

  const CreateDropdown = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        left: fullWidth ? 0 : 'auto',
        background: '#131627',
        border: '1px solid var(--panel-border)',
        borderRadius: 6,
        minWidth: fullWidth ? undefined : 190,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 999,
      }}
    >
      {createOptions.map((opt) => (
        <Link
          key={opt.href}
          href={opt.href}
          onClick={() => setCreateOpen(false)}
          style={{
            display: 'block',
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );

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
            height: '72px',
            padding: '0 16px',
            maxWidth: '100%',
          }}
        >
          {/* Home Logo */}
          <Link href="/" className="display" style={{ fontSize: '22px', fontWeight: 800, textDecoration: 'none', color: '#fff', letterSpacing: '0.02em' }}>
            APEX<span style={{ color: 'var(--red)' }}>DUEL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ gap: '28px', alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
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

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '4px',
                border: '1px solid var(--panel-border)',
                background: 'transparent',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              🛒
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    minWidth: '16px',
                    height: '16px',
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
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textDecoration: 'none',
                borderRadius: '2px',
                transform: 'skewX(-10deg)',
                display: 'inline-block',
                boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
              }}
            >
              <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>Challenge</span>
            </Link>

            {/* Create Button — desktop only (shown inline next to Challenge) */}
            <div className="create-desktop-wrap" ref={createDesktopRef} style={{ position: 'relative' }}>
              <button onClick={() => setCreateOpen((v) => !v)} style={createButtonStyle}>
                <span style={{ display: 'inline-block', transform: 'skewX(10deg)' }}>+ Create</span>
              </button>
              {createOpen && <CreateDropdown />}
            </div>

            {/* Hamburger / Menu toggle button */}
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                padding: '8px 10px',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                justifyContent: 'center',
                alignItems: 'center',
                height: '38px',
                width: '42px',
              }}
              aria-label="Open Menu"
            >
              <span style={{ width: '18px', height: '2px', background: '#fff' }}></span>
              <span style={{ width: '18px', height: '2px', background: '#fff' }}></span>
              <span style={{ width: '18px', height: '2px', background: '#fff' }}></span>
            </button>
          </div>
        </div>

        {/* Create Button — mobile only, new row below the icon row, sized to the same row width */}
        <div className="create-mobile-wrap">
          <div className="container" style={{ padding: '10px 16px 0', maxWidth: '100%' }}>
            <div className="create-mobile-inner" ref={createMobileRef} style={{ position: 'relative', width: '100%' }}>
              <button onClick={() => setCreateOpen((v) => !v)} style={mobileCreateButtonStyle}>
                + Create
              </button>
              {createOpen && <CreateDropdown fullWidth />}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Header Navigation Bar */}
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
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 'max-content',
              margin: '0 auto',
            }}
          >
            {navLinks.map((link) => {
              const isActive = router.pathname === link.href;
              const isHomeLink = link.href === '/';

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isHomeLink ? 'mobile-home-nav-item' : ''}
                  style={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: isActive ? 'var(--red)' : '#ccc',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: isActive ? 'rgba(255,59,92,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(255,59,92,0.3)' : '1px solid transparent',
                    flexShrink: 0,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Responsive layout controls */}
      <style jsx global>{`
        .desktop-nav {
          display: none;
        }
        .mobile-subnav {
          display: block;
        }

        /* Create button: hidden on desktop row context by default, shown via media queries below */
        .create-desktop-wrap {
          display: none;
        }
        .create-mobile-wrap {
          display: block;
          position: relative;
          z-index: 55;
        }

        /* Hide Home link from top sub-nav on small screens (max 768px) */
        @media (max-width: 768px) {
          .mobile-home-nav-item {
            display: none !important;
          }
        }

        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-subnav {
            display: none !important;
          }
          .create-desktop-wrap {
            display: inline-flex !important;
          }
          .create-mobile-wrap {
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