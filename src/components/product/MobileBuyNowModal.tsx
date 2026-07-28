import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X, Star, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useProductReviews } from '@/hooks/useReviews';
import OptimizedImage from '../OptimizedImage';
import VariantSelector from '@/components/product/VariantSelector';

interface MobileBuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    product_id: string;
    image: string | string[];
    name: string;
    price: number;
    originalPrice?: number;
    description?: string;
    rating: number;
    reviews?: number;
    inStock: boolean;
    category: string;
    subcategory?: string;
    attributes?: Record<string, any>;
    features?: string[];
  };
  selectedVariants: Record<string, string>;
  requiredVariants: string[];
  onVariantChange: (type: string, value: string) => void;
  calculatePrice: () => number;
}

const MobileBuyNowModal = ({
  isOpen,
  onClose,
  product,
  selectedVariants,
  requiredVariants,
  onVariantChange,
  calculatePrice,
}: MobileBuyNowModalProps) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);

  const hasVariants = getVariantTypes().length > 0;
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 5;
  const displayReviewCount = totalReviews > 0 ? totalReviews : product.reviews || 0;

  // Get color variants for image cycling
  const colorVariants = variants.filter(v => 
    v.variant_type.toLowerCase().includes('color') || 
    v.variant_type.toLowerCase().includes('colour')
  );
  const hasColorVariants = colorVariants.length > 0;

  // Get current image based on selected color variant
  const getCurrentImage = () => {
    if (hasColorVariants) {
      const colorType = getVariantTypes().find(type => 
        type.toLowerCase().includes('color') || type.toLowerCase().includes('colour')
      );
      if (colorType && selectedVariants[colorType]) {
        const selectedColorVariant = colorVariants.find(v => 
          v.variant_type === colorType && v.variant_value === selectedVariants[colorType]
        );
        if (selectedColorVariant?.image_url) {
          return selectedColorVariant.image_url;
        }
      }
    }
    return getProductImage(product.image);
  };

  const handleImageClick = () => {
    if (!hasColorVariants) return;
    
    const colorType = getVariantTypes().find(type => 
      type.toLowerCase().includes('color') || type.toLowerCase().includes('colour')
    );
    
    if (!colorType) return;

    const currentSelectedValue = selectedVariants[colorType];
    const currentIndex = colorVariants.findIndex(v => 
      v.variant_type === colorType && v.variant_value === currentSelectedValue
    );
    
    // Cycle to next color variant
    const nextIndex = (currentIndex + 1) % colorVariants.filter(v => v.variant_type === colorType).length;
    const colorVariantsOfType = colorVariants.filter(v => v.variant_type === colorType);
    const nextVariant = colorVariantsOfType[nextIndex];
    
    if (nextVariant) {
      onVariantChange(colorType, nextVariant.variant_value);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      setQuantity(1);
      document.body.style.overflow = 'hidden';
    } else {
      setShowAnimation(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getProductImage = (image: string | string[]): string => {
    if (Array.isArray(image)) {
      return image.length > 0 ? image[0] : '/placeholder.svg';
    }
    return image || '/placeholder.svg';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  const handleBuyNow = async () => {
    if (!product.inStock) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock",
        variant: "destructive"
      });
      return;
    }

    if (hasVariants) {
      const variantTypes = getVariantTypes();
      const missingVariants = variantTypes.filter((type) => !selectedVariants[type]);
      if (missingVariants.length > 0) {
        toast({
          title: 'Please choose a variant',
          description: `Please select: ${missingVariants.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsBuyingNow(true);

    try {
      const buyNowItem = {
        id: `buynow-${product.product_id}-${Date.now()}`,
        product: {
          id: product.product_id,
          name: product.name,
          price: calculatePrice(),
          image: Array.isArray(product.image) ? product.image[0] : product.image,
        },
        variant_selections: selectedVariants,
        quantity,
      };
      onClose();
      navigate('/checkout', { state: { buyNowItem } });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to proceed to checkout",
        variant: "destructive"
      });
      setIsBuyingNow(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          showAnimation ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
          showAnimation ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-background rounded-t-3xl shadow-2xl min-h-[75vh] overflow-hidden">
          {/* Drag Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Buy Now</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-160px)]">
            {/* Product Summary */}
            <div className="p-5 bg-background border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div 
                  className={`w-16 h-16 bg-background rounded-lg shadow-sm flex items-center justify-center overflow-hidden ${
                    hasColorVariants ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''
                  }`}
                  onClick={handleImageClick}
                  title={hasColorVariants ? 'Tap to cycle through colors' : ''}
                >
                  <OptimizedImage
                    src={getCurrentImage()}
                    alt={product.name}
                    width={80}
                    height={80}
                    aspectRatio="square"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs leading-tight mb-1 line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(averageRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {reviewsLoading ? <span className="animate-pulse">...</span> : `(${displayReviewCount})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-semibold text-orange-500">
                      {formatPrice(calculatePrice())}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="p-5 space-y-5">
              {hasVariants && (
                <div>
                  <h4 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                    <span>Select Options</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </h4>

                  <VariantSelector
                    variants={(() => {
                      const colorMap: Record<string, string> = {
                        red: '#ef4444',
                        blue: '#3b82f6',
                        green: '#10b981',
                        black: '#1f2937',
                        white: '#ffffff',
                        gray: '#6b7280',
                        grey: '#6b7280',
                        yellow: '#f59e0b',
                        orange: '#f97316',
                        purple: '#8b5cf6',
                        pink: '#ec4899',
                        brown: '#92400e',
                        navy: '#1e3a8a',
                        maroon: '#7f1d1d',
                        gold: '#d97706',
                        silver: '#9ca3af',
                        beige: '#f5f5dc',
                        cream: '#fffdd0',
                        turquoise: '#06b6d4',
                        lime: '#65a30d',
                      };

                      return getVariantTypes().map((type) => {
                        const lowerType = type.toLowerCase();
                        let variantType: 'color' | 'size' | 'material' | 'other' = 'other';
                        if (lowerType.includes('color') || lowerType.includes('colour')) variantType = 'color';
                        else if (lowerType.includes('size')) variantType = 'size';
                        else if (
                          lowerType.includes('material') ||
                          lowerType.includes('fabric') ||
                          lowerType.includes('texture')
                        )
                          variantType = 'material';

                        return {
                          id: type,
                          name: type.charAt(0).toUpperCase() + type.slice(1),
                          type: variantType,
                          values: getVariantsByType(type).map((variant) => {
                            const variantValue = String(variant.variant_value || '');
                          return {
                            id: variantValue,
                            name: variantValue,
                            value:
                              variantType === 'color'
                                ? colorMap[variantValue.toLowerCase()] || '#6b7280'
                                : variantValue,
                            available: variant.stock_quantity > 0,
                            priceModifier: variant.price_modifier || 0,
                            image: variant.image_url || null,
                            stockQuantity: variant.stock_quantity
                          };
                        }),
                      };
                    });
                  })()}
                  selectedVariants={selectedVariants}
                  onVariantChange={onVariantChange}
                  stockInfo={(() => {
                    const stockInfo: Record<string, number> = {};
                    getVariantTypes().forEach((type) => {
                      getVariantsByType(type).forEach((variant) => {
                        const key = `${type}-${variant.variant_value}`;
                        stockInfo[key] = variant.stock_quantity;
                      });
                    });
                    return stockInfo;
                  })()}
                  />
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <h4 className="text-xs font-medium text-gray-900 mb-2">Quantity</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                    <span className="px-4 py-2 font-medium text-gray-900 bg-gray-50 min-w-[50px] text-center text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    <span
                      className={`font-medium ${
                        product.inStock ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="border-t border-gray-100 p-5 bg-background bottom-0 fixed left-0 right-0">
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock || isBuyingNow}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 
              disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-2.5 px-4 rounded-lg 
              transition-all duration-200 flex items-center justify-center gap-1.5 text-sm shadow-md disabled:shadow-none"
            >
              {isBuyingNow ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Buy Now – {formatPrice(calculatePrice() * quantity)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBuyNowModal;