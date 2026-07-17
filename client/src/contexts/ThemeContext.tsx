import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(defaultTheme: Theme, switchable: boolean): Theme {
  if (typeof window === "undefined") return defaultTheme;
  if (switchable) {
    const stored = window.localStorage.getItem("dhabits-theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(defaultTheme, switchable));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    if (switchable) window.localStorage.setItem("dhabits-theme", theme);
  }, [theme, switchable]);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    setTheme,
    toggleTheme: () => switchable && setTheme((current) => current === "light" ? "dark" : "light"),
    switchable,
  }), [theme, switchable]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
