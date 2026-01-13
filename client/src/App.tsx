import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { AgeVerification } from "@/components/age-verification";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useCallback } from "react";

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
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background">
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
            <main className="flex-1 overflow-y-auto">
              <Shop />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/messages">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <Messages />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/account">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <Account />
            </main>
            <BottomNavigation />
          </div>
        </Route>
        <Route path="/admin">
          <div className="h-[100svh] flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto">
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
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => getAgeVerified());
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAgeVerified = useCallback(() => {
    setIsAgeVerified(true);
  }, []);

  if (showLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAgeVerified) {
    return <AgeVerification onVerified={handleAgeVerified} />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth">
          <Auth />
        </Route>
        <Route>
          <Landing />
        </Route>
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="only-u-theme">
        <TooltipProvider>
          {/* Mobile-only container - fixed to smartphone dimensions */}
          <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="w-full max-w-[430px] h-screen max-h-[932px] relative overflow-hidden bg-background shadow-2xl md:rounded-[2.5rem] md:border md:border-gray-800">
              <AppContent />
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
