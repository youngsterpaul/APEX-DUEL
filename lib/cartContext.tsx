import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

const GUEST_CART_KEY = 'apexduel_guest_cart';

export interface Listing {
  id: string;
  title?: string;
  price?: number;
  [key: string]: any;
}

export interface CartItem {
  listing_id: string;
  listing?: Listing;
}

interface CartContextValue {
  items: CartItem[];
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
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchListingsForIds = async (ids: string[]): Promise<CartItem[]> => {
    if (ids.length === 0) return [];
    const { data } = await supabase.from('listings').select('*').in('id', ids);
    const map = new Map((data || []).map((l) => [l.id, l]));
    return ids.map((id) => ({
      listing_id: id,
      listing: map.get(id),
    }));
  };

  const loadCart = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setUserId(null);
      const guestIds = readGuestCart();
      const loadedItems = await fetchListingsForIds(guestIds);
      setItems(loadedItems);
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
    const { data } = await supabase
      .from('cart_items')
      .select('listing_id, listing:listings(*)')
      .eq('buyer_id', session.user.id);

    if (data) {
      setItems(
        data.map((row: any) => ({
          listing_id: row.listing_id,
          listing: Array.isArray(row.listing) ? row.listing[0] : row.listing,
        }))
      );
    } else {
      setItems([]);
    }
    setLoading(false);
  };

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
        const guestIds = readGuestCart();
        const loadedItems = await fetchListingsForIds(guestIds);
        setItems(loadedItems);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const itemIds = items.map((i) => i.listing_id);

  const isInCart = (listingId: string) => itemIds.includes(listingId);

  const addToCart = async (listingId: string) => {
    if (isInCart(listingId)) return;

    if (!userId) {
      const nextIds = [...readGuestCart(), listingId];
      writeGuestCart(nextIds);
      const loadedItems = await fetchListingsForIds(nextIds);
      setItems(loadedItems);
      return;
    }

    const { error } = await supabase.from('cart_items').insert([{ buyer_id: userId, listing_id: listingId }]);
    if (!error || error.code === '23505') {
      await loadCart();
    }
  };

  const removeFromCart = async (listingId: string) => {
    if (!userId) {
      const nextIds = readGuestCart().filter((id) => id !== listingId);
      writeGuestCart(nextIds);
      setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
      return;
    }

    await supabase.from('cart_items').delete().eq('buyer_id', userId).eq('listing_id', listingId);
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemIds,
        count: items.length,
        loading,
        isInCart,
        addToCart,
        removeFromCart,
        refresh: loadCart,
      }}
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