import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { AgeVerification } from "@/components/age-verification";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback, useRef } from "react";

function ScrollToTop() {
  const [location] = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current !== location) {
      window.scrollTo(0, 0);
      prevLocation.current = location;
    }
  }, [location]);

  return null;
}

import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Live from "@/pages/live";
import Shop from "@/pages/shop";
import Messages from "@/pages/messages";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import CreatorProfile from "@/pages/creator-profile";
import MyProfile from "@/pages/my-profile";
import Auth from "@/pages/auth";
import LegalPage from "@/pages/legal-page";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import CreatorApplication from "@/pages/creator-application";
import PointsPurchase from "@/pages/points-purchase";
import CreatorContent from "@/pages/creator-content";
import CreatorLive from "@/pages/creator-live";
import CreatorShop from "@/pages/creator-shop";
import Following from "@/pages/following";
import Conversation from "@/pages/conversation";
import Notifications from "@/pages/notifications";
import MyPurchases from "@/pages/my-purchases";
import CreatorOrders from "@/pages/creator-orders";
import CreatorSales from "@/pages/creator-sales";
import CreatorWithdrawal from "@/pages/creator-withdrawal";
import PaymentMethods from "@/pages/payment-methods";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Switch>
        {/* Home uses full-screen TikTok-style layout with overlay nav - Header/Nav included in component */}
        <Route path="/">
          <div className="relative h-[100svh] overflow-hidden">
            <Home />
          </div>
        </Route>
        {/* Live uses full-screen TikTok-style layout like Home - Header/Nav included in component */}
        <Route path="/live">
          <div className="relative h-[100svh] overflow-hidden">
            <Live />
          </div>
        </Route>
        <Route path="/shop">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Shop />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/messages">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Messages />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/account">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Account />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/admin">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Admin />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/creator/:username">
          <div className="relative h-[100svh] overflow-hidden">
            <CreatorProfile />
          </div>
        </Route>
        <Route path="/my-profile">
          <div className="relative h-[100svh] overflow-hidden">
            <MyProfile />
          </div>
        </Route>
        <Route path="/creator-application">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <CreatorApplication />
          </div>
        </Route>
        <Route path="/points-purchase">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <PointsPurchase />
          </div>
        </Route>
        <Route path="/creator-content">
          <div className="relative h-[100svh] overflow-hidden">
            <CreatorContent />
          </div>
        </Route>
        <Route path="/creator-live">
          <div className="relative h-[100svh] overflow-hidden">
            <CreatorLive />
          </div>
        </Route>
        <Route path="/creator-shop">
          <div className="relative h-[100svh] overflow-hidden">
            <CreatorShop />
          </div>
        </Route>
        <Route path="/following">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <Following />
          </div>
        </Route>
        <Route path="/conversation/:id">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <Conversation />
          </div>
        </Route>
        <Route path="/notifications">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <Notifications />
          </div>
        </Route>
        <Route path="/my-purchases">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <MyPurchases />
          </div>
        </Route>
        <Route path="/creator-orders">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <CreatorOrders />
          </div>
        </Route>
        <Route path="/creator-sales">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <CreatorSales />
          </div>
        </Route>
        <Route path="/creator-withdrawal">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <CreatorWithdrawal />
          </div>
        </Route>
        <Route path="/payment-methods">
          <div className="h-[100svh] flex flex-col overflow-hidden">
            <PaymentMethods />
          </div>
        </Route>
        <Route path="/terms">
          <LegalPage title="利用規約" type="terms" />
        </Route>
        <Route path="/privacy">
          <LegalPage title="プライバシーポリシー" type="privacy" />
        </Route>
        <Route path="/legal">
          <LegalPage title="特定商取引法に基づく表記" type="legal" />
        </Route>
        <Route path="/guidelines">
          <LegalPage title="コンテンツガイドライン" type="guidelines" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function getAgeVerified(): boolean {
  try {
    return localStorage.getItem("only-u-age-verified") === "true";
  } catch {
    return false;
  }
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => getAgeVerified());
  const [showLoading, setShowLoading] = useState(true);
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleAgeVerified = useCallback(() => {
    setIsAgeVerified(true);
    setShowAgeVerification(false);
    setLocation("/auth");
  }, [setLocation]);

  const handleRegisterClick = useCallback(() => {
    setShowAgeVerification(true);
  }, []);

  const handleAgeCancel = useCallback(() => {
    setShowAgeVerification(false);
  }, []);

  if (showLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (showAgeVerification) {
    return <AgeVerification onVerified={handleAgeVerified} onCancel={handleAgeCancel} />;
  }

  if (!user) {
    return (
      <>
        <ScrollToTop />
        <Switch>
          <Route path="/auth">
          <Auth />
        </Route>
        <Route path="/terms">
          <LegalPage title="利用規約" type="terms" />
        </Route>
        <Route path="/privacy">
          <LegalPage title="プライバシーポリシー" type="privacy" />
        </Route>
        <Route path="/legal">
          <LegalPage title="特定商取引法に基づく表記" type="legal" />
        </Route>
        <Route path="/guidelines">
          <LegalPage title="コンテンツガイドライン" type="guidelines" />
        </Route>
        <Route path="/forgot-password">
          <ForgotPassword />
        </Route>
        <Route path="/reset-password">
          <ResetPassword />
        </Route>
        <Route>
          <Landing onRegisterClick={handleRegisterClick} />
        </Route>
        </Switch>
      </>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="only-u-theme">
        <I18nProvider>
          <TooltipProvider>
            {/* Mobile-only container - fixed to smartphone dimensions */}
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
              <div className="w-full max-w-[430px] h-screen max-h-[100svh] md:max-h-[932px] relative bg-background md:rounded-[2.5rem] md:border md:border-gray-800 overflow-hidden">
                <AppContent />
              </div>
            </div>
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
