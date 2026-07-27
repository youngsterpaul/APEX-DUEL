import { Routes, Route } from 'react-router-dom';
import React, { lazy } from 'react';
import AdminRoute from '@/components/AdminRoute';

// Public pages
const Auth = lazy(() => import("@/pages/Auth"));
const VerifyOTP = lazy(() => import("@/pages/VerifyOTP"));
const VerifyPasswordResetOTP = lazy(() => import("@/pages/VerifyPasswordResetOTP"));
const MFASetup = lazy(() => import("@/pages/MFASetup"));
const Index = lazy(() => import("@/pages/Index"));
const ProductDetailsPage = lazy(() => import("@/pages/ProductDetailsPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const WriteReviewPage = lazy(() => import("@/pages/WriteReviewPage"));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const ReturnsPage = lazy(() => import("@/pages/ReturnsPage"));
const CustomerReturnsPage = lazy(() => import("@/pages/CustomerReturnsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CareersPage = lazy(() => import("@/pages/CareersPage"));
const LoyaltyPage = lazy(() => import("@/pages/LoyaltyPage"));
const RewardsPage = lazy(() => import("@/pages/RewardsPage"));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"));
const NotificationsSettingsPage = lazy(() => import("@/pages/NotificationsSettingsPage"));
const LanguageSettingsPage = lazy(() => import("@/pages/LanguageSettingsPage"));
const SecuritySettingsPage = lazy(() => import("@/pages/SecuritySettingsPage"));
const AddressesPage = lazy(() => import("@/pages/AddressesPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const AppearanceSettingsPage = lazy(() => import("@/pages/AppearanceSettingsPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const MobileCategoryPage = lazy(() => import("@/pages/MobileCategoryPage"));
const FlashSalePage = lazy(() => import("@/pages/FlashSalePage"));

// Admin pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminDailySalesPage = lazy(() => import("@/pages/admin/AdminDailySalesPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminProductAddPage = lazy(() => import("@/pages/admin/AdminProductAddPage"));
const AdminProductEditPage = lazy(() => import("@/pages/admin/AdminProductEditPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/AdminCategoriesPage"));
const AdminStoresPage = lazy(() => import("@/pages/admin/AdminStoresPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminUserAddPage = lazy(() => import("@/pages/admin/AdminUserAddPage"));
const AdminUserEditPage = lazy(() => import("@/pages/admin/AdminUserEditPage"));
const AdminHeroSlidesPage = lazy(() => import("@/pages/admin/AdminHeroSlidesPage"));
const AdminLocationsPage = lazy(() => import("@/pages/admin/AdminLocationsPage"));
const AdminSecurityAlertsPage = lazy(() => import("@/pages/admin/AdminSecurityAlertsPage"));
const AdminLoginAuditPage = lazy(() => import("@/pages/admin/AdminLoginAuditPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminActivityLogPage = lazy(() => import("@/pages/admin/AdminActivityLogPage"));
const AdminReviewsPage = lazy(() => import("@/pages/admin/AdminReviewsPage"));
const AdminDiscountsPage = lazy(() => import("@/pages/admin/AdminDiscountsPage"));
const AdminFlashSalesPage = lazy(() => import("@/pages/admin/AdminFlashSalesPage"));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReportsPage"));
const AdminReturnsPage = lazy(() => import("@/pages/admin/AdminReturnsPage"));
const AdminEmailTemplatesPage = lazy(() => import("@/pages/admin/AdminEmailTemplatesPage"));
const AdminRevenueDashboardPage = lazy(() => import("@/pages/admin/AdminRevenueDashboardPage"));
const AdminSuppliersPage = lazy(() => import("@/pages/admin/AdminSuppliersPage"));
const AdminInventoryPage = lazy(() => import("@/pages/admin/AdminInventoryPage"));
const AdminPurchaseOrdersPage = lazy(() => import("@/pages/admin/AdminPurchaseOrdersPage"));
const AdminPurchaseOrderCreatePage = lazy(() => import("@/pages/admin/AdminPurchaseOrderCreatePage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/AdminCustomersPage"));
const AdminCustomerViewPage = lazy(() => import("@/pages/admin/AdminCustomerViewPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const AdminCategoryIconsPage = lazy(() => import("@/pages/admin/AdminCategoryIconsPage"));
const AdminContactPage = lazy(() => import("@/pages/admin/AdminContactPage"));
const AdminCareersPage = lazy(() => import("@/pages/admin/AdminCareersPage"));
const AdminFAQPage = lazy(() => import("@/pages/admin/AdminFAQPage"));
const AdminSiteContentPage = lazy(() => import("@/pages/admin/AdminSiteContentPage"));
const AdminRoutePermissionsPage = lazy(() => import("@/pages/admin/AdminRoutePermissionsPage"));
const AdminNewsletterPage = lazy(() => import("@/pages/admin/AdminNewsletterPage"));
const AdminTestimonialsPage = lazy(() => import("@/pages/admin/AdminTestimonialsPage"));
const AdminABTestingPage = lazy(() => import("@/pages/admin/AdminABTestingPage"));
const AdminQRCodeScannerPage = lazy(() => import("@/pages/admin/AdminQRCodeScannerPage"));
const AdminUserBehaviorPage = lazy(() => import("@/pages/admin/AdminUserBehaviorPage"));
const AdminSalesForecastPage = lazy(() => import("@/pages/admin/AdminSalesForecastPage"));

const ADMIN_PREFIX = "/admin";

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="auth" element={<Auth />} />
    <Route path="verify-otp" element={<VerifyOTP />} />
    <Route path="verify-password-reset-otp" element={<VerifyPasswordResetOTP />} />
    <Route path="/" element={<Index />} />
    <Route path="/category/:categorySlug" element={<CategoryPage />} />
    <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryPage />} />
    <Route path="/category" element={<MobileCategoryPage />} />
    <Route path="/product/:productName/:id" element={<ProductDetailsPage />} />
    <Route path="/products/:productId/review" element={<WriteReviewPage />} />
    <Route path="/reviews" element={<ReviewsPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/mfa-setup" element={<MFASetup />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/returns" element={<ReturnsPage />} />
    <Route path="/my-returns" element={<CustomerReturnsPage />} />
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/loyalty" element={<LoyaltyPage />} />
    <Route path="/rewards" element={<RewardsPage />} />
    <Route path="/achievements" element={<AchievementsPage />} />
    <Route path="/flash-sale" element={<FlashSalePage />} />
    <Route path="/notifications" element={<NotificationsSettingsPage />} />
    <Route path="/language" element={<LanguageSettingsPage />} />
    <Route path="/security" element={<SecuritySettingsPage />} />
    <Route path="/addresses" element={<AddressesPage />} />
    <Route path="/billing" element={<BillingPage />} />
    <Route path="/appearance" element={<AppearanceSettingsPage />} />

    {/* Admin Routes */}
    <Route path={ADMIN_PREFIX} element={<AdminRoute requiredRole="moderator"><AdminDashboard /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/daily-sales`} element={<AdminRoute requiredRole="superadmin"><AdminDailySalesPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/products`} element={<AdminRoute requiredRole="moderator"><AdminProductsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/products/add`} element={<AdminRoute requiredRole="moderator"><AdminProductAddPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/products/edit/:productId`} element={<AdminRoute requiredRole="moderator"><AdminProductEditPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/categories`} element={<AdminRoute requiredRole="superadmin"><AdminCategoriesPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/category-icons`} element={<AdminRoute requiredRole="superadmin"><AdminCategoryIconsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/stores`} element={<AdminRoute requiredRole="admin"><AdminStoresPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/orders`} element={<AdminRoute requiredRole="moderator"><AdminOrdersPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/users`} element={<AdminRoute requiredRole="superadmin"><AdminUsersPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/users/add`} element={<AdminRoute requiredRole="superadmin"><AdminUserAddPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/users/edit/:userId`} element={<AdminRoute requiredRole="superadmin"><AdminUserEditPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/heroslides`} element={<AdminRoute requiredRole="admin"><AdminHeroSlidesPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/locations`} element={<AdminRoute requiredRole="superadmin"><AdminLocationsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/security-alerts`} element={<AdminRoute requiredRole="superadmin"><AdminSecurityAlertsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/login-audit`} element={<AdminRoute requiredRole="superadmin"><AdminLoginAuditPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/settings`} element={<AdminRoute requiredRole="superadmin"><AdminSettingsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/activity-log`} element={<AdminRoute requiredRole="superadmin"><AdminActivityLogPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/suppliers`} element={<AdminRoute requiredRole="admin"><AdminSuppliersPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/inventory`} element={<AdminRoute requiredRole="admin"><AdminInventoryPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/purchase-orders`} element={<AdminRoute requiredRole="admin"><AdminPurchaseOrdersPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/purchase-orders/create`} element={<AdminRoute requiredRole="admin"><AdminPurchaseOrderCreatePage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/reviews`} element={<AdminRoute requiredRole="moderator"><AdminReviewsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/discounts`} element={<AdminRoute requiredRole="admin"><AdminDiscountsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/flash-sales`} element={<AdminRoute requiredRole="admin"><AdminFlashSalesPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/reports`} element={<AdminRoute requiredRole="admin"><AdminReportsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/returns`} element={<AdminRoute requiredRole="admin"><AdminReturnsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/email-templates`} element={<AdminRoute requiredRole="admin"><AdminEmailTemplatesPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/revenue-dashboard`} element={<AdminRoute requiredRole="admin"><AdminRevenueDashboardPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/customers`} element={<AdminRoute requiredRole="superadmin"><AdminCustomersPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/customers/:customerId`} element={<AdminRoute requiredRole="superadmin"><AdminCustomerViewPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/analytics`} element={<AdminRoute requiredRole="superadmin"><AdminAnalyticsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/contact`} element={<AdminRoute requiredRole="superadmin"><AdminContactPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/careers`} element={<AdminRoute requiredRole="admin"><AdminCareersPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/faq`} element={<AdminRoute requiredRole="admin"><AdminFAQPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/site-content`} element={<AdminRoute requiredRole="admin"><AdminSiteContentPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/route-permissions`} element={<AdminRoute requiredRole="superadmin"><AdminRoutePermissionsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/newsletter`} element={<AdminRoute requiredRole="admin"><AdminNewsletterPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/testimonials`} element={<AdminRoute requiredRole="admin"><AdminTestimonialsPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/ab-testing`} element={<AdminRoute requiredRole="superadmin"><AdminABTestingPage /></AdminRoute>} />
    <Route path={`${ADMIN_PREFIX}/qr-scanner`} element={<AdminRoute requiredRole="moderator"><AdminQRCodeScannerPage /></AdminRoute>} />
     <Route path={`${ADMIN_PREFIX}/user-behavior`} element={<AdminRoute requiredRole="superadmin"><AdminUserBehaviorPage /></AdminRoute>} />
     <Route path={`${ADMIN_PREFIX}/sales-forecast`} element={<AdminRoute requiredRole="superadmin"><AdminSalesForecastPage /></AdminRoute>} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;