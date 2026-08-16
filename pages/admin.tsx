import Head from 'next/head';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlatformSettings, Profile } from '../lib/types';

interface Game {
  id: string;
  title: string;
}

type Tab = 'users' | 'game' | 'tournament' | 'settings';

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
          {(['users', 'game', 'tournament', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', borderRadius: 4, border: '1px solid var(--panel-border)', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                background: tab === t ? 'var(--red)' : 'transparent', color: '#fff',
              }}
            >
              {t === 'users' ? 'Users' : t === 'game' ? 'Add Game' : t === 'tournament' ? 'Create Tournament' : 'Fee Settings'}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTab />}
        {tab === 'game' && <AddGameTab />}
        {tab === 'tournament' && <CreateTournamentTab adminId={session.user.id} />}
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