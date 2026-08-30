import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface EventShareInviteProps {
  kind: 'tournament' | 'league' | 'duel' | 'challenge';
  entityId: string;
  shareCode: string;
  isCreator: boolean;
  joinMode: 'open' | 'approval';
  onInvited?: () => void;
}

const PATH_FOR_KIND: Record<EventShareInviteProps['kind'], string> = {
  tournament: '/tournaments',
  league: '/leagues',
  duel: '/duel',
  challenge: '/challenges',
};

export default function EventShareInvite({ kind, entityId, shareCode, isCreator, joinMode, onInvited }: EventShareInviteProps) {
  const [copiedWhat, setCopiedWhat] = useState<'code' | 'link' | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}${PATH_FOR_KIND[kind]}/${entityId}` : '';

  const copy = (text: string, what: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopiedWhat(what);
    setTimeout(() => setCopiedWhat(null), 1500);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    const { error } = await supabase.rpc('invite_to_event', {
      p_kind: kind,
      p_entity_id: entityId,
      p_identifier: identifier.trim(),
    });
    setInviting(false);
    if (error) {
      setInviteMessage({ type: 'error', text: error.message });
      return;
    }
    setInviteMessage({ type: 'success', text: `Invited! They can now join freely — even if approval is normally required.` });
    setIdentifier('');
    onInvited?.();
  };

  return (
    <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Share</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: isCreator ? 14 : 0 }}>
        <button onClick={() => copy(shareCode, 'code')} style={shareBtnStyle}>
          {copiedWhat === 'code' ? '✅ Copied!' : `📋 Copy Code: ${shareCode}`}
        </button>
        <button onClick={() => copy(shareLink, 'link')} style={shareBtnStyle}>
          {copiedWhat === 'link' ? '✅ Copied!' : '🔗 Copy Link'}
        </button>
      </div>

      {isCreator && (
        <>
          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Invite by username or email
            </p>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or email"
                style={{ flex: 1, padding: '10px 12px', background: '#0a0b14', border: '1px solid var(--panel-border)', color: '#fff', borderRadius: 4, fontSize: 13 }}
              />
              <button type="submit" disabled={inviting} style={{ ...shareBtnStyle, background: 'var(--red)', color: '#fff', border: 'none' }}>
                {inviting ? 'Inviting…' : 'Invite'}
              </button>
            </form>
            {joinMode === 'approval' && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                Invited players skip approval — they can join the moment they click Join.
              </p>
            )}
            {inviteMessage && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 12,
                  background: inviteMessage.type === 'success' ? 'rgba(0,255,100,0.1)' : 'rgba(255,0,0,0.1)',
                  color: inviteMessage.type === 'success' ? '#00ff64' : '#ff4444',
                  border: `1px solid ${inviteMessage.type === 'success' ? '#00ff64' : '#ff4444'}`,
                }}
              >
                {inviteMessage.text}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const shareBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--panel-border)',
  color: '#fff',
  borderRadius: 4,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};
