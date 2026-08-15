import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

const GUEST_CART_KEY = 'apexduel_guest_cart';

interface CartContextValue {
  itemIds: string[];
  count: number;
  loading: boolean;
  isInCart: (listingId: string) => boolean;
  addToCart: (listingId: string) => Promise<void>;
  removeFromCart: (listingId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readGuestCart(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(ids));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadCart = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setUserId(null);
      setItemIds(readGuestCart());
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
    const { data } = await supabase.from('cart_items').select('listing_id').eq('buyer_id', session.user.id);
    setItemIds((data || []).map((row) => row.listing_id));
    setLoading(false);
  };

  // Merge any guest-cart items into the real Supabase cart the moment someone signs in.
  const mergeGuestCartOnSignIn = async (newUserId: string) => {
    const guestIds = readGuestCart();
    if (guestIds.length === 0) return;

    const rows = guestIds.map((listing_id) => ({ buyer_id: newUserId, listing_id }));
    await supabase.from('cart_items').upsert(rows, { onConflict: 'buyer_id,listing_id' });
    writeGuestCart([]);
  };

  useEffect(() => {
    loadCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await mergeGuestCartOnSignIn(session.user.id);
        await loadCart();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setItemIds(readGuestCart());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isInCart = (listingId: string) => itemIds.includes(listingId);

  const addToCart = async (listingId: string) => {
    if (isInCart(listingId)) return;

    if (!userId) {
      const next = [...readGuestCart(), listingId];
      writeGuestCart(next);
      setItemIds(next);
      return;
    }

    const { error } = await supabase.from('cart_items').insert([{ buyer_id: userId, listing_id: listingId }]);
    if (!error || error.code === '23505') {
      setItemIds((prev) => (prev.includes(listingId) ? prev : [...prev, listingId]));
    }
  };

  const removeFromCart = async (listingId: string) => {
    if (!userId) {
      const next = readGuestCart().filter((id) => id !== listingId);
      writeGuestCart(next);
      setItemIds(next);
      return;
    }

    await supabase.from('cart_items').delete().eq('buyer_id', userId).eq('listing_id', listingId);
    setItemIds((prev) => prev.filter((id) => id !== listingId));
  };

  return (
    <CartContext.Provider
      value={{ itemIds, count: itemIds.length, loading, isInCart, addToCart, removeFromCart, refresh: loadCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}