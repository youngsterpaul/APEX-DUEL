import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ShareInviteProps {
  kind: 'duel' | 'league' | 'tournament';
  entityId: string;
  shareCode: string;
}

const PATH_BY_KIND: Record<ShareInviteProps['kind'], string> = {
  duel: '/duel',
  league: '/leagues',
  tournament: '/tournaments',
};

export default function ShareInvite({ kind, entityId, shareCode }: ShareInviteProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitee, setInvitee] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}${PATH_BY_KIND[kind]}/${entityId}` : '';

  const copyCode = async () => {
    await navigator.clipboard.writeText(shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitee.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    const { error } = await supabase.rpc('invite_to_event', {
      p_kind: kind,
      p_entity_id: entityId,
      p_identifier: invitee.trim(),
    });
    setInviting(false);
    if (error) {
      setInviteMessage({ type: 'error', text: error.message });
      return;
    }
    setInviteMessage({ type: 'success', text: `Invited ${invitee.trim()} — they can join instantly, no approval needed.` });
    setInvitee('');
  };

  return (
    <div style={{ background: '#131627', border: '1px solid var(--panel-border)', borderRadius: 8, padding: 20, textAlign: 'left' }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        Share this challenge
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <button onClick={copyCode} style={shareBtnStyle}>
          {copiedCode ? '✓ Copied' : `Copy Code: ${shareCode}`}
        </button>
        <button onClick={copyLink} style={shareBtnStyle}>
          {copiedLink ? '✓ Copied' : 'Copy Link'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        Anyone with the code or link can find and open this challenge.
      </p>

      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        Invite a specific player
      </p>
      <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
        <input
          value={invitee}
          onChange={(e) => setInvitee(e.target.value)}
          placeholder="Username or email"
          style={{ flex: 1, padding: '10px 12px', background: '#0a0b14', border: '1px solid var(--panel-border)', color: '#fff', borderRadius: 4, fontSize: 13 }}
        />
        <button type="submit" disabled={inviting || !invitee.trim()} style={{ ...shareBtnStyle, background: 'var(--red)', border: 'none' }}>
          {inviting ? '…' : 'Invite'}
        </button>
      </form>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
        They must already have an ApexDuel account. Invited players skip the approval step.
      </p>

      {inviteMessage && (
        <div
          style={{
            marginTop: 10,
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
  );
}

const shareBtnStyle: React.CSSProperties = {
  border: '1px solid var(--panel-border)',
  background: 'transparent',
  color: '#fff',
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 4,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
