import { lazy, Suspense, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import { supabase } from "./lib/supabase";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";

const AddPage = lazy(() => import("./pages/AddPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const ProfilePage = lazy(() => import("./pages/ShopPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const IdentityPage = lazy(() => import("./pages/IdentityPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteLoader() {
  return <div className="route-loader" role="status" aria-label="Загрузка страницы"><div className="app-loading-mark" /></div>;
}

function Router({ onSignOut }: { onSignOut: () => void }) {
  return (
    <MainLayout onSignOut={onSignOut}>
      <Suspense fallback={<RouteLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/add" component={AddPage} />
          <Route path="/goals" component={GoalsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/shop" component={ProfilePage} />
          <Route path="/stats" component={StatsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/identity" component={IdentityPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </MainLayout>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <ThemeProvider switchable>
        <div className="app-loading" role="status" aria-label="Загрузка приложения">
          <div className="app-loading-mark" />
        </div>
      </ThemeProvider>
    );
  }

  if (!user && !offlineMode) {
    return (
      <ThemeProvider switchable>
        <Toaster />
        <AuthPage onLogin={() => setOfflineMode(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider switchable>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Router onSignOut={handleSignOut} />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
