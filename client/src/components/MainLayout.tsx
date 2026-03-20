import { Link, useLocation } from "wouter";
import { Home, Target, PlusCircle, ShoppingCart, LogOut, Settings, Cloud } from "lucide-react";
import CoinDisplay from "./CoinDisplay";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const navItems = [
  { path: "/", label: "Сегодня", icon: Home },
  { path: "/goals", label: "Цели", icon: Target },
  { path: "/add", label: "Добавить", icon: PlusCircle },
  { path: "/shop", label: "Магазин", icon: ShoppingCart },
];

interface MainLayoutProps {
  children: React.ReactNode;
  onSignOut: () => void;
}

export default function MainLayout({ children, onSignOut }: MainLayoutProps) {
  const [location] = useLocation();
  const { coins, isSyncing } = useApp();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    onSignOut();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-[#060c1c]/90 backdrop-blur-md border-b border-blue-900/40 flex items-center justify-between px-4 py-4 shadow-sm">
        <span className="font-extrabold text-xl text-blue-50 tracking-tight">dHabits</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-900/40 px-3 py-1.5 rounded-full shadow-inner mr-1">
            <CoinDisplay amount={coins} size="sm" showLabel={true} />
            <div className={`transition-all duration-500 ${isSyncing ? "opacity-100 scale-100" : "opacity-30 scale-90"}`}>
              <Cloud className={`w-3.5 h-3.5 ${isSyncing ? "text-blue-400 animate-pulse" : "text-slate-500"}`} />
            </div>
          </div>
          <Link href="/settings">
            <button
              title="Настройки"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-blue-300 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-500/20"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Link>
          <button
            onClick={handleSignOut}
            title="Выйти"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-24 bg-[#020617]">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#060c1c]/95 backdrop-blur-xl border-t border-blue-900/40 safe-bottom">
        <div className="flex items-center justify-around px-2 py-3 max-w-lg mx-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location === path;
            return (
              <Link key={path} href={path}>
                <div
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 cursor-pointer min-w-[64px]
                    ${isActive
                      ? "text-blue-400 bg-blue-950/40"
                      : "text-slate-500 hover:text-blue-300 hover:bg-slate-800/50"
                    }`}
                >
                  <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-md" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[11px] font-medium leading-none ${isActive ? "font-bold" : ""}`}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
