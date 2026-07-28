import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import EnhancedProductImageGallery from '@/components/product/EnhancedProductImageGallery';
import ProductTabs from '@/components/product/ProductTabs';
import RelatedProductsCarousel from '@/components/product/RelatedProductsCarousel';
import SiteBreadcrumb from '@/components/Breadcrumb';
import VariantSelector from '@/components/product/VariantSelector';
import AddToCartSection from '@/components/product/AddToCartSection';
import ProductInfo from '@/components/product/ProductInfo';
import PriceDisplay from '@/components/product/PriceDisplay';
import ProductMetadata from '@/components/product/ProductMetadata';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useProduct } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useProductFlashSale } from '@/hooks/useFlashSales';
import { Skeleton } from '@/components/ui/skeleton';
import MobileBottomActions from '@/components/product/MobileBottomActions';
import { useShippingSettings } from '@/hooks/useShippingSettings';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { supabase } from '@/integrations/supabase/client';
import { ProductStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { useProductTracking } from '@/hooks/useUserBehaviorTracking';

// ✅ Properly typed interfaces
interface ProductVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
  image_url?: string | null;
}

interface Product {
  product_id: string;
  name: string;
  description?: string;
  categories?: string;
  features?: string[] | string;
  specification?: string | Record<string, unknown>;
  price: number;
  discount_price?: number;
  image_urls?: string[];
  stock?: number;
  rating?: number;
  reviews?: number;
  video?: string;
}

const ProductDetailsPage: React.FC = () => {
  const { productName, id } = useParams<{ productName: string; id: string }>();
  const navigate = useNavigate();
  
  // ✅ ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY RENDER
  const isMobile = isMobileUserAgent();
  const { data: product, isLoading: loading, error } = useProduct(id || '');
  const { variants } = useProductVariants(id || '');
  const { shippingFee, freeShippingThreshold } = useShippingSettings();
  const { calculations } = useSelectiveCart();
  const { data: flashSale } = useProductFlashSale(id || '');

  // Fetch category data with parent for breadcrumb link
  const { data: categoryData } = useQuery({
    queryKey: ['category-hierarchy-for-product', product?.categories],
    queryFn: async () => {
      if (!product?.categories) return null;
      
      // First get the subcategory
      const { data: subcat, error } = await supabase
        .from('categories')
        .select('id, category, slug, parent_id')
        .eq('category', product.categories)
        .maybeSingle();
      
      if (error) throw error;
      if (!subcat) return null;
      
      // If it has a parent, fetch the parent category
      if (subcat.parent_id) {
        const { data: parent } = await supabase
          .from('categories')
          .select('id, category, slug')
          .eq('id', subcat.parent_id)
          .maybeSingle();
        
        return {
          ...subcat,
          parent: parent
        };
      }
      
      return subcat;
    },
    enabled: !!product?.categories,
    staleTime: 1000 * 60 * 10,
  });

  // ✅ STATE HOOKS (always called in same order)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);


  // Track product view for personalization (AI-powered recommendations)
  useProductTracking(
    product?.product_id,
    product?.categories,
    product?.discount_price || product?.price
  );

  const amountNeededForFreeDelivery = (freeShippingThreshold || 0) - calculations.subtotal;

  // ------------------ Slug Redirect ------------------
  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  useEffect(() => {
    if (product && productName && id) {
      const correctSlug = generateSlug(product.name);
      if (productName !== correctSlug) {
        navigate(`/products/${product.categories || 'general'}/${correctSlug}/${id}`, { replace: true });
      }
    }
  }, [product, productName, id, navigate]);

  // ✅ ALL MEMOS (always called in same order)
  const transformedVariants = useMemo(() => {
    if (!variants?.length) return [];

    return variants.reduce((acc: any[], v: ProductVariant) => {
      const type = v.variant_type;
      const valueString = String(v.variant_value || '');

      const variantType: 'image' | 'size' | 'material' | 'other' =
        v.image_url
          ? 'image'
          : type.toLowerCase().includes('size')
          ? 'size'
          : type.toLowerCase().includes('material')
          ? 'material'
          : 'other';

      const existing = acc.find((x) => x.id === v.variant_type);
      
      if (existing) {
        existing.values.push({
          id: valueString,
          name: valueString,
          value: v.image_url || valueString,
          available: v.stock_quantity > 0,
          priceModifier: v.price_modifier || 0,
          image: v.image_url || undefined,
          stockQuantity: v.stock_quantity
        });
      } else {
        acc.push({
          id: v.variant_type,
          name: v.variant_type.charAt(0).toUpperCase() + v.variant_type.slice(1),
          type: variantType === 'image' ? 'color' : variantType,
          values: [{
            id: valueString,
            name: valueString,
            value: v.image_url || valueString,
            available: v.stock_quantity > 0,
            priceModifier: v.price_modifier || 0,
            image: v.image_url || undefined,
            stockQuantity: v.stock_quantity
          }]
        });
      }

      return acc;
    }, []);
  }, [variants]);

  const selectedColorImageUrl = useMemo(() => {
    const colorGroup = transformedVariants.find((v: any) => v.type === 'color');
    if (!colorGroup) return undefined;
    const selectedId = selectedVariants[colorGroup.id];
    const val = colorGroup.values.find((vv: any) => vv.id === selectedId);
    if (val?.image) return val.image as string;

    const name = (val?.name || '').toLowerCase();
    if (name && product?.image_urls?.length) {
      const match = product.image_urls.find((u: string) => u.toLowerCase().includes(name));
      return match;
    }
    return undefined;
  }, [transformedVariants, selectedVariants, product]);

  const stockInfo = useMemo(() => {
    if (!variants?.length) return {};
    
    const stockMap: Record<string, number> = {};
    
    variants.forEach((v: ProductVariant) => {
      const valueName = String(v.variant_value);
      stockMap[`${v.variant_type}-${valueName}`] = v.stock_quantity;
    });

    return stockMap;
  }, [variants]);

  const requiredVariants = useMemo(() => transformedVariants.map((v: any) => v.id), [transformedVariants]);

  const price = useMemo(() => {
    if (!product) return 0;
    let total = product.discount_price ?? product.price ?? 0;

    for (const [type, selectedValue] of Object.entries(selectedVariants)) {
      const variant = variants.find((v) => {
        return v.variant_type === type && String(v.variant_value) === selectedValue;
      });
      
      if (variant) {
        total += variant.price_modifier || 0;
      }
    }

    return total;
  }, [product, selectedVariants, variants]);

  // Calculate flash sale price
  const flashSalePrice = useMemo(() => {
    if (!flashSale || !price) return null;
    
    if (flashSale.discount_type === 'percentage') {
      return price * (1 - flashSale.discount_value / 100);
    }
    return price - flashSale.discount_value;
  }, [flashSale, price]);

  const variantImages = useMemo(() => {
    const colorGroup = transformedVariants.find((v: any) => v.type === 'color');
    if (!colorGroup) return [];
    
    return colorGroup.values
      .filter((v: any) => v.image)
      .map((v: any) => ({
        url: v.image as string,
        label: v.name || v.id
      }));
  }, [transformedVariants]);

const productForTabs = useMemo(() => {
  if (!product?.product_id || !product.name) return null;

  return {
    product_id: product.product_id,
    name: product.name,
    features: typeof product.features === 'string'
      ? [product.features]
      : Array.isArray(product.features)
        ? product.features
        : [],
    specification: typeof product.specification === 'string' && product.specification
      ? JSON.parse(product.specification)
      : product.specification || {},
    attributes: product.attributes
  };
}, [product]);


  // ✅ EFFECTS (after all hooks and memos)
  // Reset selected variants when navigating to a different product
  useEffect(() => {
    setSelectedVariants({});
  }, [product?.product_id]);

  // Auto-select first available value for each variant type
  useEffect(() => {
    if (!transformedVariants?.length) return;

    setSelectedVariants((prev) => {
      const updated: Record<string, string> = {};
      let changed = false;

      transformedVariants.forEach((variant) => {
        const current = prev[variant.id];
        const isValid = current && variant.values.some((v: any) => v.id === current);

        if (isValid) {
          updated[variant.id] = current;
        } else if (variant.values.length > 0) {
          const firstAvailable =
            variant.values.find((v: any) => v.available) || variant.values[0];
          if (firstAvailable) {
            updated[variant.id] = firstAvailable.id;
            changed = true;
          }
        }
      });

      // Drop stale keys not present in current variants
      if (Object.keys(prev).length !== Object.keys(updated).length) changed = true;
      for (const k of Object.keys(prev)) {
        if (prev[k] !== updated[k]) changed = true;
      }

      return changed ? updated : prev;
    });
  }, [transformedVariants]);

  // ✅ EVENT HANDLERS
  const handleVariantChange = (variantTypeId: string, variantValueId: string) =>
    setSelectedVariants((prev) => ({ ...prev, [variantTypeId]: variantValueId }));

  // Calculate price including flash sale if active
  const calculatePrice = () => flashSalePrice ?? price;

  // ------------------ LOADING ------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Skeleton className="aspect-square w-full max-w-[500px] mx-auto rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ ERROR ------------------
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Product not found</h2>
          <p className="text-muted-foreground mb-6">
            {error ? 'There was an error loading the product.' : 'The product you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Return to homepage
          </button>
        </div>
      </div>
    );
  }

  // ------------------ DATA PREP ------------------
  const truncateToTwoWords = (name: string) => {
    const words = name.split(' ');
    return words.slice(0, 2).join(' ');
  };

  // Build category URL with parent/child structure
  const categoryHref = (() => {
    if (!categoryData) {
      // Fallback: generate slug from category name
      const slug = (product.categories || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `/category/${slug}`;
    }
    
    const subcatSlug = categoryData.slug || categoryData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if parent exists (categoryData has parent property when parent_id is set)
    const parent = 'parent' in categoryData ? categoryData.parent : null;
    
    if (parent && categoryData.parent_id) {
      const parentSlug = parent.slug || parent.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `/category/${parentSlug}/${subcatSlug}?id=${categoryData.id}&parent=${categoryData.parent_id}&source=category|${encodeURIComponent(parent.category)}|${encodeURIComponent(categoryData.category)}`;
    }
    
    // No parent - it's a top-level category
    return `/category/${subcatSlug}?id=${categoryData.id}&form=category&source=category|allCategory|${encodeURIComponent(categoryData.category)}`;
  })();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { 
      label: product.categories || 'Products', 
      href: categoryHref
    },
    { label: truncateToTwoWords(product.name) }
  ];

  const productWithImages = {
    id: product.product_id,
    name: product.name.split('(')[0].trim(),
    image: product.image_urls?.[0] || '/placeholder.svg',
    images: product.image_urls || [],
  };

  // ------------------ RENDER ------------------
  return (
    <>
      <ProductMetadata product={product} currentPrice={price} />
      
      {/* SEO Structured Data */}
      <ProductStructuredData
        product={{
          name: product.name,
          description: product.description || '',
          image: product.image_urls || [],
          sku: product.product_id,
          price: flashSalePrice ?? price,
          availability: product.stock && product.stock > 0 ? 'InStock' : 'OutOfStock',
          rating: product.rating || undefined,
          reviewCount: product.reviews || undefined,
          url: `https://www.smartkenya.co.ke/product/${encodeURIComponent(product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/${product.product_id}`,
        }}
      />
      <BreadcrumbStructuredData
        items={breadcrumbItems.map((item, index) => ({
          name: item.label,
          url: item.href ? `https://www.smartkenya.co.ke${item.href}` : `https://www.smartkenya.co.ke/product/${product.product_id}`,
        }))}
      />

      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className={`${isMobile ? 'pb-20 px-0' : 'max-w-[1200px] mx-auto px-4 lg:px-6 py-6'}`}>
          {!isMobile && <SiteBreadcrumb items={breadcrumbItems} className="mb-6" />}

          <div className={`grid bg-card ${isMobile ? 'grid-cols-1' : 'grid-cols-[auto_1fr]'} gap-8 items-start ${!isMobile ? 'bg-card rounded-xl p-6 shadow-sm' : ''}`}>
            <EnhancedProductImageGallery 
              product={productWithImages} 
              selectedImageUrl={selectedColorImageUrl}
              variantImages={variantImages}
            />

            <div className={`space-y-4 px-2 ${isMobile ? '' : 'self-start'}`}>
              <ProductInfo 
                name={product.name}
                rating={product.rating}
                reviews={product.reviews}
              />

              <PriceDisplay 
                currentPrice={price}
                originalPrice={product.price}
                flashSalePrice={flashSalePrice || undefined}
                showFlashBadge={true}
              />

              {!isMobile && transformedVariants.length > 0 && (
                <VariantSelector
                  variants={transformedVariants}
                  selectedVariants={selectedVariants}
                  onVariantChange={handleVariantChange}
                  stockInfo={stockInfo}
                />
              )}

              {!isMobile && (
                <AddToCartSection
                  product={{
                    product_id: product.product_id,
                    name: product.name,
                    price: price,
                    stock: product.stock,
                    image: product.image_urls?.[0] || '/placeholder.svg'
                  }}
                  selectedVariants={selectedVariants}
                  requiredVariants={requiredVariants}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              )}

              {isMobile && (
                <div className="text-sm text-muted-foreground space-y-1 bg-card">
                  <p>✓ Free shipping on orders over KES {Math.max(0, amountNeededForFreeDelivery).toLocaleString()}</p>
                  <p>✓ 7-days return policy</p>
                  <p>✓ Secure payment options</p>
                </div>
              )}
            </div>
          </div>
          
          <div className='bg-card'>
            {productForTabs && <ProductTabs product={productForTabs} />}
          </div>

          <RelatedProductsCarousel
            currentProduct={{ id: product.product_id, category: product.categories || 'general' }}
          />
        </main>

        {isMobile && (
          <MobileBottomActions
            product={{
              product_id: product.product_id,
              name: product.name,
              image: product.image_urls?.[0] || '/placeholder.svg',
              price: flashSalePrice ?? price,
              originalPrice: flashSale ? price : undefined,
              description: product.description,
              rating: product.rating || 0,
              reviews: product.reviews || 0,
              inStock: product.stock ? product.stock > 0 : true,
              category: product.categories || 'general',
              subcategory: undefined,
              attributes:
                typeof product.specification === 'string' && product.specification
                  ? JSON.parse(product.specification)
                  : product.specification || {},
              features:
                typeof product.features === 'string'
                  ? [product.features]
                  : Array.isArray(product.features)
                    ? product.features
                    : []
            }}
            selectedVariants={selectedVariants}
            requiredVariants={requiredVariants}
            onVariantChange={handleVariantChange}
            calculatePrice={calculatePrice}
          />
        )}
      </div>
    </>
  );
};

export default ProductDetailsPage;