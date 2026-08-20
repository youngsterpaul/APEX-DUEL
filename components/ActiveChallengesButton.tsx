import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { getActiveChallenges } from '../lib/activeChallenges';

export default function ActiveChallengesButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, []);

  const load = async () => {
    const items = await getActiveChallenges();
    setCount(items.length);
  };

  if (count === 0) return null;

  return (
    <Link
      href="/active"
      className="active-challenges-fab"
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--red)',
        color: '#0a0b14',
        padding: '12px 18px',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        textDecoration: 'none',
        boxShadow: '0 8px 24px rgba(255,59,92,0.4)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#0a0b14',
          display: 'inline-block',
        }}
      />
      {count} Active
      <style jsx global>{`
        @media (max-width: 768px) {
          .active-challenges-fab {
            display: none !important;
          }
        }
      `}</style>
    </Link>
  );
}