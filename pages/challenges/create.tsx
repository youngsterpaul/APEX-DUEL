import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

type ChallengeType = '1v1' | 'tournament' | 'league';
type Step = 'type' | 'details' | 'done';

interface Game {
  id: string;
  title: string;
  category: string;
}

const FOOTBALL_POINTS = { win: 3, draw: 1, loss: 0 };

export default function CreateChallenge() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('type');
  const [type, setType] = useState<ChallengeType | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Shared fields
  const [title, setTitle] = useState('');
  const [gameId, setGameId] = useState('');
  const [stakeAmount, setStakeAmount] = useState('1');

  // 1v1 fields
  const [winBy, setWinBy] = useState<'wins' | 'points'>('wins');
  const [pointsPerWin, setPointsPerWin] = useState('3');
  const [gamesToPlay, setGamesToPlay] = useState('1');

  // Tournament fields
  const [maxPlayersTournament, setMaxPlayersTournament] = useState('50');
  const [gamesPerStage, setGamesPerStage] = useState('1');
  const [creatorFundsPrize, setCreatorFundsPrize] = useState(false);
  const [totalPrize, setTotalPrize] = useState('');
  const [finalPrize, setFinalPrize] = useState('');
  const [semiPrize, setSemiPrize] = useState('');
  const [freeToJoin, setFreeToJoin] = useState(false);

  // League fields
  const [maxPlayersLeague, setMaxPlayersLeague] = useState('30');
  const [roundsPerOpponent, setRoundsPerOpponent] = useState<'1' | '2'>('1');

  useEffect(() => {
    supabase.from('games').select('id, title, category').then(({ data }) => {
      if (data) setGames(data);
    });
  }, []);

  const isFootball = games.find((g) => g.id === gameId)?.category?.toLowerCase().includes('football');

  const resetTypeFields = () => {
    setWinBy('wins');
    setPointsPerWin('3');
    setGamesToPlay('1');
    setMaxPlayersTournament('50');
    setGamesPerStage('1');
    setCreatorFundsPrize(false);
    setTotalPrize('');
    setFinalPrize('');
    setSemiPrize('');
    setFreeToJoin(false);
    setMaxPlayersLeague('30');
    setRoundsPerOpponent('1');
  };

  const chooseType = (t: ChallengeType) => {
    setType(t);
    resetTypeFields();
    setMessage(null);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: 'error', text: 'You must be signed in to create a challenge.' });
      return;
    }

    if (!gameId) {
      setMessage({ type: 'error', text: 'Please select a game.' });
      return;
    }

    const stake = parseFloat(stakeAmount);
    if (type !== 'tournament' || !creatorFundsPrize) {
      if (isNaN(stake) || stake < 1) {
        setMessage({ type: 'error', text: 'Stake must be at least $1.' });
        return;
      }
    }

    let config: Record<string, any> = {};
    let maxPlayers = 2;
    let entryFee = stake;
    let creatorFunds = false;
    let requiresApproval = false;

    if (type === '1v1') {
      config = {
        win_by: winBy,
        points_per_win: isFootball ? FOOTBALL_POINTS.win : parseInt(pointsPerWin, 10),
        points_draw: isFootball ? FOOTBALL_POINTS.draw : 0,
        points_loss: isFootball ? FOOTBALL_POINTS.loss : 0,
        games_to_play: parseInt(gamesToPlay, 10),
        is_football: !!isFootball,
        tie_rule: 'platform adds one more game until a winner is determined',
      };
      maxPlayers = 2;
    }

    if (type === 'tournament') {
      const maxP = Math.min(parseInt(maxPlayersTournament, 10) || 50, 50);
      const gps = Math.min(Math.max(parseInt(gamesPerStage, 10) || 1, 1), 2);

      if (creatorFundsPrize) {
        const total = parseFloat(totalPrize);
        const finalAmt = parseFloat(finalPrize);
        const semiAmt = parseFloat(semiPrize);
        if (isNaN(total) || total <= 0) {
          setMessage({ type: 'error', text: 'Enter the total prize amount you will stake.' });
          return;
        }
        if (isNaN(finalAmt) || isNaN(semiAmt) || finalAmt <= semiAmt) {
          setMessage({ type: 'error', text: 'Final winner prize must be larger than the semifinal prize.' });
          return;
        }
        config = {
          games_per_stage: gps,
          final_games: 1,
          bracket_method: 'random_draw_after_full',
          prize_total: total,
          prize_final: finalAmt,
          prize_semifinal: semiAmt,
          free_to_join: freeToJoin,
        };
        entryFee = freeToJoin ? 0 : stake;
        creatorFunds = true;
        requiresApproval = freeToJoin;
      } else {
        config = {
          games_per_stage: gps,
          final_games: 1,
          bracket_method: 'random_draw_after_full',
          free_to_join: false,
        };
        entryFee = stake;
      }
      maxPlayers = maxP;
    }

    if (type === 'league') {
      const maxP = Math.min(parseInt(maxPlayersLeague, 10) || 30, 30);
      config = {
        rounds_per_opponent: parseInt(roundsPerOpponent, 10),
        decision_window_hours: 12,
        auto_win_on_no_response: true,
        open_join: stake === 1,
      };
      maxPlayers = maxP;
      entryFee = stake;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('challenges')
      .insert([
        {
          title: title || `${type?.toUpperCase()} Challenge`,
          game_id: gameId,
          creator_id: session.user.id,
          entry_fee: entryFee,
          max_players: maxPlayers,
          current_players: 1,
          status: 'open',
          type,
          creator_funds_prize: creatorFunds,
          requires_approval: requiresApproval,
          config,
        },
      ])
      .select('join_code')
      .single();

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setCreatedCode(data.join_code);
    setStep('done');
  };

  return (
    <div style={{ background: '#0a0b14', color: '#fff', minHeight: '100vh' }}>
      <Head>
        <title>Create Challenge | ApexDuel</title>
      </Head>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 4vw, 38px)', textTransform: 'uppercase', marginBottom: 8 }}>
          Create a Challenge
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
          Set the rules, stake your entry, and let ApexDuel handle the rest.
        </p>

        {message && (
          <div
            style={{
              padding: 12,
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

        {/* STEP 1: choose type */}
        {step === 'type' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <TypeCard
              title="1v1 Duel"
              desc="Head-to-head. Decide by wins or points, best-of-N with sudden death on a tie."
              onClick={() => chooseType('1v1')}
            />
            <TypeCard
              title="Tournament"
              desc="Elimination bracket, up to 50 players, random draw, prize split down to the semifinal."
              onClick={() => chooseType('tournament')}
            />
            <TypeCard
              title="League"
              desc="Up to 30 players, round robin once or twice, 12-hour result window per match."
              onClick={() => chooseType('league')}
            />
          </div>
        )}

        {/* STEP 2: type-specific details */}
        {step === 'details' && type && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button type="button" onClick={() => setStep('type')} style={backLinkStyle}>
              ← Change type
            </button>

            <div>
              <label style={labelStyle}>Challenge Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Friday Night Showdown" />
            </div>

            <div>
              <label style={labelStyle}>Game</label>
              <select required value={gameId} onChange={(e) => setGameId(e.target.value)} style={inputStyle}>
                <option value="">-- Select a game --</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.title} ({g.category})</option>
                ))}
              </select>
            </div>

            {/* ---------- 1v1 ---------- */}
            {type === '1v1' && (
              <>
                <div>
                  <label style={labelStyle}>Stake per player ($, min 1)</label>
                  <input type="number" min="1" step="0.01" required value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Winner determined by</label>
                  <select value={winBy} onChange={(e) => setWinBy(e.target.value as 'wins' | 'points')} style={inputStyle}>
                    <option value="wins">Number of wins</option>
                    <option value="points">Points</option>
                  </select>
                </div>

                {winBy === 'points' && (
                  isFootball ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                      Football scoring is fixed: Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
                    </p>
                  ) : (
                    <div>
                      <label style={labelStyle}>Points per game win</label>
                      <input type="number" min="1" required value={pointsPerWin} onChange={(e) => setPointsPerWin(e.target.value)} style={inputStyle} />
                    </div>
                  )
                )}

                <div>
                  <label style={labelStyle}>Number of games to play</label>
                  <input type="number" min="1" required value={gamesToPlay} onChange={(e) => setGamesToPlay(e.target.value)} style={inputStyle} />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                    If scores/wins are tied after this many games, one more game is automatically added until there's a winner.
                  </p>
                </div>
              </>
            )}

            {/* ---------- TOURNAMENT ---------- */}
            {type === 'tournament' && (
              <>
                <div>
                  <label style={labelStyle}>Max players (up to 50)</label>
                  <input type="number" min="2" max="50" required value={maxPlayersTournament} onChange={(e) => setMaxPlayersTournament(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Games per stage before the final (max 2)</label>
                  <select value={gamesPerStage} onChange={(e) => setGamesPerStage(e.target.value)} style={inputStyle}>
                    <option value="1">1 game</option>
                    <option value="2">2 games</option>
                  </select>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>The final is always a single game.</p>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
                  <input type="checkbox" checked={creatorFundsPrize} onChange={(e) => setCreatorFundsPrize(e.target.checked)} />
                  I will fund the entire prize pool myself
                </label>

                {!creatorFundsPrize ? (
                  <div>
                    <label style={labelStyle}>Stake per player to join ($, min 1)</label>
                    <input type="number" min="1" step="0.01" required value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} style={inputStyle} />
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={labelStyle}>Total prize you'll stake ($)</label>
                      <input type="number" min="1" step="0.01" required value={totalPrize} onChange={(e) => setTotalPrize(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Final winner prize ($)</label>
                      <input type="number" min="1" step="0.01" required value={finalPrize} onChange={(e) => setFinalPrize(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Semifinal winner prize ($, must be less than final)</label>
                      <input type="number" min="0" step="0.01" required value={semiPrize} onChange={(e) => setSemiPrize(e.target.value)} style={inputStyle} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
                      <input type="checkbox" checked={freeToJoin} onChange={(e) => setFreeToJoin(e.target.checked)} />
                      Let players join for free (requests must be approved by you)
                    </label>
                  </>
                )}

                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Matches are assigned by random draw once the bracket is full. Results are marked win / loss / draw by each player.
                </p>
              </>
            )}

            {/* ---------- LEAGUE ---------- */}
            {type === 'league' && (
              <>
                <div>
                  <label style={labelStyle}>Max players (up to 30)</label>
                  <input type="number" min="2" max="30" required value={maxPlayersLeague} onChange={(e) => setMaxPlayersLeague(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Stake per player ($, min 1)</label>
                  <input type="number" min="1" step="0.01" required value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} style={inputStyle} />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                    Setting this to exactly $1 opens the league to anyone. Higher stakes make it invite-only via your share code.
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Each player faces every other player</label>
                  <select value={roundsPerOpponent} onChange={(e) => setRoundsPerOpponent(e.target.value as '1' | '2')} style={inputStyle}>
                    <option value="1">Once</option>
                    <option value="2">Twice</option>
                  </select>
                </div>

                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  After each match, players have 12 hours to mark win / loss / draw. If only one side marks a result in time, that result is applied automatically.
                </p>
              </>
            )}

            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </form>
        )}

        {/* STEP 3: done — show share code */}
        {step === 'done' && createdCode && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h2 className="display" style={{ fontSize: 24, marginBottom: 12 }}>Challenge Created!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
              Share this code so others can join:
            </p>
            <div
              className="mono"
              style={{
                display: 'inline-block',
                background: '#131627',
                border: '1px solid var(--panel-border)',
                padding: '16px 32px',
                fontSize: 28,
                letterSpacing: '0.3em',
                borderRadius: 6,
                color: 'var(--gold)',
                marginBottom: 24,
              }}
            >
              {createdCode}
            </div>
            <div>
              <button onClick={() => router.push('/challenges')} style={primaryButtonStyle}>
                Go to Challenges
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TypeCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: '#131627',
        border: '1px solid var(--panel-border)',
        borderRadius: 8,
        padding: 20,
        cursor: 'pointer',
        color: '#fff',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 18, textTransform: 'uppercase' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</p>
    </button>
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

const backLinkStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'left',
  padding: 0,
};