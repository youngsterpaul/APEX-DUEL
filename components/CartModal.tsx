import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { CartItem } from './types';

interface CartContextValue {
  items: CartItem[];
  count: number;
  loading: boolean;
  addToCart: (listingId: string) => Promise<{ error?: string }>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  loading: true,
  addToCart: async () => ({}),
  removeFromCart: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, listing:account_listings(*)')
      .eq('buyer_id', session.user.id)
      .order('added_at', { ascending: false });
    if (!error && data) setItems(data as any);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
  }, []);

  const addToCart = async (listingId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: 'Sign in to add items to your cart.' };
    const { error } = await supabase
      .from('cart_items')
      .insert({ buyer_id: session.user.id, listing_id: listingId });
    if (error) {
      if (error.code === '23505') return { error: 'Already in your cart.' };
      return { error: error.message };
    }
    await refresh();
    return {};
  };

  const removeFromCart = async (cartItemId: string) => {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    await refresh();
  };

  return (
    <CartContext.Provider value={{ items, count: items.length, loading, addToCart, removeFromCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}