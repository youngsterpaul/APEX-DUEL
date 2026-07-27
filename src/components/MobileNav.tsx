import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, List } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { isMobileUserAgent } from "@/hooks/use-mobile";

const MobileNav = () => {
  const location = useLocation();
  const isMobile = isMobileUserAgent();

  const showMobileNavOnPaths = ['/', '/category', '/account', '/cart'];
  const showMobileNav = showMobileNavOnPaths.includes(location.pathname);
    
  let items: any[] = [];
  let totalItems = 0;
  
  try {
    const cartData = useCartContext();
    items = cartData.cartItems || [];
    totalItems = items.reduce((total, item) => total + item.quantity, 0);
  } catch {
    // Cart context not available, use defaults
    items = [];
    totalItems = 0;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: List, label: 'Category', path: '/category' },
    { 
      icon: ShoppingCart, 
      label: 'Cart', 
      path: '/cart', 
      count: totalItems
    },
    { icon: User, label: 'Account', path: '/account' },
  ];

  if (!isMobile) return null;

  return (
    <>
      {showMobileNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border w-full z-50 safe-area-inset-bottom"
          style={{
            paddingBottom: `calc(4px + env(safe-area-inset-bottom))`,
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex justify-around items-center py-2">
            {navItems.map(({ icon: Icon, label, path, count }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  aria-label={`${label}${count && count > 0 ? ` (${count} items)` : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center min-w-[48px] min-h-[48px] justify-center relative transition-colors touch-target ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
                    {(count ?? 0) > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-semibold"
                        aria-hidden="true"
                      >
                        {count}
                      </Badge>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 ${isActive ? 'font-medium' : ''}`} aria-hidden="true">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

export default MobileNav;