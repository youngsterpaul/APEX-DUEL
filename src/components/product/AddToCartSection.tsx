import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Check, Zap, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

interface AddToCartSectionProps {
  product: {
    product_id: string;
    name: string;
    price: number;
    stock?: number;
    image?: string;
  };
  selectedVariants: Record<string, string>;
  requiredVariants: string[];
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

const AddToCartSection = ({
  product,
  selectedVariants,
  requiredVariants,
  quantity,
  onQuantityChange,
  className = ''
}: AddToCartSectionProps) => {
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const inStock = (product.stock || 0) > 0;
  const isInWishlistState = isInWishlist(product.product_id);

  const validateVariantSelection = () => {
    const missingVariants = requiredVariants.filter(v => !selectedVariants[v]);
    if (missingVariants.length > 0) {
      toast({
        title: "Please select all options",
        description: `Please choose: ${missingVariants.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!inStock) return toast({ title: "Out of Stock", description: "This item is currently out of stock", variant: "destructive" });
    if (!validateVariantSelection()) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product.product_id, selectedVariants, quantity);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast({ title: "Added to cart!", description: `${product.name.split('(')[0].trim()} added to your cart` });
    } catch {
      toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!inStock) return toast({ title: "Out of Stock", description: "This item is currently out of stock", variant: "destructive" });
    if (!validateVariantSelection()) return;
    setIsBuyingNow(true);
    try {
      const buyNowItem = {
        id: `buynow-${product.product_id}-${Date.now()}`,
        product: {
          id: product.product_id,
          name: product.name,
          price: product.price,
          image: product.image || '/placeholder.svg',
        },
        variant_selections: selectedVariants,
        quantity,
      };
      navigate('/checkout', { state: { buyNowItem } });
    } catch {
      toast({ title: "Error", description: "Failed to proceed to checkout", variant: "destructive" });
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    try {
      if (isInWishlistState) {
        await removeFromWishlist(product.product_id);
        toast({ title: "Removed from wishlist" });
      } else {
        await addToWishlist(product.product_id);
        toast({ title: "Added to wishlist" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update wishlist", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Product link copied to clipboard" });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <Badge variant={inStock ? "default" : "destructive"}>
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>
        {product.stock && product.stock <= 10 && inStock && (
          <Badge variant="outline" className="text-amber-600 border-amber-200">
            Only {product.stock} left
          </Badge>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Quantity</p>
        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-gray-900 border-x border-gray-200 tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            disabled={product.stock ? quantity >= product.stock : false}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className={`
            flex-1 h-11 px-5 rounded-lg text-sm font-medium
            flex items-center justify-center gap-2
            border transition-colors duration-150 active:scale-[0.99] select-none
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
            ${showSuccess
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          {showSuccess ? (
            <><Check size={15} strokeWidth={2.5} /> Added</>
          ) : isAddingToCart ? (
            <><span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" /> Adding...</>
          ) : (
            <><ShoppingCart size={15} strokeWidth={2} /> Add to Cart</>
          )}
        </button>

        {/* Buy Now */}
        <button
          onClick={handleBuyNow}
          disabled={!inStock || isBuyingNow}
          className="
            flex-1 h-11 px-5 rounded-lg text-sm font-medium
            flex items-center justify-center gap-2
            bg-gray-900 text-white
            hover:bg-gray-800 transition-colors duration-150
            active:scale-[0.99] select-none
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
          "
        >
          {isBuyingNow ? (
            <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Processing...</>
          ) : (
            <><Zap size={15} strokeWidth={2} /> Buy Now</>
          )}
        </button>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`
            h-11 w-11 rounded-lg flex items-center justify-center shrink-0
            border transition-colors duration-150 active:scale-[0.99] select-none
            ${isInWishlistState
              ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-red-400'
            }
          `}
        >
          <Heart size={17} strokeWidth={2} className={isInWishlistState ? 'fill-current' : ''} />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="
            h-11 w-11 rounded-lg flex items-center justify-center shrink-0
            bg-white border border-gray-200 text-gray-400
            hover:border-gray-300 hover:text-gray-600
            transition-colors duration-150 active:scale-[0.99] select-none
          "
        >
          <Share2 size={17} strokeWidth={2} />
        </button>

      </div>
    </div>
  );
};

export default AddToCartSection;