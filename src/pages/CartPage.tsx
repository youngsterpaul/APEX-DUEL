import { useEffect, useCallback, useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import CartHeader from '@/components/cart/CartHeader';
import SelectableCartItem from '@/components/cart/SelectableCartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import CartSkeleton from '@/components/cart/CartSkeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, ShoppingBag, ShoppingCart, Shield, Truck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShippingSettings } from '@/hooks/useShippingSettings';
import { useCartRelatedProducts } from '@/hooks/useCartRelatedProducts';
import OptimizedImage from '@/components/OptimizedImage';

const CartPage = () => {
  const { cartItems, loading, isCartEmpty, refetch } = useCartContext();
  const { 
    selectedItems, 
    isAllSelected, 
    toggleSelectAll,
    calculations 
  } = useSelectiveCart();
  
  const isMobile = isMobileUserAgent();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const { freeShippingThreshold } = useShippingSettings();
  const isEligibleForFreeDelivery = calculations.subtotal >= (freeShippingThreshold || 0);
  const amountToFreeShipping = Math.max(0, (freeShippingThreshold || 0) - calculations.subtotal);
  const progressPct = Math.min(100, Math.round((calculations.subtotal / Math.max(freeShippingThreshold || 1, 1)) * 100));

  const cartProductIds = cartItems.map((i: any) => i.product_id || i.product?.id).filter(Boolean);
  const { data: relatedProducts = [], isLoading: relatedLoading } = useCartRelatedProducts(cartProductIds, 12);

  const buildProductSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleOpenProduct = (p: any) => {
    const slug = buildProductSlug(p.name || 'product');
    navigate(`/product/${slug}/${p.product_id}`);
  };

  useEffect(() => {
    if (cartItems.length === 0) {
      refetch();
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    toggleSelectAll();
  }, [toggleSelectAll]);

  const handleCheckout = async () => {
    try {
      setIsNavigating(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/checkout');
    } catch (err) {
      console.error('Checkout navigation error:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  if (loading) return <CartSkeleton />;
  if (isCartEmpty) return <div className={`${isMobile ? '' : 'min-w-max'}`}><EmptyCart /></div>;

  // ============ MOBILE REDESIGN ============
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-44">
        {/* Select-all row */}
        {cartItems.length > 1 && (
          <div className="px-3 pt-3">
            <div className="bg-card rounded-xl border border-border/60 px-3 py-2 flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-foreground"
              >
                {isAllSelected ? 'Deselect all' : 'Select all'}{' '}
                <span className="text-muted-foreground">({selectedItems.length}/{cartItems.length})</span>
              </button>
              <span className="text-xs text-muted-foreground">{selectedItems.length} selected</span>
            </div>
          </div>
        )}

        {/* Cart items */}
        <div className="px-3 pt-3 space-y-3">
          {cartItems.map((item) => (
            <SelectableCartItem key={item.id} item={item} />
          ))}
        </div>

        {/* You might also like — real related products */}
        {(relatedLoading || relatedProducts.length > 0) && (
          <div className="px-3 pt-6">
            <h2 className="text-[17px] font-extrabold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              You might also like
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 snap-x snap-mandatory scrollbar-hide">
              {relatedLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="snap-start flex-shrink-0 w-[150px] bg-card rounded-2xl border border-border/60 p-2 animate-pulse"
                    >
                      <div className="w-full aspect-square bg-muted rounded-xl mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))
                : relatedProducts.map((p: any) => {
                    const img =
                      (Array.isArray(p.image_urls) && p.image_urls[0]) ||
                      '/placeholder.svg';
                    const displayPrice = p.discount_price ?? p.price;
                    return (
                      <button
                        key={p.product_id}
                        onClick={() => handleOpenProduct(p)}
                        className="snap-start flex-shrink-0 w-[150px] bg-card rounded-2xl border border-border/60 p-2 text-left shadow-sm active:scale-[0.97] transition-transform"
                      >
                        <div className="w-full aspect-square bg-muted rounded-xl overflow-hidden mb-2">
                          <OptimizedImage
                            src={img}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[12.5px] font-semibold text-foreground line-clamp-2 min-h-[34px] leading-snug">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <p className="text-[13px] font-bold text-foreground">
                            KES {Number(displayPrice).toLocaleString()}
                          </p>
                          {p.discount_price && p.discount_price < p.price && (
                            <p className="text-[11px] text-muted-foreground line-through">
                              {Number(p.price).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
            </div>
          </div>
        )}

        {/* Order summary card */}
        <div className="px-3 pt-5">
          <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-muted-foreground">
                  Subtotal ({calculations.selectedItemsCount} item{calculations.selectedItemsCount !== 1 ? 's' : ''})
                </span>
                <span className="text-[15px] font-bold text-foreground">
                  KES {calculations.subtotal.toLocaleString()}
                </span>
              </div>
              {calculations.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-muted-foreground">Total savings</span>
                  <span className="text-[15px] font-bold text-primary">
                    −KES {calculations.discount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-muted-foreground">Delivery</span>
                <span className="text-[13px] font-medium text-muted-foreground italic">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <div className="mt-4 bg-primary/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-base font-extrabold text-foreground">Estimated Total</span>
              <span className="text-xl font-extrabold text-primary">
                KES {Math.max(0, calculations.subtotal - calculations.discount).toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Fixed bottom checkout - sits above MobileNav */}
        <div
          className="fixed left-0 right-0 bg-card border-t border-border z-[60] px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
          style={{ bottom: `calc(64px + env(safe-area-inset-bottom))` }}
        >
          <Button
            onClick={handleCheckout}
            disabled={isNavigating || calculations.selectedItemsCount === 0}
            className="w-full h-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold shadow-md"
          >
            {isNavigating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2 ">
                <ShoppingCart className="h-5 w-5" />
                Proceed to Checkout · KES {Math.max(0, calculations.subtotal - calculations.discount).toLocaleString()}
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ============ DESKTOP (unchanged) ============
  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <div className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-0 pt-0 pb-40'}`}>
        
        {/* Page Header - Desktop */}
        {!isMobile && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
                <p className="text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  {selectedItems.length > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      • {selectedItems.length} selected
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex ${isMobile ? 'flex-col' : 'gap-6'}`}>
          {/* Cart Items */}
          <div className={`${!isMobile ? 'flex-1' : ''}`}>
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
              <CartHeader
                totalItems={cartItems.length}
                selectedCount={selectedItems.length}
                onSelectAll={handleSelectAll}
                allSelected={isAllSelected}
              />
              
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <SelectableCartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Trust Badges - Desktop */}
            {!isMobile && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">SSL Encrypted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Fast Delivery</p>
                    <p className="text-xs text-muted-foreground">Nationwide shipping</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Easy Returns</p>
                    <p className="text-xs text-muted-foreground">7-day return policy</p>
                  </div>
                </div>
              </div>
            )}

            {/* You might also like — desktop */}
            {!isMobile && (relatedLoading || relatedProducts.length > 0) && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    You might also like
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-card rounded-xl border border-border/60 p-3 animate-pulse"
                        >
                          <div className="w-full aspect-square bg-muted rounded-lg mb-3" />
                          <div className="h-3.5 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3.5 bg-muted rounded w-1/2" />
                        </div>
                      ))
                    : relatedProducts.slice(0, 8).map((p: any) => {
                        const img =
                          (Array.isArray(p.image_urls) && p.image_urls[0]) ||
                          '/placeholder.svg';
                        const displayPrice = p.discount_price ?? p.price;
                        return (
                          <button
                            key={p.product_id}
                            onClick={() => handleOpenProduct(p)}
                            className="group bg-card rounded-xl border border-border/60 p-3 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                          >
                            <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden mb-3">
                              <OptimizedImage
                                src={img}
                                alt={p.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <p className="text-sm font-semibold text-foreground line-clamp-2 min-h-[40px] leading-snug">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-base font-bold text-foreground">
                                KES {Number(displayPrice).toLocaleString()}
                              </p>
                              {p.discount_price && p.discount_price < p.price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {Number(p.price).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                </div>
              </div>
            )}
          </div>

          {/* Cart Summary - Desktop */}
          {!isMobile && (
            <div className="w-[380px] flex-shrink-0">
              <div className="sticky top-4">
                <CartSummary />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;