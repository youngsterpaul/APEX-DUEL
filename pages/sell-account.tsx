import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { uploadListingPhoto } from '../lib/storage';

interface Game {
  id: string;
  title: string;
}

export default function SellAccount() {
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [gameId, setGameId] = useState('');
  const [username, setUsername] = useState('');
  const [rating, setRating] = useState('');
  const [ranking, setRanking] = useState('');
  const [price, setPrice] = useState('');
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('games')
      .select('id, title')
      .order('title', { ascending: true })
      .then(({ data }) => {
        if (data) setGames(data);
      });
  }, []);

  const onPhotoChange = (which: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const url = file ? URL.createObjectURL(file) : null;
    if (which === 1) {
      setPhoto1(file);
      setPreview1(url);
    } else {
      setPhoto2(file);
      setPreview2(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: 'error', text: 'You must be signed in to sell an account.' });
      return;
    }
    if (!gameId) {
      setMessage({ type: 'error', text: 'Please select a game.' });
      return;
    }
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Enter the account username.' });
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setMessage({ type: 'error', text: 'Enter a sale price greater than $0.' });
      return;
    }
    if (!photo1 || !photo2) {
      setMessage({ type: 'error', text: 'Please upload both photos of the account.' });
      return;
    }

    setLoading(true);
    try {
      const [url1, url2] = await Promise.all([
        uploadListingPhoto(session.user.id, photo1),
        uploadListingPhoto(session.user.id, photo2),
      ]);

      const { data, error } = await supabase
        .from('account_listings')
        .insert([
          {
            game_id: gameId,
            seller_id: session.user.id,
            in_game_username: username.trim(),
            rating: rating.trim(),
            ranking: ranking.trim(),
            price: priceNum,
            photos: [url1, url2],
            status: 'active',
          },
        ])
        .select('id, share_code')
        .single();

      if (error) throw error;

      setShareCode(data.share_code);
      setMessage({ type: 'success', text: 'Your account is now listed on the market!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (shareCode) {
    return (
      <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
        <Head>
          <title>Listing created | ApexDuel</title>
        </Head>
        <section style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h1 className="display" style={{ fontSize: 28, textTransform: 'uppercase', marginBottom: 12 }}>
            Listed for sale!
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Buyers can also find this listing directly by sharing this code:
          </p>
          <div
            className="mono"
            style={{
              display: 'inline-block',
              background: '#131627',
              border: '1px solid var(--panel-border)',
              padding: '16px 32px',
              fontSize: 26,
              letterSpacing: '0.3em',
              borderRadius: 6,
              color: 'var(--gold)',
              marginBottom: 28,
            }}
          >
            {shareCode}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => router.push('/markets')} style={primaryButtonStyle}>
              View on Market
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Sell Your Account | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Market
        </span>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 38px)', textTransform: 'uppercase', margin: '8px 0 24px' }}>
          Sell Your Account
        </h1>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 6,
              marginBottom: 20,
              fontSize: 13,
              background: message.type === 'error' ? 'rgba(255,51,75,0.12)' : 'rgba(0,255,100,0.12)',
              color: message.type === 'error' ? 'var(--red)' : '#00ff64',
              border: `1px solid ${message.type === 'error' ? 'var(--red)' : '#00ff64'}`,
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Account username (in-game)</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ShadowStriker_99"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Game</label>
            <select required value={gameId} onChange={(e) => setGameId(e.target.value)} style={inputStyle}>
              <option value="">Select a game…</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Squad strength rating</label>
              <input
                type="text"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="e.g. 4.8 / 5"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ranking</label>
              <input
                type="text"
                value={ranking}
                onChange={(e) => setRanking(e.target.value)}
                placeholder="e.g. Predator, Diamond II"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sale price (USD)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 50"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <PhotoPicker label="Photo 1" preview={preview1} onChange={onPhotoChange(1)} />
            <PhotoPicker label="Photo 2" preview={preview2} onChange={onPhotoChange(2)} />
          </div>

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Submitting…' : 'Submit Listing'}
          </button>
        </form>
      </section>
    </div>
  );
}

function PhotoPicker({
  label,
  preview,
  onChange,
}: {
  label: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 120,
          borderRadius: 6,
          border: '1px dashed var(--panel-border)',
          background: preview ? `center/cover no-repeat url(${preview})` : '#131627',
          cursor: 'pointer',
          color: 'var(--muted)',
          fontSize: 12,
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {!preview && <span>Click to upload</span>}
        <input type="file" accept="image/*" required onChange={onChange} style={{ display: 'none' }} />
      </label>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#131627',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#0a0b14',
  padding: '13px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  fontSize: 14,
};