import { Suspense, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Ensure this matches your project's client instance path
import { TooltipProvider } from "@/components/ui/tooltip";
import TopProgressBar from './components/TopProgressBar';
import Header from './components/Header';
import Footer from './components/Footer';
import { isMobileUserAgent } from './hooks/use-mobile';
import MobileNav from '@/components/MobileNav';
import { MobileHeader } from './components/ui/mobile-header';
import LoadingSpinner from '@/components/LoadingSpinner';
import SecurityHeaders from './components/SecurityHeaders';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { OfflineDataPreloader } from './components/OfflineDataPreloader';
import { useUserBehaviorTracking } from './hooks/useUserBehaviorTracking';
import { useMobileHeaderProps } from './hooks/useMobileHeaderProps';
import AppRoutes from './routes/AppRoutes';

function App() {
  useSessionTimeout();
  useUserBehaviorTracking();

  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname.startsWith("/auth");
  const isSearchPage = location.pathname.startsWith("/search");
  const isCategoryPage = location.pathname.startsWith("/category/");
  const isHomePage = location.pathname === "/";

  const { title, backTo, rightAction } = useMobileHeaderProps();

  // Listen for Google Auth redirects globally across the app shell
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // If they successfully logged in from the Google flow, wipe the parameters clean
        if (window.location.search.includes("code=")) {
          navigate("/", { replace: true }); // You can alter "/" to your dashboard route e.g., "/dashboard"
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <TooltipProvider>
      <SecurityHeaders />
      <OfflineDataPreloader />
      <TopProgressBar />
      <div className="flex flex-col min-h-screen bg-background">
        {!isMobile && !isAdminRoute && !isAuthRoute && <Header />}
        {isMobile && !isAdminRoute && !isHomePage && !isSearchPage && !isCategoryPage && (
          <MobileHeader title={title} backTo={backTo} rightAction={rightAction} />
        )}

        <Suspense fallback={<LoadingSpinner overlay text="Please wait..." />}>
          <main
            id="main-content"
            className={`flex-grow ${isMobile && !isAdminRoute ? 'pt-14' : ''} ${isMobile ? 'overflow-y-auto':''}`}
          >
            <AppRoutes />
          </main>
        </Suspense>

        {!isMobile && <Footer />}
        {isMobile && <MobileNav />}
      </div>
    </TooltipProvider>
  );
}

export default App;