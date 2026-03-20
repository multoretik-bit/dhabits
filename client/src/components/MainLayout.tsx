import { Link, useLocation } from "wouter";
import { Home, Target, PlusCircle, ShoppingCart } from "lucide-react";
import CoinDisplay from "./CoinDisplay";
import { useApp } from "@/contexts/AppContext";

const navItems = [
  { path: "/", label: "Сегодня", icon: Home },
  { path: "/goals", label: "Цели", icon: Target },
  { path: "/add", label: "Добавить", icon: PlusCircle },
  { path: "/shop", label: "Магазин", icon: ShoppingCart },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { coins } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-[#060c1c]/90 backdrop-blur-md border-b border-blue-900/40 flex items-center justify-between px-4 py-4 shadow-sm">
        <span className="font-extrabold text-xl text-blue-50 tracking-tight">dHabits</span>
        <div className="flex items-center gap-1.5 bg-blue-950/50 border border-blue-900/60 px-3 py-1.5 rounded-full shadow-inner">
          <CoinDisplay amount={coins} size="sm" showLabel={true} />
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
