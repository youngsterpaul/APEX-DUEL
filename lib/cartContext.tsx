import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

const GUEST_CART_KEY = 'apexduel_guest_cart';

export type CartItemType = 'listing' | 'tournament' | 'league' | 'challenge' | 'duel';

const TABLE_FOR_TYPE: Record<CartItemType, string> = {
  listing: 'account_listings',
  tournament: 'tournaments',
  league: 'leagues',
  challenge: 'challenges',
  duel: 'duels',
};

export interface CartDetails {
  id: string;
  [key: string]: any;
}

export interface CartItem {
  item_id: string;
  item_type: CartItemType;
  details?: CartDetails;
  // Back-compat alias — older code reads `listing_id` / `listing` for marketplace items.
  listing_id: string;
  listing?: CartDetails;
}

interface GuestEntry {
  item_id: string;
  item_type: CartItemType;
}

interface CartContextValue {
  items: CartItem[];
  itemIds: string[];
  count: number;
  loading: boolean;
  isInCart: (itemId: string, itemType?: CartItemType) => boolean;
  addToCart: (itemId: string, itemType?: CartItemType) => Promise<{ error?: string }>;
  removeFromCart: (itemId: string, itemType?: CartItemType) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/** Human-readable title for a cart line item, regardless of type. */
export function cartItemLabel(item: CartItem): string {
  const d = item.details;
  if (!d) return 'Item';
  switch (item.item_type) {
    case 'listing':
      return d.in_game_username || 'Account listing';
    case 'tournament':
      return d.name || 'Tournament';
    case 'league':
      return d.name || 'League';
    case 'challenge':
      return d.title || `${(d.type || '1v1').toUpperCase()} Challenge`;
    case 'duel':
      return `${d.game || '1v1'} Match`;
    default:
      return 'Item';
  }
}

/** Price to charge for a cart line item — sale price for listings, entry fee for everything else. */
export function cartItemPrice(item: CartItem): number {
  const d = item.details;
  if (!d) return 0;
  if (item.item_type === 'listing') return d.price ?? 0;
  return d.entry_fee ?? 0;
}

/** Short category label shown as a badge on cart rows. */
export function cartItemTypeLabel(itemType: CartItemType): string {
  switch (itemType) {
    case 'listing':
      return 'Account';
    case 'tournament':
      return 'Tournament';
    case 'league':
      return 'League';
    case 'challenge':
      return 'Challenge';
    case 'duel':
      return '1v1';
    default:
      return 'Item';
  }
}

function readGuestCart(): GuestEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Back-compat: earlier versions stored a flat array of listing id strings.
    return parsed.map((entry: any) =>
      typeof entry === 'string' ? { item_id: entry, item_type: 'listing' as CartItemType } : entry
    );
  } catch {
    return [];
  }
}

function writeGuestCart(entries: GuestEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchDetailsForEntries = async (entries: GuestEntry[]): Promise<CartItem[]> => {
    if (entries.length === 0) return [];

    const idsByType = new Map<CartItemType, string[]>();
    entries.forEach((e) => {
      const list = idsByType.get(e.item_type) || [];
      list.push(e.item_id);
      idsByType.set(e.item_type, list);
    });

    const detailsMap = new Map<string, CartDetails>();
    await Promise.all(
      Array.from(idsByType.entries()).map(async ([itemType, ids]) => {
        const { data } = await supabase.from(TABLE_FOR_TYPE[itemType]).select('*').in('id', ids);
        (data || []).forEach((row: any) => detailsMap.set(`${itemType}:${row.id}`, row));
      })
    );

    return entries.map((e) => {
      const details = detailsMap.get(`${e.item_type}:${e.item_id}`);
      return {
        item_id: e.item_id,
        item_type: e.item_type,
        details,
        listing_id: e.item_id,
        listing: e.item_type === 'listing' ? details : undefined,
      };
    });
  };

  const loadCart = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUserId(null);
      const guestEntries = readGuestCart();
      const loadedItems = await fetchDetailsForEntries(guestEntries);
      setItems(loadedItems);
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
    const { data } = await supabase
      .from('cart_items')
      .select('item_id, item_type')
      .eq('buyer_id', session.user.id);

    if (data) {
      const entries: GuestEntry[] = data.map((row: any) => ({
        item_id: row.item_id,
        item_type: (row.item_type || 'listing') as CartItemType,
      }));
      const loadedItems = await fetchDetailsForEntries(entries);
      setItems(loadedItems);
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  const mergeGuestCartOnSignIn = async (newUserId: string) => {
    const guestEntries = readGuestCart();
    if (guestEntries.length === 0) return;

    const rows = guestEntries.map((e) => ({
      buyer_id: newUserId,
      item_id: e.item_id,
      item_type: e.item_type,
    }));
    await supabase.from('cart_items').upsert(rows, { onConflict: 'buyer_id,item_id,item_type' });
    writeGuestCart([]);
  };

  useEffect(() => {
    loadCart();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await mergeGuestCartOnSignIn(session.user.id);
        await loadCart();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        const guestEntries = readGuestCart();
        const loadedItems = await fetchDetailsForEntries(guestEntries);
        setItems(loadedItems);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const itemIds = items.map((i) => i.item_id);

  const isInCart = (itemId: string, itemType: CartItemType = 'listing') =>
    items.some((i) => i.item_id === itemId && i.item_type === itemType);

  const addToCart = async (itemId: string, itemType: CartItemType = 'listing'): Promise<{ error?: string }> => {
    if (isInCart(itemId, itemType)) return {};

    if (!userId) {
      const nextEntries = [...readGuestCart(), { item_id: itemId, item_type: itemType }];
      writeGuestCart(nextEntries);
      const loadedItems = await fetchDetailsForEntries(nextEntries);
      setItems(loadedItems);
      return {};
    }

    const { error } = await supabase
      .from('cart_items')
      .insert([{ buyer_id: userId, item_id: itemId, item_type: itemType }]);

    if (error && error.code !== '23505') {
      return { error: error.message };
    }

    await loadCart();
    return {};
  };

  const removeFromCart = async (itemId: string, itemType: CartItemType = 'listing') => {
    if (!userId) {
      const nextEntries = readGuestCart().filter((e) => !(e.item_id === itemId && e.item_type === itemType));
      writeGuestCart(nextEntries);
      setItems((prev) => prev.filter((i) => !(i.item_id === itemId && i.item_type === itemType)));
      return;
    }

    await supabase
      .from('cart_items')
      .delete()
      .eq('buyer_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType);
    setItems((prev) => prev.filter((i) => !(i.item_id === itemId && i.item_type === itemType)));
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