import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getActiveChallenges } from '../lib/activeChallenges';
import { supabase } from '../lib/supabaseClient';

export default function BottomNav() {
  const router = useRouter();
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCount() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setActiveCount(0);
        return;
      }
      const activeItems = await getActiveChallenges();
      setActiveCount(activeItems.length);
    }

    fetchCount();
  }, [router.pathname]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(10,11,20,0.96)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--panel-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
      }}
    >
      <Link href="/" style={navItemStyle(router.pathname === '/')}>
        <span style={{ fontSize: '18px' }}>🏠</span>
        <span style={{ fontSize: '10px' }}>Home</span>
      </Link>

      <Link href="/active" style={navItemStyle(router.pathname === '/active')}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          {activeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                background: 'var(--red)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 800,
                borderRadius: '999px',
                minWidth: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: '10px' }}>Active</span>
      </Link>

      <Link href="/transfer" style={navItemStyle(router.pathname.startsWith('/transfers'))}>
        <span style={{ fontSize: '18px' }}>🔄</span>
        <span style={{ fontSize: '10px' }}>Transfer</span>
      </Link>

      <Link href="/wallet" style={navItemStyle(router.pathname === '/wallet')}>
        <span style={{ fontSize: '18px' }}>💳</span>
        <span style={{ fontSize: '10px' }}>Wallet</span>
      </Link>
    </div>
  );
}

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  color: isActive ? 'var(--red)' : 'var(--muted)',
  textDecoration: 'none',
  fontWeight: isActive ? 700 : 500,
});