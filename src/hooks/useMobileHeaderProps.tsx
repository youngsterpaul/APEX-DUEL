import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Search, Settings, ShoppingCart } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';

export const useMobileHeaderProps = () => {
  const location = useLocation();
  const navigate = useNavigate();

  let totalItems = 0;
  try {
    const { cartItems } = useCartContext();
    totalItems = cartItems?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  } catch {
    totalItems = 0;
  }

  let title = "";
  let backTo = "/";
  let rightAction: ReactNode = null;

  const path = location.pathname;

  if (path.startsWith("/account")) {
    title = "Account";
    rightAction = (
      <Link to="/settings">
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
    );
  } else if (path.startsWith("/product")) {
    title = "Product Details";
    rightAction = (
      <div className="flex items-center gap-2">
        <Button onClick={() => navigate('/search')} variant="ghost" size="sm" className="p-2">
          <Search className="h-4 w-4" />
        </Button>
        <Button onClick={() => navigate('/wishlist')} variant="ghost" size="sm" className="p-2">
          <Heart className="h-4 w-4" />
        </Button>
        <Link
          to="/cart"
          aria-label={`View Cart, ${totalItems} items`}
          className="flex items-center justify-center p-2 text-gray-700 hover:text-primary transition-colors"
        >
          <span className="relative">
            <ShoppingCart size={16} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold leading-none text-white">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </span>
        </Link>
      </div>
    );
  } else if (path.startsWith("/category")) {
    title = "Product Category";
  } else if (path.startsWith("/orders")) {
    title = "My Orders";
  } else if (path.startsWith("/about")) {
    title = "About Smartkenya";
  } else if (path.startsWith("/faq")) {
    title = "Faqs";
  } else if (path.startsWith("/contact")) {
    title = "Contact Us";
  } else if (path.startsWith("/returns")) {
    title = "Returns";
  } else if (path.startsWith("/terms")) {
    title = "Terms & Conditions";
  } else if (path.startsWith("/wishlist")) {
    title = "Wishlist";
  } else if (path.startsWith("/reviews")) {
    title = "Write Review";
  } else if (path.startsWith("/privacy")) {
    title = "Privacy";
  } else if (path.startsWith("/checkout")) {
    title = "Place Order";
  } else if (path.startsWith("/settings")) {
    title = "Settings";
  } else if (path.startsWith("/flash-sale")) {
    title = "Flash Sales";
  } else if (path.startsWith("/my-returns")) {
    title = "Returns";
  } else if (path.startsWith("/cart")) {
    title = "Shopping Cart";
  } else if (path.startsWith("/careers")) {
    title = "Careers";
  } else if (path.startsWith("/profile")) {
    title = "My Profile";
  } else if (path.startsWith("/notifications")) {
    title = "Notifications";
  } else if (path.startsWith("/language")) {
    title = "Language & Region";
  } else if (path.startsWith("/security")) {
    title = "Security";
  } else if (path.startsWith("/addresses")) {
    title = "My Addresses";
  } else if (path.startsWith("/billing")) {
    title = "Billing";
  } else if (path.startsWith("/appearance")) {
    title = "Appearance";
  }

  return { title, backTo, rightAction };
};