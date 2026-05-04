import { Link, useLocation } from "wouter";
import { Home, Target, PlusCircle, ShoppingCart, LogOut, Settings, Cloud } from "lucide-react";
import CoinDisplay from "./CoinDisplay";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Сегодня", icon: Home },
  { path: "/goals", label: "Саморазвитие", icon: Target },
  { path: "/add", label: "Добавить", icon: PlusCircle },
  { path: "/shop", label: "Магазин", icon: ShoppingCart },
];

interface MainLayoutProps {
  children: React.ReactNode;
  onSignOut: () => void;
}

export default function MainLayout({ children, onSignOut }: MainLayoutProps) {
  const [location] = useLocation();
  const { coins, isSyncing, isOnline } = useApp();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    onSignOut();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="nav-blur px-3 py-3 shadow-sm flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="dHabits Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-[6px] sm:rounded-[8px] object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="font-black text-lg sm:text-xl text-blue-50 tracking-tighter hidden xs:inline-block">dHabits</span>
          </Link>
          
          <Link href="/identity">
            <button
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group"
            >
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-black text-purple-100 uppercase tracking-tight hidden xxs:inline-block">Identity</span>
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-950/40 border border-blue-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-inner overflow-hidden max-w-[100px] sm:max-w-none">
            <CoinDisplay amount={coins} size="sm" showLabel={false} />
            <div className="relative flex items-center justify-center flex-shrink-0">
              <Cloud className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-300 ${
                !isOnline ? "text-red-500 opacity-100" :
                isSyncing ? "text-blue-400 animate-pulse scale-110" :
                "text-emerald-400 opacity-80"
              }`} />
              {isOnline && !isSyncing && (
                <div className="absolute -top-0.5 -right-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full border border-[#060c1c] shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              )}
            </div>
          </div>
          <Link href="/settings">
            <button
              title="Настройки"
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-400 hover:text-blue-300 hover:bg-blue-400/10 transition-all border border-transparent"
            >
              <Settings className="w-4.5 h-4.5 sm:w-5 h-5" />
            </button>
          </Link>
          <button
            onClick={handleSignOut}
            title="Выйти"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-24 bg-background">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-2xl border-t border-white/5 safe-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
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
