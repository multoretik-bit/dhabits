import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Cloud,
  Home,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import CoinDisplay from "./CoinDisplay";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { path: "/", label: "Сегодня", description: "Фокус дня", icon: Home },
  { path: "/goals", label: "Саморазвитие", description: "Цели и привычки", icon: Target },
  { path: "/add", label: "Добавить", description: "Управление", icon: Plus },
  { path: "/profile", label: "Профиль", description: "Состояние и награды", icon: UserRound },
] as const;

function NavLink({ path, label, description, icon: Icon, compact = false }: (typeof navItems)[number] & { compact?: boolean }) {
  const [location] = useLocation();
  const active = location === path;
  return (
    <Link href={path} className={cn("app-nav-link", active && "is-active", compact && "is-compact")}>
      {active && !compact && <motion.span layoutId="side-nav-active" transition={spring.snappy} className="app-nav-active" />}
      <Icon className="app-nav-icon" strokeWidth={active ? 2.4 : 2} />
      <span className="app-nav-copy">
        <span className="app-nav-label">{label}</span>
        {!compact && <span className="app-nav-description">{description}</span>}
      </span>
    </Link>
  );
}

export default function MainLayout({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  const [location] = useLocation();
  const { coins, isSyncing, isOnline } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routeName = location === "/" ? "home" : location.replace(/^\//, "").replace(/\//g, "-") || "home";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    onSignOut();
  };

  return (
    <div className={cn("app-shell", `app-route-${routeName}`)}>
      <aside className={cn("app-sidebar", mobileMenuOpen && "is-open")}>
        <div className="app-brand-row">
          <Link href="/" className="app-brand" onClick={() => setMobileMenuOpen(false)}>
            <img src="/logo.png" alt="dHabits" className="app-brand-logo" />
            <span>dHabits</span>
          </Link>
          <button className="icon-button app-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Закрыть меню">
            <X className="size-5" />
          </button>
        </div>

        <nav className="app-side-nav" aria-label="Основная навигация">
          {navItems.map((item) => <NavLink key={item.path} {...item} />)}
        </nav>

        <div className="app-sidebar-footer">
          <Link href="/identity" className="identity-card">
            <div className="identity-icon"><UserRound className="size-5" /></div>
            <div>
              <span className="identity-title">Моя идентичность</span>
              <span className="identity-caption">Ценности и системы</span>
            </div>
          </Link>
          <p className="app-version">dHabits · персональная система роста</p>
        </div>
      </aside>

      {mobileMenuOpen && <button className="app-menu-overlay" onClick={() => setMobileMenuOpen(false)} aria-label="Закрыть меню" />}

      <div className="app-workspace">
        <header className="app-topbar">
          <button className="icon-button app-menu-open" onClick={() => setMobileMenuOpen(true)} aria-label="Открыть меню">
            <Menu className="size-5" />
          </button>
          <div className="app-topbar-spacer" />
          <div className="balance-pill" title="Баланс монет">
            <CoinDisplay amount={coins} size="sm" />
            <Cloud
              className={cn(
                "size-4 transition-colors",
                !isOnline ? "text-destructive" : isSyncing ? "animate-pulse text-amber-500" : "text-emerald-500",
              )}
            />
          </div>
          <button className="icon-button" onClick={toggleTheme} aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}>
            {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>
          <Link href="/settings" className="icon-button" aria-label="Настройки"><Settings className="size-5" /></Link>
          <button className="icon-button subtle-danger" onClick={handleSignOut} aria-label="Выйти"><LogOut className="size-5" /></button>
        </header>

        <main className="app-content">{children}</main>
      </div>

      <nav className="app-bottom-nav" aria-label="Навигация на мобильном устройстве">
        {navItems.map((item) => <NavLink key={item.path} {...item} compact />)}
      </nav>
    </div>
  );
}
