import { useRouter } from 'next/router';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function FindByCode() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('Enter a valid code.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const [duel, tournament, league, listing] = await Promise.all([
        supabase.from('duels').select('id').eq('share_code', trimmed).maybeSingle(),
        supabase.from('tournaments').select('id').eq('share_code', trimmed).maybeSingle(),
        supabase.from('leagues').select('id').eq('share_code', trimmed).maybeSingle(),
        supabase.from('account_listings').select('id').eq('share_code', trimmed).maybeSingle(),
      ]);

      if (duel.data) return router.push(`/challenges/${duel.data.id}`);
      if (tournament.data) return router.push(`/tournaments/${tournament.data.id}`);
      if (league.data) return router.push(`/leagues/${league.data.id}`);
      if (listing.data) return router.push(`/markets/listing/${listing.data.id}`);

      setError('No match, tournament, league, or account listing found with that code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={search} style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter share code (e.g. A1B2C3)"
        maxLength={6}
        style={{
          flex: 1,
          padding: '10px 12px',
          background: '#0a0b14',
          border: '1px solid var(--panel-border)',
          color: '#fff',
          borderRadius: 4,
          fontSize: 14,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      />
      <button
        type="submit"
        disabled={busy}
        style={{
          background: 'var(--red)',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '0 18px',
          fontWeight: 700,
          fontSize: 13,
          textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? '...' : 'Find'}
      </button>
      {error && <span style={{ position: 'absolute', marginTop: 46, fontSize: 12, color: '#ff4444' }}>{error}</span>}
    </form>
  );
}