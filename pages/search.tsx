import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { findByCode, codeMatchHref, CodeMatch } from '../lib/searchByCode';

export default function SearchByCode() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'not_found'>('idle');
  const [match, setMatch] = useState<CodeMatch | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus('searching');
    setMatch(null);
    const result = await findByCode(code);
    if (!result) {
      setStatus('not_found');
      return;
    }
    setStatus('idle');
    setMatch(result);
  };

  const kindLabel: Record<CodeMatch['kind'], string> = {
    listing: 'Account for sale',
    duel: '1v1 Match',
    tournament: 'Tournament',
    league: 'League',
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Search by code | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px 80px' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Search
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 38px)', textTransform: 'uppercase', margin: '8px 0 10px' }}>
          Find by code
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
          Search a share code for a 1v1, tournament, league or an account listed for sale.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setStatus('idle');
              setMatch(null);
            }}
            placeholder="e.g. 80958C"
            className="mono"
            style={{
              flex: 1,
              padding: '13px 16px',
              background: '#131627',
              border: '1px solid var(--panel-border)',
              color: '#fff',
              borderRadius: 4,
              fontSize: 15,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'var(--red)',
              color: '#0a0b14',
              border: 'none',
              padding: '13px 22px',
              fontWeight: 800,
              fontSize: 13,
              textTransform: 'uppercase',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {status === 'searching' ? '…' : 'Find'}
          </button>
        </form>

        {status === 'not_found' && (
          <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 14 }}>
            No tournament, league, challenge or listing matches that code.
          </p>
        )}

        {match && (
          <div
            style={{
              marginTop: 24,
              background: '#131627',
              border: '1px solid var(--panel-border)',
              borderRadius: 8,
              padding: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase' }}>
                {kindLabel[match.kind]}
              </span>
              <h3 style={{ margin: '4px 0 0', fontSize: 17 }}>{match.label}</h3>
            </div>
            <button
              onClick={() => router.push(codeMatchHref(match))}
              style={{
                background: 'transparent',
                border: '1px solid var(--red)',
                color: 'var(--red)',
                padding: '10px 18px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Open
            </button>
          </div>
        )}
      </section>
    </div>
  );
}