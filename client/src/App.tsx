import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import AddPage from "./pages/AddPage";
import GoalsPage from "./pages/GoalsPage";
import ShopPage from "./pages/ShopPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import SnapshotPage from "./pages/SnapshotPage";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { User } from "@supabase/supabase-js";

function Router({ onSignOut }: { onSignOut: () => void }) {
  return (
    <MainLayout onSignOut={onSignOut}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/add" component={AddPage} />
        <Route path="/goals" component={GoalsPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/stats" component={StatsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/snapshot" component={SnapshotPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    return (
      <ThemeProvider defaultTheme="dark">
        <Toaster />
        <AuthPage onLogin={() => {}} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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

export default App;
