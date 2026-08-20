import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getActiveChallenges, ActiveItem } from '../lib/activeChallenges';

function formatTime(iso: string | null): string {
  if (!iso) return 'Time TBD';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ActiveChallenges() {
  const [items, setItems] = useState<ActiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSignedIn(!!session);
    const data = await getActiveChallenges();
    setItems(data);
    setLoading(false);
  };

  const handleSaveLink = async (leagueId: string) => {
    setSavingId(leagueId);
    setMessage(null);
    const link = linkDrafts[leagueId] || '';
    const { error } = await supabase.rpc('set_league_group_link', { p_league_id: leagueId, p_link: link });
    setSavingId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Group link saved.');
    load();
  };

  const duels = items.filter((i) => i.kind === 'duel');
  const tournaments = items.filter((i) => i.kind === 'tournament');
  const leagues = items.filter((i) => i.kind === 'league');

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>My Active Challenges | ApexDuel</title>
      </Head>

      <section style={{ padding: '48px 24px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', textTransform: 'uppercase' }}>
          My Active Challenges
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
          Everything you're currently part of — duels, tournaments, and leagues.
        </p>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        {!signedIn ? (
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Please sign in to see your active challenges.</div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            You haven't joined any duels, tournaments, or leagues yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {duels.length > 0 && (
              <div>
                <h2 className="display" style={{ fontSize: 20, marginBottom: 14, textTransform: 'uppercase' }}>
                  1v1 Duels
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {duels.map((d: any) => (
                    <div key={d.id} style={cardStyle}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15 }}>{d.game}</h4>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {formatTime(d.scheduled_at)} · Status: {d.status}
                        </span>
                      </div>
                      <Link href={`/duels/${d.id}`} style={viewButtonStyle}>
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tournaments.length > 0 && (
              <div>
                <h2 className="display" style={{ fontSize: 20, marginBottom: 14, textTransform: 'uppercase' }}>
                  Tournaments
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tournaments.map((t: any) => (
                    <div key={t.id} style={cardStyle}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15 }}>{t.name}</h4>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Starts {formatTime(t.starts_at)} · Status: {t.status}
                        </span>
                      </div>
                      <Link href={`/tournaments/${t.id}`} style={viewButtonStyle}>
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leagues.length > 0 && (
              <div>
                <h2 className="display" style={{ fontSize: 20, marginBottom: 14, textTransform: 'uppercase' }}>
                  Leagues
                </h2>
                {message && <p style={{ fontSize: 13, color: 'var(--cyan)', marginBottom: 10 }}>{message}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leagues.map((l: any) => (
                    <div key={l.id} style={{ ...cardStyle, flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15 }}>{l.name}</h4>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {formatTime(l.starts_at)} – {formatTime(l.ends_at)} · Status: {l.status}
                          </span>
                        </div>
                        <Link href={`/leagues/${l.id}`} style={viewButtonStyle}>
                          View
                        </Link>
                      </div>

                      {l.group_link ? (
                        <a
                          href={l.group_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            fontSize: 13,
                            color: 'var(--cyan)',
                            textDecoration: 'underline',
                          }}
                        >
                          Join the WhatsApp / Discord group →
                        </a>
                      ) : l.is_creator ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={linkDrafts[l.id] ?? ''}
                            onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                            placeholder="Paste your WhatsApp or Discord invite link"
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              background: '#0a0b14',
                              border: '1px solid var(--panel-border)',
                              color: '#fff',
                              borderRadius: 4,
                              fontSize: 12,
                            }}
                          />
                          <button
                            onClick={() => handleSaveLink(l.id)}
                            disabled={savingId === l.id}
                            style={{
                              background: 'var(--red)',
                              color: '#0a0b14',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            {savingId === l.id ? '...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          No group link added yet.
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#131627',
  border: '1px solid var(--panel-border)',
  borderRadius: 8,
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
};

const viewButtonStyle: React.CSSProperties = {
  border: '1px solid var(--red)',
  color: 'var(--red)',
  padding: '8px 16px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  borderRadius: 4,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};