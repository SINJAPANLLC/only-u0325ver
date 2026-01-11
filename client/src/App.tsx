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
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-3.5rem-4rem)]">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/live" component={Live} />
          <Route path="/shop" component={Shop} />
          <Route path="/messages" component={Messages} />
          <Route path="/account" component={Account} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
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
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="only-u-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
