import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useMpesaPayment } from '@/hooks/useMpesaPayment';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useDeliveryAddresses } from '@/hooks/useDeliveryAddresses';
import { useLocations } from '@/hooks/useLocations';
import { trackPurchase } from '@/utils/userIntent';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';

// Icons
import { ArrowLeft, MapPin, CheckCircle, Loader2, X, ChevronRight, CreditCard, ShoppingBag, Phone } from 'lucide-react';
import CheckoutSkeleton from '@/components/checkout/CheckoutSkeleton';
import { LocationPickerSheet } from '@/components/checkout/LocationPickerSheet';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/OptimizedImage';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { user, profile } = useAuth();
  const { calculations, getSelectedItems, appliedCoupons } = useSelectiveCart();
  const { clearCart } = useCartContext();
  const { initiatePayment, checkPaymentStatus, isProcessing } = useMpesaPayment();
  const { addresses, loading: addressesLoading, getDefaultAddress } = useDeliveryAddresses();
  const { getCountyOptions, getCityOptions, getDeliveryFee, isLoading: locationsLoading } = useLocations();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaPhoneError, setMpesaPhoneError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    message: string;
    checkoutRequestId: string | null;
  }>({ status: 'idle', message: '', checkoutRequestId: null });
  const paymentStatusRef = useRef(paymentStatus);
  const [orderId, setOrderId] = useState('');

  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    user_id: '',
    email: '',
    phone: '',
  });
  const [deliveryData, setDeliveryData] = useState({
    address: '',
    city: '',
    county: '',
    deliveryMethod: 'standard',
  });

  type ErrorsType = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    address?: string;
  };
  const [errors, setErrors] = useState<ErrorsType>({});
  const PAYMENT_TIMEOUT = 90000;

  // Initialize from profile / default address
  useEffect(() => {
    setCustomerData({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      email: user?.email || '',
      user_id: profile?.user_id || '',
      phone: profile?.phone || '',
    });

    const defaultAddress = getDefaultAddress();
    if (defaultAddress) {
      setDeliveryData({
        address: defaultAddress.street_address,
        city: defaultAddress.city,
        county: defaultAddress.county,
        deliveryMethod: 'standard',
      });
    } else if (profile) {
      setDeliveryData({
        address: profile?.address || '',
        city: profile?.city || '',
        county: profile?.county || '',
        deliveryMethod: 'standard',
      });
    }
  }, [profile, user, addresses]);

  // Redirect if no items
  useEffect(() => {
    if (calculations.selectedItemsCount === 0) {
      navigate('/cart');
    }
  }, [calculations.selectedItemsCount, navigate]);

  const selectedItems = getSelectedItems();

  const countyLabel = useMemo(
    () => getCountyOptions().find((c) => c.value === deliveryData.county)?.label || '',
    [deliveryData.county, getCountyOptions]
  );
  const cityLabel = useMemo(
    () =>
      getCityOptions(deliveryData.county).find((c) => c.value === deliveryData.city)?.label || '',
    [deliveryData.city, deliveryData.county, getCityOptions]
  );

  // Location-based delivery fee. Falls back to 0 (free) when no location chosen yet.
  const locationDeliveryFee = useMemo(
    () =>
      deliveryData.county && deliveryData.city
        ? getDeliveryFee(deliveryData.county, deliveryData.city)
        : 0,
    [deliveryData.county, deliveryData.city, getDeliveryFee]
  );
  const hasLocationFee = !!(deliveryData.county && deliveryData.city);
  const isEligibleForFreeDelivery = hasLocationFee && locationDeliveryFee === 0;
  const effectiveDeliveryFee = locationDeliveryFee;
  const finalTotalWithLocation =
    Math.max(0, calculations.subtotal - calculations.discount) + effectiveDeliveryFee;
  const finalTotal = finalTotalWithLocation;

  const updateProfileDeliveryInfo = async (updates: Record<string, string>) => {
    if (!user?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch {}
  };

  const handleCustomerChange = (field: keyof typeof customerData, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ErrorsType]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationConfirm = (county: string, city: string) => {
    setDeliveryData((prev) => ({ ...prev, county, city }));
    setErrors((prev) => ({ ...prev, location: '' }));
    updateProfileDeliveryInfo({ county, city });
  };

  const validate = () => {
    const newErrors: ErrorsType = {};
    if (!customerData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!customerData.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Email and phone are required for guests (no account to fall back on).
    // Logged-in users can leave them blank if already on file, but if they
    // do fill something in, it still has to be a valid format.
    const emailTrimmed = customerData.email.trim();
    if (!user && !emailTrimmed) {
      newErrors.email = 'Email is required';
    } else if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Enter a valid email address';
    }

    const phoneTrimmed = customerData.phone.trim();
    if (!user && !phoneTrimmed) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneTrimmed && !/^(\+254|254|0)[17]\d{8}$/.test(phoneTrimmed.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid Kenyan phone number';
    }

    if (!deliveryData.county || !deliveryData.city) {
      newErrors.location = 'Please select a delivery location';
    }
    if (!deliveryData.address.trim()) {
      newErrors.address = 'Delivery instructions are required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (!validate()) {
      const firstErrorEl = document.querySelector('[data-error="true"]');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    updateProfileDeliveryInfo({
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      phone: customerData.phone,
      address: deliveryData.address,
      city: deliveryData.city,
      county: deliveryData.county,
    });
    setMpesaPhone(customerData.phone);
    setMpesaPhoneError('');
    setShowPaymentModal(true);
  };

  const handleMpesaPayment = async () => {
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    if (!mpesaPhone.trim() || !phoneRegex.test(mpesaPhone.replace(/\s/g, ''))) {
      setMpesaPhoneError('Enter a valid M-Pesa phone number');
      return;
    }
    setMpesaPhoneError('');
    setPaymentStatus({ status: 'processing', message: '', checkoutRequestId: null });
    try {
      const itemsList = getSelectedItems();
      const orderItems = itemsList.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
        },
        variant_selections: item.variant_selections || {},
        quantity: item.quantity,
      }));

      let existingOrderId: string | null = null;
      if (customerData.user_id) {
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('order_id, items')
          .eq('user_id', customerData.user_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (pendingOrders && pendingOrders.length > 0) {
          for (const pendingOrder of pendingOrders) {
            const existingItems = pendingOrder.items as any[];
            if (existingItems && existingItems.length === orderItems.length) {
              const itemsMatch = orderItems.every((newItem) =>
                existingItems.some(
                  (existingItem) =>
                    existingItem.product?.id === newItem.product.id &&
                    existingItem.quantity === newItem.quantity &&
                    JSON.stringify(existingItem.variant_selections || {}) ===
                      JSON.stringify(newItem.variant_selections || {})
                )
              );
              if (itemsMatch) {
                existingOrderId = pendingOrder.order_id;
                break;
              }
            }
          }
        }
      }

      let currentOrderId: string;
      const shippingAddr = `${countyLabel}, ${cityLabel}, ${deliveryData.address}`;
      const fullName = `${customerData.firstName} ${customerData.lastName}`.trim();

      if (existingOrderId) {
        currentOrderId = existingOrderId;
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            email: customerData.email,
            phone_number: customerData.phone,
            amount: finalTotal,
            items: orderItems,
            shipping_address: shippingAddr,
            username: fullName,
            discount_amount: calculations.discount,
            delivery_fee: effectiveDeliveryFee,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', existingOrderId);
        if (updateError) throw new Error('Failed to update order. Please try again.');
      } else {
        currentOrderId = `ORD-${Date.now()}`;
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            order_id: currentOrderId,
            user_id: customerData.user_id || null,
            email: customerData.email,
            phone_number: customerData.phone,
            status: 'pending',
            amount: finalTotal,
            items: orderItems,
            shipping_address: shippingAddr,
            username: fullName,
            discount_amount: calculations.discount,
            delivery_fee: effectiveDeliveryFee,
            tracking_number: currentOrderId.slice(-5).toUpperCase(),
          })
          .select('order_id')
          .single();
        if (orderError) throw new Error('Failed to create order. Please try again.');
      }

      setOrderId(currentOrderId);

      if (!existingOrderId) {
        supabase.functions
          .invoke('notify-admin-new-order', {
            body: {
              orderId: currentOrderId,
              customerName: fullName,
              customerEmail: customerData.email,
              customerPhone: customerData.phone,
              amount: finalTotal,
              items: orderItems,
              shippingAddress: shippingAddr,
            },
          })
          .catch((err) => console.error('Admin notification failed:', err));
      }

      const result = await initiatePayment({
        phone: mpesaPhone,
        amount: finalTotal,
        orderId: currentOrderId,
      });
      if (!result.success) throw new Error(result.error || 'Payment initiation failed');

      const newStatus = {
        status: 'waiting',
        checkoutRequestId: result.checkoutRequestId ?? null,
        message: 'Check your phone and enter your M-Pesa PIN',
      };
      setPaymentStatus(newStatus);
      paymentStatusRef.current = newStatus;

      const pollPayment = setInterval(async () => {
        try {
          if (result.checkoutRequestId) {
            const status = await checkPaymentStatus(result.checkoutRequestId);
            if (status?.status === 'success') {
              const successStatus = { status: 'success', message: '', checkoutRequestId: null };
              setPaymentStatus(successStatus);
              paymentStatusRef.current = successStatus;

              if (appliedCoupons.length > 0) {
                for (const coupon of appliedCoupons) {
                  await supabase.from('discount_usage').insert({
                    discount_id: coupon.id,
                    user_id: customerData.user_id || null,
                    order_id: currentOrderId,
                    discount_amount: coupon.discount,
                  });
                  const { data: discountData } = await supabase
                    .from('discounts')
                    .select('usage_count')
                    .eq('id', coupon.id)
                    .single();
                  if (discountData) {
                    await supabase
                      .from('discounts')
                      .update({ usage_count: (discountData.usage_count || 0) + 1 })
                      .eq('id', coupon.id);
                  }
                }
              }

              const purchasedCategories = getSelectedItems()
                .map((item) => item.product?.category || '')
                .filter(Boolean);
              if (purchasedCategories.length > 0) {
                trackPurchase(purchasedCategories);
              }

              clearCart();
              clearInterval(pollPayment);
              setTimeout(() => {
                setShowPaymentModal(false);
                navigate(`/orders`);
              }, 2000);
            } else if (status?.status === 'failed') {
              const failedStatus = {
                status: 'failed',
                message: status.result_desc || 'Payment failed',
                checkoutRequestId: null,
              };
              setPaymentStatus(failedStatus);
              paymentStatusRef.current = failedStatus;
              clearInterval(pollPayment);
            }
          }
        } catch {}
      }, 3000);

      setTimeout(() => {
        clearInterval(pollPayment);
        if (paymentStatusRef.current.status === 'waiting') {
          const timeoutStatus = {
            status: 'timeout',
            message: 'Payment request timed out',
            checkoutRequestId: null,
          };
          setPaymentStatus(timeoutStatus);
          paymentStatusRef.current = timeoutStatus;
        }
      }, PAYMENT_TIMEOUT);
    } catch (error) {
      setPaymentStatus({
        status: 'failed',
        message:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message || 'Payment failed. Please try again.'
            : 'Payment failed. Please try again.',
        checkoutRequestId: null,
      });
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus({ status: 'idle', message: '', checkoutRequestId: null });
  };

  const handleBack = () => navigate('/cart');

  const hasLocation = !!(deliveryData.county && deliveryData.city);

  // ============== Payment Modal ==============
  const renderPaymentContent = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Initiating Payment...</h3>
            <p className="text-muted-foreground">Please wait while we process your request.</p>
          </div>
        );
      case 'waiting':
        return (
          <div className="text-center py-8">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Waiting for Payment</h3>
            <p className="text-muted-foreground mb-4 px-4">
              Check your phone and enter your M-Pesa PIN to complete the payment
            </p>
            <div className="bg-muted/50 p-4 rounded-xl mx-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">KES {finalTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-semibold">{mpesaPhone}</span>
              </div>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">Your order has been confirmed.</p>
            <div className="flex items-center justify-center text-sm text-green-600">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Redirecting to your orders...
            </div>
          </div>
        );
      case 'failed':
      case 'timeout':
        return (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              {paymentStatus.status === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
            </h3>
            <p className="text-muted-foreground mb-6 px-4">
              {paymentStatus.status === 'timeout'
                ? 'Payment request timed out. Please try again.'
                : paymentStatus.message || 'Payment could not be processed.'}
            </p>
            <Button onClick={handleRetryPayment} className="rounded-full px-8">
              Try Again
            </Button>
          </div>
        );
      default:
        return (
          <div className="space-y-5 py-2">
            <div>
              <label htmlFor="mpesaPhone" className="text-sm text-muted-foreground mb-1.5 block">
                M-Pesa Phone Number
              </label>
              <Input
                id="mpesaPhone"
                type="tel"
                value={mpesaPhone}
                onChange={(e) => {
                  setMpesaPhone(e.target.value);
                  if (mpesaPhoneError) setMpesaPhoneError('');
                }}
                placeholder="0712345678"
                inputMode="tel"
                className={cn(
                  'h-12 w-full rounded-2xl bg-background border-border text-base',
                  mpesaPhoneError && 'border-destructive'
                )}
              />
              {mpesaPhoneError ? (
                <p className="text-destructive text-xs mt-1">{mpesaPhoneError}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  You'll receive an STK Push prompt on this number
                </p>
              )}
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-9 bg-green-600 rounded-md flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-[11px]">M-PESA</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Pay with M-Pesa</h4>
                    <p className="text-xs text-muted-foreground">Secure STK Push</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base">KES {finalTotal.toLocaleString()}</p>
                </div>
              </div>
              <Button
                onClick={handleMpesaPayment}
                disabled={isProcessing || !mpesaPhone.trim()}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay KES ${finalTotal.toLocaleString()}`
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  const handleModalClose = () => {
    if (paymentStatus.status !== 'processing' && paymentStatus.status !== 'waiting') {
      setShowPaymentModal(false);
    }
  };

  const renderPaymentModal = () => {
    if (isMobile) {
      return (
        <Drawer open={showPaymentModal} onOpenChange={handleModalClose}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Complete Payment</DrawerTitle>
              <DrawerDescription>Finalize your order</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{renderPaymentContent()}</div>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Dialog open={showPaymentModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Finalize your order</DialogDescription>
          </DialogHeader>
          {renderPaymentContent()}
        </DialogContent>
      </Dialog>
    );
  };

  if (locationsLoading || addressesLoading) return <CheckoutSkeleton />;

  // ================ RENDER ================
  return (
    // FIX: removed overflow-x-hidden; use w-full + box-border to naturally contain content
    <div className={`min-h-screen w-full bg-card box-border ${isMobile && 'max-w-max'}`}>
      <div
        className={cn(
          'w-full box-border',
          !isMobile
            ? 'max-w-[1200px] container mx-auto px-4 lg:px-6 py-8'
            : 'px-4 pt-6 pb-40'   // FIX: px-4 (was px-5) keeps inputs inside viewport on small screens
        )}
      >
        {/* Back button - desktop */}
        {!isMobile && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        )}

        {/* Header */}
        <div className={cn('mb-6', isMobile && 'mb-4')}>
          <h1 className={cn(
            'font-serif font-bold text-foreground tracking-tight',
            isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'
          )}>
            Place Order
          </h1>
          <p className={cn(
            'text-muted-foreground mt-1',
            isMobile ? 'text-xs' : 'mt-1.5 text-sm md:text-base'
          )}>
            Fill in your details below
          </p>
          {/* Decorative accent bars */}
          <div className={cn('flex gap-1.5 max-w-md', isMobile ? 'mt-3' : 'mt-4')}>
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className="h-1 flex-1 rounded-full bg-primary/80" />
            <div className="h-1 flex-1 rounded-full bg-primary/30" />
            <div className="h-1 flex-1 rounded-full bg-primary/15" />
          </div>

        <div className={cn(
          'grid gap-6',
          !isMobile && '',
          isMobile && 'gap-5'
        )}>
          {/* LEFT: Form */}
          {/* FIX: min-w-0 prevents grid children from overflowing their column */}
          <div className={cn('min-w-0 w-full', isMobile ? 'space-y-6' : 'space-y-8')}>

            {/* Personal Details */}
            <section className="w-full">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Personal Details
              </h2>
              <div className="space-y-4 w-full">
                <div className="flex flex-col gap-4 w-full">
                  <div data-error={!!errors.firstName} className="w-full">
                    <Label htmlFor="firstName" className="text-sm text-muted-foreground mb-1.5 block">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={customerData.firstName}
                      onChange={(e) => handleCustomerChange('firstName', e.target.value)}
                      placeholder="John"
                      className={cn(
                        'h-12 w-full rounded-2xl bg-background border-border text-base',
                        errors.firstName && 'border-destructive'
                      )}
                    />
                    {errors.firstName && (
                      <p className="text-destructive text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div data-error={!!errors.lastName} className="w-full">
                    <Label htmlFor="lastName" className="text-sm text-muted-foreground mb-1.5 block">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={customerData.lastName}
                      onChange={(e) => handleCustomerChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className={cn(
                        'h-12 w-full rounded-2xl bg-background border-border text-base',
                        errors.lastName && 'border-destructive'
                      )}
                    />
                    {errors.lastName && (
                      <p className="text-destructive text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div data-error={!!errors.phone} className="w-full">
                  <Label htmlFor="phone" className="text-sm text-muted-foreground mb-1.5 block">
                    Call Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => handleCustomerChange('phone', e.target.value)}
                    placeholder="0712 345 678"
                    inputMode="tel"
                    className={cn(
                      'h-12 w-full rounded-2xl bg-background border-border text-base',
                      errors.phone && 'border-destructive'
                    )}
                  />
                  {errors.phone && (
                    <p className="text-destructive text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery Address */}
            <section className="w-full">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Delivery Address
              </h2>
              <div className="space-y-4 w-full">
                {/* Location selector card */}
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  data-error={!!errors.location}
                  className={cn(
                    // FIX: w-full + box-border ensures button never exceeds container width
                    'w-full box-border text-left rounded-2xl p-4 transition-all active:scale-[0.99] flex items-center gap-3 group',
                    hasLocation
                      ? 'bg-primary/5 border-2 border-dashed border-primary/40 hover:border-primary/60'
                      : 'bg-card border border-border hover:border-primary/40',
                    errors.location && 'border-destructive border-solid'
                  )}
                >
                  <div
                    className={cn(
                      'h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
                      hasLocation
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  {/* FIX: min-w-0 + overflow-hidden on text container stops text from widening the button */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-0.5">Delivery location</p>
                    <p
                      className={cn(
                        'truncate text-base',
                        hasLocation ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {hasLocation ? `${cityLabel}, ${countyLabel} County` : 'Select your location'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </button>
                {errors.location && (
                  <p className="text-destructive text-xs -mt-2 px-1">{errors.location}</p>
                )}

                <div data-error={!!errors.address} className="w-full">
                  <Label htmlFor="address" className="text-sm text-muted-foreground mb-1.5 block">
                    Delivery Instructions
                  </Label>
                  <Textarea
                    id="address"
                    value={deliveryData.address}
                    onChange={(e) => {
                      setDeliveryData((prev) => ({ ...prev, address: e.target.value }));
                      if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                    }}
                    placeholder="Estate, building, house/shop number, nearest landmark, gate instructions..."
                    className={cn(
                      'min-h-[110px] w-full resize-none rounded-2xl bg-background border-border text-base p-4',
                      errors.address && 'border-destructive'
                    )}
                  />
                  {errors.address && (
                    <p className="text-destructive text-xs mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="flex items-start gap-2.5 rounded-2xl bg-muted/50 border border-border/50 p-3.5">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Our delivery team will call or text the phone number you provided above to
                    confirm details before your order arrives. Please make sure it's active and reachable.
                  </p>
                </div>
              </div>
            </section>

            {/* Order Summary */}
            <section className="w-full">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Order Summary
              </h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden w-full">
                {selectedItems.map((item, idx) => {
                  const variantText = item.variant_selections
                    ? Object.values(item.variant_selections as Record<string, string>).join(' · ')
                    : '';
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-3',
                        idx !== selectedItems.length - 1 && 'border-b border-border'
                      )}
                    >
                      <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <OptimizedImage
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* FIX: min-w-0 stops long product names from pushing the row wider */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">
                          {item.product.name}
                        </p>
                        {variantText && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {variantText}
                          </p>
                        )}
                        <p className="text-[13px] font-bold text-foreground">
                            KES {Number(item.product.price).toLocaleString()}
                          </p>
                      </div>
                      <div className="text-primary font-semibold text-sm flex-shrink-0">
                        ×{item.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-5 space-y-3 w-full">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    KSh {calculations.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">
                    Delivery{cityLabel && ` (${cityLabel})`}
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      !hasLocationFee
                        ? 'text-muted-foreground italic'
                        : isEligibleForFreeDelivery
                          ? 'text-green-600'
                          : 'text-foreground'
                    )}
                  >
                    {!hasLocationFee
                      ? 'Select location'
                      : isEligibleForFreeDelivery
                        ? 'FREE'
                        : `KSh ${effectiveDeliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    KSh {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Desktop CTA inline */}
              {!isMobile && (
                <Button
                  onClick={handleProceedToPayment}
                  className="w-full h-14 mt-6 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Payment
                </Button>
              )}
            </section>
          </div></div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
        >
          <Button
            onClick={handleProceedToPayment}
            className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      )}

      {/* Location picker */}
      <LocationPickerSheet
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        countyValue={deliveryData.county}
        cityValue={deliveryData.city}
        onConfirm={handleLocationConfirm}
      />

      {/* Payment modal */}
      {renderPaymentModal()}
    </div>
  );
};
 
export default CheckoutPage;