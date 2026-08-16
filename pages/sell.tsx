import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadListingPhoto } from '../lib/storage';

interface Game {
  id: string;
  title: string;
}

const MAX_PHOTOS = 2;

export default function SellAccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);

  const [gameId, setGameId] = useState('');
  const [inGameUsername, setInGameUsername] = useState('');
  const [rating, setRating] = useState('');
  const [ranking, setRanking] = useState('');
  const [squadStrength, setSquadStrength] = useState('');
  const [level, setLevel] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [emailProofFile, setEmailProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase
      .from('games')
      .select('id, title')
      .or('hidden.eq.false,hidden.is.null')
      .order('title')
      .then(({ data }) => {
        if (data) {
          setGames(data);
          if (data[0]) setGameId(data[0].id);
        }
      });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList).slice(0, MAX_PHOTOS - files.length);
    const seen = new Set(files.map((f) => `${f.name}-${f.size}`));
    const deduped: File[] = [];
    for (const f of incoming) {
      const key = `${f.name}-${f.size}`;
      if (seen.has(key)) {
        setMessage({ type: 'error', text: `Skipped "${f.name}" — that looks like a duplicate of a photo you already added.` });
        continue;
      }
      seen.add(key);
      deduped.push(f);
    }
    setFiles((prev) => [...prev, ...deduped].slice(0, MAX_PHOTOS));
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!session) {
      setMessage({ type: 'error', text: 'Sign in to list an account for sale.' });
      return;
    }
    if (!gameId) {
      setMessage({ type: 'error', text: 'Select a game.' });
      return;
    }
    if (files.length !== MAX_PHOTOS) {
      setMessage({ type: 'error', text: `Add exactly ${MAX_PHOTOS} account photos.` });
      return;
    }
    if (!emailProofFile) {
      setMessage({ type: 'error', text: 'Add a photo of the email account tied to this game account (ownership proof).' });
      return;
    }

    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files) {
        photoUrls.push(await uploadListingPhoto(session.user.id, file));
      }
      const emailProofUrl = await uploadListingPhoto(session.user.id, emailProofFile);

      const { data, error } = await supabase
        .from('account_listings')
        .insert({
          game_id: gameId,
          seller_id: session.user.id,
          in_game_username: inGameUsername,
          rating,
          ranking,
          squad_strength: squadStrength ? parseFloat(squadStrength) : null,
          level: level ? parseInt(level, 10) : null,
          account_email: accountEmail,
          email_proof_photo: emailProofUrl,
          price: parseFloat(price),
          photos: photoUrls,
        })
        .select()
        .single();
      if (error) throw error;

      setMessage({ type: 'success', text: 'Listing published! Redirecting…' });
      setTimeout(() => router.push(`/markets/listing/${data.id}`), 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not publish listing.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Sell Your Account | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 560, margin: '0 auto', padding: '50px 20px' }}>
        <Link href="/markets" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to markets
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', margin: '10px 0 24px' }}>
          Sell Your <span style={{ color: 'var(--red)' }}>Account</span>
        </h1>

        {!session && (
          <div style={{ padding: 12, marginBottom: 20, borderRadius: 4, background: 'rgba(255,0,0,0.1)', border: '1px solid #ff4444', fontSize: 13 }}>
            You must be signed in to list an account. <Link href="/login" style={{ color: '#ff4444', textDecoration: 'underline' }}>Sign in</Link>
          </div>
        )}

        {message && (
          <div
            style={{
              padding: 10,
              marginBottom: 20,
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

        <form onSubmit={handleSubmit} style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 24 }}>
          <label style={labelStyle}>Game</label>
          <select required value={gameId} onChange={(e) => setGameId(e.target.value)} style={inputStyle}>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>

          <label style={labelStyle}>Account username</label>
          <input required value={inGameUsername} onChange={(e) => setInGameUsername(e.target.value)} style={inputStyle} placeholder="e.g. ShadowStriker99" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Squad strength</label>
              <input required type="number" step="1" value={squadStrength} onChange={(e) => setSquadStrength(e.target.value)} style={inputStyle} placeholder="e.g. 3200" />
            </div>
            <div>
              <label style={labelStyle}>Level</label>
              <input required type="number" step="1" value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle} placeholder="e.g. 340" />
            </div>
          </div>

          <label style={labelStyle}>Ranking</label>
          <input required value={ranking} onChange={(e) => setRanking(e.target.value)} style={inputStyle} placeholder="e.g. Diamond II" />

          <label style={labelStyle}>Rating notes (optional detail)</label>
          <input value={rating} onChange={(e) => setRating(e.target.value)} style={inputStyle} placeholder="e.g. 1850 MMR, top 5% globally" />

          <label style={labelStyle}>Email tied to the account</label>
          <input required type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} style={inputStyle} placeholder="account-owner@email.com" />

          <label style={labelStyle}>Amount the account is on sale for (USD)</label>
          <input required type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="49.99" />

          <label style={labelStyle}>Account photos (exactly {MAX_PHOTOS}, must be different images)</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {files.map((f, i) => (
              <div key={i} style={{ position: 'relative', width: 100, height: 100 }}>
                <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--panel-border)' }} />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{ position: 'absolute', top: -6, right: -6, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 11, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <label style={{ width: 100, height: 100, border: '1px dashed var(--panel-border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 26, color: 'var(--muted)' }}>
                +
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files)} />
              </label>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>{files.length}/{MAX_PHOTOS} account photos added</p>

          <label style={labelStyle}>Email account photo (ownership proof — a screenshot of the inbox for the email above)</label>
          <div style={{ marginBottom: 16 }}>
            {emailProofFile ? (
              <div style={{ position: 'relative', width: 140, height: 100 }}>
                <img src={URL.createObjectURL(emailProofFile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--panel-border)' }} />
                <button
                  type="button"
                  onClick={() => setEmailProofFile(null)}
                  style={{ position: 'absolute', top: -6, right: -6, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 11, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label style={{ width: 140, height: 100, border: '1px dashed var(--panel-border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 26, color: 'var(--muted)' }}>
                +
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setEmailProofFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting ? 'Publishing…' : 'Submit listing'}
          </button>
        </form>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--muted)',
  marginBottom: 6,
  marginTop: 16,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#0a0b14',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--red)',
  color: '#fff',
  padding: '12px',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: 4,
  marginTop: 8,
};