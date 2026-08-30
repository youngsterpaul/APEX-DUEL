import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart, cartItemLabel, cartItemPrice, cartItemTypeLabel, CartItem, CartItemType } from '../lib/cartContext';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DETAIL_PATH: Record<CartItemType, (id: string) => string> = {
  listing: (id) => `/markets/listing/${id}`,
  tournament: (id) => `/tournaments/${id}`,
  league: (id) => `/leagues/${id}`,
  duel: (id) => `/duel/${id}`,
  challenge: (id) => `/challenges/${id}`,
};

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, loading, removeFromCart } = useCart();
  const router = useRouter();
  if (!isOpen) return null;

  const total = items.reduce((sum, i) => sum + cartItemPrice(i), 0);

  const goToItem = (item: CartItem) => {
    onClose();
    router.push(DETAIL_PATH[item.item_type](item.item_id));
  };

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
            items.map((item) => {
              const isListing = item.item_type === 'listing';
              const price = cartItemPrice(item);
              const free = !isListing && price <= 0;

              return (
                <div
                  key={`${item.item_type}:${item.item_id}`}
                  onClick={() => goToItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') goToItem(item);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#131627',
                    border: '1px solid var(--panel-border)',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                >
                  {isListing ? (
                    <img
                      src={item.details?.photos?.[0] || ''}
                      alt=""
                      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, background: '#0a0b14', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 6,
                        background: '#0a0b14',
                        border: '1px solid var(--panel-border)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        color: 'var(--gold)',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                      }}
                    >
                      {cartItemTypeLabel(item.item_type)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cartItemLabel(item)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase' }}>
                      {isListing ? item.details?.rating : cartItemTypeLabel(item.item_type)}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, flexShrink: 0, color: free ? '#29e7cd' : '#fff' }}>
                    {free ? 'FREE' : `$${price.toFixed(2)}`}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.item_id, item.item_type);
                    }}
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
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 900 }}>${total.toFixed(2)}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
              Each item checks out on its own — accounts, tournaments, leagues, and matches are handled separately.
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'var(--red)',
                color: '#fff',
                padding: '12px',
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'uppercase',
                borderRadius: 4,
                textDecoration: 'none',
              }}
            >
              Go to Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}