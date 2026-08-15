import { useCart } from '../lib/cartContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, loading, removeFromCart } = useCart();
  if (!isOpen) return null;

  const total = items.reduce((sum, i) => sum + (i.listing?.price || 0), 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,11,20,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: '90vw',
          height: '100%',
          background: '#0f1120',
          borderLeft: '1px solid var(--panel-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>
            Your Cart
          </span>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.listing_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#131627',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <img
                  src={item.listing?.photos?.[0] || ''}
                  alt=""
                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, background: '#0a0b14', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.listing?.in_game_username}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase' }}>{item.listing?.rating}</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                  ${(item.listing?.price ?? 0).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item.listing_id)}
                  aria-label="Remove from cart"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--panel-border)',
                    color: '#ff4444',
                    borderRadius: 4,
                    width: 26,
                    height: 26,
                    fontSize: 13,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 900 }}>${total.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}