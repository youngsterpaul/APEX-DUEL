import Head from 'next/head';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlatformSettings, Profile } from '../lib/types';

interface Game {
  id: string;
  title: string;
}

type Tab = 'users' | 'game' | 'tournament' | 'disputes' | 'withdrawals' | 'settings';

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('users');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle();
        setMe(profile);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '80px 20px' }}>Loading…</div>;
  if (!session || !me?.is_admin) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#fff' }}>
        <p style={{ color: 'var(--muted)' }}>Admin access only.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head><title>Admin | ApexDuel</title></Head>
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '50px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', marginBottom: 24 }}>Admin Panel</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['users', 'game', 'tournament', 'disputes', 'withdrawals', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 4, border: '1px solid var(--panel-border)', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                background: tab === t ? 'var(--red)' : 'transparent', color: '#fff',
              }}
            >
              {t === 'users' ? 'Users' : t === 'game' ? 'Add Game' : t === 'tournament' ? 'Create Tournament' : t === 'disputes' ? 'Transfer Disputes' : t === 'withdrawals' ? 'Withdrawals' : 'Fee Settings'}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTab />}
        {tab === 'game' && <AddGameTab />}
        {tab === 'tournament' && <CreateTournamentTab adminId={session.user.id} />}
        {tab === 'disputes' && <DisputesTab />}
        {tab === 'withdrawals' && <WithdrawalsTab />}
        {tab === 'settings' && <SettingsTab />}
      </section>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  useEffect(() => {
    supabase.from('profiles').select('*').order('email').then(({ data }) => setUsers(data || []));
  }, []);
  return (
    <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 18 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--panel-border)' }}>
            <th style={{ padding: '8px 4px' }}>Username</th>
            <th style={{ padding: '8px 4px' }}>Email</th>
            <th style={{ padding: '8px 4px' }}>Gender</th>
            <th style={{ padding: '8px 4px' }}>Balance</th>
            <th style={{ padding: '8px 4px' }}>Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
              <td style={{ padding: '8px 4px' }}>{u.username || '—'}</td>
              <td style={{ padding: '8px 4px', color: 'var(--muted)' }}>{u.email}</td>
              <td style={{ padding: '8px 4px', textTransform: 'capitalize' }}>{u.gender || '—'}</td>
              <td style={{ padding: '8px 4px' }}>${u.balance.toFixed(2)}</td>
              <td style={{ padding: '8px 4px' }}>{u.is_admin ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No users yet.</p>}
    </div>
  );
}

function AddGameTab() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('games').insert({ title, category, description });
      if (error) throw error;
      setMessage({ type: 'success', text: `${title} added.` });
      setTitle('');
      setCategory('');
      setDescription('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 20 }}>
      {message && (
        <div style={{ padding: 10, marginBottom: 14, borderRadius: 4, fontSize: 13, background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)', color: message.type === 'success' ? '#00ff64' : '#ff4444', border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}` }}>
          {message.text}
        </div>
      )}
      <label style={labelStyle}>Title</label>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      <label style={labelStyle}>Category</label>
      <input required value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} placeholder="e.g. Battle Royale" />
      <label style={labelStyle}>Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} />
      <button type="submit" disabled={busy} style={primaryButtonStyle}>{busy ? 'Adding…' : 'Add game'}</button>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
        Add a cover image afterward from the <a href="/admin-games" style={{ color: 'var(--red)' }}>Manage Game Images</a> page.
      </p>
    </form>
  );
}

function CreateTournamentTab({ adminId }: { adminId: string }) {
  const [games, setGames] = useState<Game[]>([]);
  const [gameId, setGameId] = useState('');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'round_robin' | 'elimination'>('round_robin');
  const [entryFee, setEntryFee] = useState('0');
  const [prizePool, setPrizePool] = useState('0');
  const [payoutPlaces, setPayoutPlaces] = useState<'1' | '2' | '3'>('1');
  const [stage1Games, setStage1Games] = useState('1');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.from('games').select('id, title').or('hidden.eq.false,hidden.is.null').order('title').then(({ data }) => {
      if (data) {
        setGames(data);
        if (data[0]) setGameId(data[0].id);
      }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const stages =
        format === 'round_robin'
          ? [{ name: 'Group Stage', games_per_pairing: Number(stage1Games), advance_count: null }]
          : [{ name: 'Round 1', games_per_pairing: Number(stage1Games), advance_count: null }];
      const { data, error } = await supabase.rpc('create_tournament', {
        p_game_id: gameId,
        p_name: name,
        p_format: format,
        p_stages: stages,
        p_entry_fee: parseFloat(entryFee) || 0,
        p_prize_pool: parseFloat(prizePool) || 0,
        p_payout_places: Number(payoutPlaces),
      });
      if (error) throw error;
      setMessage({ type: 'success', text: `Tournament created — share code ${data.share_code}.` });
      setName('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 20 }}>
      {message && (
        <div style={{ padding: 10, marginBottom: 14, borderRadius: 4, fontSize: 13, background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)', color: message.type === 'success' ? '#00ff64' : '#ff4444', border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}` }}>
          {message.text}
        </div>
      )}
      <label style={labelStyle}>Game</label>
      <select required value={gameId} onChange={(e) => setGameId(e.target.value)} style={inputStyle}>
        {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
      </select>
      <label style={labelStyle}>Tournament name</label>
      <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      <label style={labelStyle}>Format</label>
      <select value={format} onChange={(e) => setFormat(e.target.value as any)} style={inputStyle}>
        <option value="round_robin">Round robin (ranking)</option>
        <option value="elimination">Single elimination</option>
      </select>
      <label style={labelStyle}>Games per matchup</label>
      <input type="number" min="1" max="9" value={stage1Games} onChange={(e) => setStage1Games(e.target.value)} style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Entry fee (USD)</label>
          <input type="number" min="0" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Prize pool (USD)</label>
          <input type="number" min="0" step="0.01" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <label style={labelStyle}>Paid places</label>
      <select value={payoutPlaces} onChange={(e) => setPayoutPlaces(e.target.value as any)} style={inputStyle}>
        <option value="1">Top 1</option>
        <option value="2">Top 2</option>
        <option value="3">Top 3</option>
      </select>
      <button type="submit" disabled={busy} style={primaryButtonStyle}>{busy ? 'Creating…' : 'Create tournament'}</button>
    </form>
  );
}

function DisputesTab() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [listingsMap, setListingsMap] = useState<Record<string, any>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settling, setSettling] = useState(false);

  const handleSettleExpired = async () => {
    setSettling(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('admin_settle_all_expired_events');
    setSettling(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: `Settled ${data} match${data === 1 ? '' : 'es'} across expired tournaments/leagues.` });
  };

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transfers')
      .select('*')
      .eq('status', 'disputed')
      .order('dispute_raised_at', { ascending: true });

    const rows = data || [];
    setTransfers(rows);

    if (rows.length > 0) {
      const listingIds = Array.from(new Set(rows.map((t) => t.listing_id)));
      const peopleIds = Array.from(new Set(rows.flatMap((t) => [t.buyer_id, t.seller_id])));
      const [{ data: listings }, { data: profiles }] = await Promise.all([
        supabase.from('account_listings').select('id, in_game_username, price').in('id', listingIds),
        supabase.from('profiles').select('id, username, email').in('id', peopleIds),
      ]);
      const lMap: Record<string, any> = {};
      (listings || []).forEach((l: any) => (lMap[l.id] = l));
      const pMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => (pMap[p.id] = p));
      setListingsMap(lMap);
      setProfilesMap(pMap);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const resolve = async (transferId: string, resolution: 'release_to_seller' | 'refund_buyer') => {
    const confirmText =
      resolution === 'release_to_seller'
        ? 'Release the escrowed funds to the seller? This cannot be undone.'
        : "Refund the buyer and reopen the listing? This cannot be undone.";
    if (!window.confirm(confirmText)) return;

    setBusyId(transferId);
    setMessage(null);
    const { error } = await supabase.rpc('admin_resolve_transfer', {
      p_transfer_id: transferId,
      p_resolution: resolution,
    });
    setBusyId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({
      type: 'success',
      text: resolution === 'release_to_seller' ? 'Funds released to the seller.' : 'Buyer refunded and listing reopened.',
    });
    fetchDisputes();
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading disputes…</p>;

  return (
    <div>
      <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, textTransform: 'uppercase' }}>Auto-forfeit expired events</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Any tournament/league past its end time gets swept: players who never reported a pending match forfeit it to their opponent.
          </p>
        </div>
        <button onClick={handleSettleExpired} disabled={settling} style={{ ...primaryButtonStyle, marginTop: 0, width: 'auto', padding: '10px 20px' }}>
          {settling ? 'Settling…' : 'Settle Expired Events'}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 10,
            marginBottom: 14,
            borderRadius: 4,
            fontSize: 13,
            background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
            color: message.type === 'success' ? '#00ff64' : '#ff4444',
            border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {transfers.length === 0 ? (
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 30, textAlign: 'center', color: 'var(--muted)' }}>
          No open disputes. 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {transfers.map((t) => {
            const listing = listingsMap[t.listing_id];
            const buyer = profilesMap[t.buyer_id];
            const seller = profilesMap[t.seller_id];
            return (
              <div key={t.id} style={{ background: '#131627', border: '1px solid #ff4444', borderRadius: 8, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{listing?.in_game_username || 'Account'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Buyer: <strong style={{ color: '#fff' }}>{buyer?.username || buyer?.email}</strong> · Seller:{' '}
                      <strong style={{ color: '#fff' }}>{seller?.username || seller?.email}</strong> · Escrowed: ${t.price?.toFixed(2)}
                    </div>
                  </div>
                  <a href={`/transfer/${t.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--red)', fontSize: 12, alignSelf: 'center' }}>
                    Open full chat ↗
                  </a>
                </div>

                <div style={{ background: '#0a0b14', border: '1px solid var(--panel-border)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Buyer's report — {t.dispute_type}
                  </p>
                  <p style={{ fontSize: 13, marginBottom: 8 }}>{t.dispute_reason}</p>
                  {t.dispute_evidence_urls?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {t.dispute_evidence_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="Evidence" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--panel-border)' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {t.seller_responded_at ? (
                  <div style={{ background: '#0a0b14', border: '1px solid var(--panel-border)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Seller's response</p>
                    <p style={{ fontSize: 13, marginBottom: 4 }}>{t.seller_response_note}</p>
                    {t.seller_response_email && <p style={{ fontSize: 12 }}>Account email: <strong>{t.seller_response_email}</strong></p>}
                    {t.seller_response_username && <p style={{ fontSize: 12 }}>In-game username: <strong>{t.seller_response_username}</strong></p>}
                    {t.seller_response_evidence_urls?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {t.seller_response_evidence_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="Evidence" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--panel-border)' }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Seller has not responded yet.</p>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => resolve(t.id, 'release_to_seller')}
                    disabled={busyId === t.id}
                    style={{ ...primaryButtonStyle, marginTop: 0, flex: 1 }}
                  >
                    {busyId === t.id ? 'Working…' : 'Release Funds to Seller'}
                  </button>
                  <button
                    onClick={() => resolve(t.id, 'refund_buyer')}
                    disabled={busyId === t.id}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: '#ff4444',
                      border: '1px solid #ff4444',
                      borderRadius: 4,
                      padding: '12px',
                      fontWeight: 700,
                      fontSize: 13,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                  >
                    {busyId === t.id ? 'Working…' : 'Refund Buyer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WithdrawalsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    const rows = data || [];
    setRequests(rows);

    if (rows.length > 0) {
      const ids = Array.from(new Set(rows.map((r) => r.profile_id)));
      const { data: profiles } = await supabase.from('profiles').select('id, username, email').in('id', ids);
      const map: Record<string, any> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p));
      setProfilesMap(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const resolve = async (requestId: string, action: 'complete' | 'reject') => {
    const confirmText =
      action === 'complete'
        ? "Mark as paid out? Only do this after you've actually sent the money."
        : 'Reject this withdrawal and refund the balance?';
    if (!window.confirm(confirmText)) return;

    setBusyId(requestId);
    setMessage(null);
    const { error } = await supabase.rpc(action === 'complete' ? 'admin_complete_withdrawal' : 'admin_reject_withdrawal', {
      p_request_id: requestId,
    });
    setBusyId(null);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: action === 'complete' ? 'Marked as paid out.' : 'Rejected and refunded.' });
    fetchRequests();
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading withdrawal requests…</p>;

  return (
    <div>
      {message && (
        <div style={{ padding: 10, marginBottom: 14, borderRadius: 4, fontSize: 13, background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)', color: message.type === 'success' ? '#00ff64' : '#ff4444', border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}` }}>
          {message.text}
        </div>
      )}

      {requests.length === 0 ? (
        <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 30, textAlign: 'center', color: 'var(--muted)' }}>
          No pending withdrawal requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((r) => {
            const user = profilesMap[r.profile_id];
            return (
              <div key={r.id} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>${Number(r.amount).toFixed(2)} via {r.method === 'mpesa' ? 'M-Pesa' : r.method === 'crypto' ? 'Crypto' : 'Google Pay'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {user?.username || user?.email} · Send to: <strong style={{ color: '#fff' }}>{r.destination}</strong> · Requested {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => resolve(r.id, 'complete')} disabled={busyId === r.id} style={{ ...primaryButtonStyle, marginTop: 0, width: 'auto', padding: '10px 16px' }}>
                    {busyId === r.id ? 'Working…' : 'Mark Paid'}
                  </button>
                  <button
                    onClick={() => resolve(r.id, 'reject')}
                    disabled={busyId === r.id}
                    style={{ background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: 4, padding: '10px 16px', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [serviceFee, setServiceFee] = useState('');
  const [commission, setCommission] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings(data);
        setServiceFee(String(data.service_fee_pct));
        setCommission(String(data.sale_commission_pct));
      }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.rpc('update_platform_settings', {
        p_service_fee_pct: parseFloat(serviceFee),
        p_sale_commission_pct: parseFloat(commission),
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings updated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;

  return (
    <form onSubmit={submit} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 20 }}>
      {message && (
        <div style={{ padding: 10, marginBottom: 14, borderRadius: 4, fontSize: 13, background: message.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)', color: message.type === 'success' ? '#00ff64' : '#ff4444', border: `1px solid ${message.type === 'success' ? '#00ff64' : '#ff4444'}` }}>
          {message.text}
        </div>
      )}
      <label style={labelStyle}>Service fee % (challenges/tournaments, informational)</label>
      <input type="number" min="0" max="100" step="0.1" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} style={inputStyle} />
      <label style={labelStyle}>Marketplace sale commission % (deducted from every account sale)</label>
      <input type="number" min="0" max="100" step="0.1" value={commission} onChange={(e) => setCommission(e.target.value)} style={inputStyle} />
      <button type="submit" disabled={busy} style={primaryButtonStyle}>{busy ? 'Saving…' : 'Save settings'}</button>
    </form>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#0a0b14', border: '1px solid var(--panel-border)', color: '#fff', borderRadius: 4, fontSize: 14 };
const primaryButtonStyle: React.CSSProperties = { width: '100%', background: 'var(--red)', color: '#fff', padding: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 4, marginTop: 20 };