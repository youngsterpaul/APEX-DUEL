import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Game {
  id: string;
  title: string;
  category: string;
}

export default function ListAccount() {
  const router = useRouter();

  // Form states
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [accountLevel, setAccountLevel] = useState('');
  const [rank, setRank] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // UI status states
  const [fetchingGames, setFetchingGames] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setFetchingGames(true);
    const { data, error } = await supabase
      .from('games')
      .select('id, title, category')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching games:', error);
    } else if (data) {
      setGames(data);
      if (data.length > 0) {
        setSelectedGameId(data[0].id);
      }
    }
    setFetchingGames(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim() || !selectedGameId || !price) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Please enter a valid price.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { data, error } = await supabase.from('market_listings').insert([
        {
          game_id: selectedGameId,
          seller_id: userId,
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          account_level: accountLevel ? parseInt(accountLevel, 10) : null,
          rank: rank.trim() || null,
          image_url: imageUrl.trim() || null,
          status: 'active',
        },
      ]);

      if (error) throw error;

      setSuccessMessage('Account listed successfully! Redirecting to markets...');
      setTimeout(() => {
        router.push('/markets');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh', paddingBottom: 80 }}>
      <Head>
        <title>List Account for Sale | ApexDuel</title>
      </Head>

      {/* Hero / Header Section */}
      <section
        style={{
          padding: '48px 24px 24px',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <Link
          href="/markets"
          style={{
            color: 'var(--muted)',
            fontSize: 13,
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 16,
          }}
        >
          &larr; Back to Markets
        </Link>
        <span
          className="mono"
          style={{
            fontSize: 12,
            color: 'var(--red)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'block',
          }}
        >
          Marketplace
        </span>
        <h1
          className="display"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 8, textTransform: 'uppercase' }}
        >
          List Your Account
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Put your gaming account up for sale on the ApexDuel marketplace.
        </p>
      </section>

      {/* Main Form Section */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#131627',
            border: '1px solid var(--panel-border)',
            borderRadius: 8,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {errorMessage && (
            <div
              style={{
                background: 'rgba(255, 59, 92, 0.15)',
                border: '1px solid var(--red)',
                color: '#ff3b5c',
                padding: '12px 16px',
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: 'rgba(41, 231, 205, 0.15)',
                border: '1px solid var(--gold)',
                color: '#29e7cd',
                padding: '12px 16px',
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Select Game */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
                color: 'var(--muted)',
              }}
            >
              Select Game *
            </label>
            {fetchingGames ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading games...</div>
            ) : (
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#0a0b14',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '12px 14px',
                  borderRadius: 4,
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Listing Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
                color: 'var(--muted)',
              }}
            >
              Listing Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Stacked Apex Legends Account - Predator S12 + Heirloom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#0a0b14',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                padding: '12px 14px',
                borderRadius: 4,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Price & Level Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  color: 'var(--muted)',
                }}
              >
                Asking Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="150.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#0a0b14',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '12px 14px',
                  borderRadius: 4,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  color: 'var(--muted)',
                }}
              >
                Account Level (Optional)
              </label>
              <input
                type="number"
                placeholder="500"
                value={accountLevel}
                onChange={(e) => setAccountLevel(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0a0b14',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '12px 14px',
                  borderRadius: 4,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  color: 'var(--muted)',
                }}
              >
                Current Rank / Tier (Optional)
              </label>
              <input
                type="text"
                placeholder="Diamond II / Immortal"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0a0b14',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '12px 14px',
                  borderRadius: 4,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Banner / Preview Image URL */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
                color: 'var(--muted)',
              }}
            >
              Account Image / Screenshot URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/screenshot.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{
                width: '100%',
                background: '#0a0b14',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                padding: '12px 14px',
                borderRadius: 4,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
                color: 'var(--muted)',
              }}
            >
              Account Details & Inventory Description
            </label>
            <textarea
              rows={5}
              placeholder="Describe skins, cosmetics, unlockables, badges, or special items included with this account..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                background: '#0a0b14',
                border: '1px solid var(--panel-border)',
                color: '#fff',
                padding: '12px 14px',
                borderRadius: 4,
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit CTA */}
          <div style={{ marginTop: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? '#555' : 'var(--red)',
                color: '#fff',
                padding: '14px',
                fontWeight: 800,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                border: 'none',
                borderRadius: 2,
                transform: 'skewX(-6deg)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
              }}
            >
              <span style={{ display: 'inline-block', transform: 'skewX(6deg)' }}>
                {submitting ? 'Creating Listing...' : 'Publish Listing'}
              </span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}