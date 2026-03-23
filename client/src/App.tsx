import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { AgeVerification } from "@/components/age-verification";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback, useRef } from "react";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Live from "@/pages/live";
import Shop from "@/pages/shop";
import Messages from "@/pages/messages";
import Account from "@/pages/account";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
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
import PersonalInfo from "@/pages/personal-info";
import PhoneVerification from "@/pages/phone-verification";
import EmailVerification from "@/pages/email-verification";
import LanguageSettings from "@/pages/language-settings";
import NotificationSettings from "@/pages/notification-settings";
import PrivacySettings from "@/pages/privacy-settings";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

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
          <div className="h-[100svh] flex flex-col bg-background pt-safe">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Shop />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/messages">
          <div className="h-[100svh] flex flex-col bg-background pt-safe">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Messages />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/account">
          <div className="h-[100svh] flex flex-col bg-background pt-safe">
            <Header />
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <Account />
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
        <Route path="/personal-info">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <PersonalInfo />
          </div>
        </Route>
        <Route path="/phone-verification">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <PhoneVerification />
          </div>
        </Route>
        <Route path="/email-verification">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <EmailVerification />
          </div>
        </Route>
        <Route path="/language-settings">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <LanguageSettings />
          </div>
        </Route>
        <Route path="/notification-settings">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <NotificationSettings />
          </div>
        </Route>
        <Route path="/privacy-settings">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <PrivacySettings />
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
        <Route path="/help">
          <div className="h-[100svh] flex flex-col overflow-y-auto">
            <Help />
          </div>
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
  const [showAgeVerification, setShowAgeVerification] = useState(false);

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

  if (isLoading) {
    return null;
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
        <Route path="/help">
          <Help />
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

function AppLayout() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdminRoute = location.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin/login"><AdminLogin /></Route>
        <Route path="/admin/dashboard"><AdminDashboard /></Route>
        <Route path="/admin"><AdminLogin /></Route>
      </Switch>
    );
  }

  if (user) {
    return (
      <>
        <SidebarNavigation />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center lg:bg-background lg:block lg:ml-64">
          <div className="w-full max-w-[430px] h-screen max-h-[100svh] md:max-h-[932px] relative bg-background md:rounded-[2.5rem] md:border md:border-gray-800 overflow-hidden lg:max-w-none lg:h-screen lg:max-h-screen lg:rounded-none lg:border-none">
            <AppContent />
          </div>
        </div>
      </>
    );
  }

  return <AppContent />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="only-u-theme-v2">
        <I18nProvider>
          <TooltipProvider>
            <AppLayout />
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
