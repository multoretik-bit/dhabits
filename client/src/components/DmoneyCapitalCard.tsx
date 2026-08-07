import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Landmark, Link2, LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { createClient, type Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";

const DMONEY_URL = "https://fzabpzvsgshbdoahcjnn.supabase.co";
const DMONEY_ANON_KEY = "sb_publishable_0V-3elqKTI4tTt2xUTV1SA_Vn0idaMx";
const DMONEY_SITE_URL = "https://dmoney-iuq58wyx0-multoretik-4608s-projects.vercel.app";

const dmoney = createClient(DMONEY_URL, DMONEY_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "dhabits-dmoney-auth",
  },
});

interface WalletRow {
  balance: number | string | null;
  currency: string | null;
}

let ratesCache: { baseCurrency: string; rates: Record<string, number>; expiresAt: number } | null = null;

async function calculateCapital(wallets: WalletRow[], baseCurrency: string) {
  if (!wallets.length) return 0;
  const hasForeignCurrency = wallets.some(wallet => (wallet.currency || baseCurrency) !== baseCurrency);
  let rates: Record<string, number> = { [baseCurrency]: 1 };

  if (hasForeignCurrency) {
    if (ratesCache?.baseCurrency === baseCurrency && ratesCache.expiresAt > Date.now()) {
      rates = ratesCache.rates;
    } else {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) throw new Error("Не удалось получить курсы валют");
      const payload = await response.json();
      const nextRates = payload?.rates as Record<string, number> | undefined;
      if (!nextRates) throw new Error("Курсы валют временно недоступны");
      rates = nextRates;
      ratesCache = { baseCurrency, rates, expiresAt: Date.now() + 5 * 60_000 };
    }
  }

  return wallets.reduce((total, wallet) => {
    const amount = Number(wallet.balance || 0);
    const currency = wallet.currency || baseCurrency;
    const rate = currency === baseCurrency ? 1 : Number(rates[currency]);
    return total + (Number.isFinite(rate) && rate > 0 ? amount / rate : 0);
  }, 0);
}

export default function DmoneyCapitalCard() {
  const [session, setSession] = useState<Session | null>(null);
  const [capital, setCapital] = useState<number | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [walletCount, setWalletCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const refreshCapital = useCallback(async (activeSession?: Session | null) => {
    const currentSession = activeSession ?? (await dmoney.auth.getSession()).data.session;
    if (!currentSession) {
      setCapital(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [walletResult, preferencesResult] = await Promise.all([
      dmoney.from("wallets").select("balance,currency"),
      dmoney.from("user_preferences").select("base_currency").eq("user_id", currentSession.user.id).maybeSingle(),
    ]);

    if (walletResult.error) {
      setIsLoading(false);
      toast.error("Не получилось обновить капитал из Dmoney");
      return;
    }

    try {
      const nextCurrency = preferencesResult.data?.base_currency || "USD";
      const wallets = (walletResult.data || []) as WalletRow[];
      const nextCapital = await calculateCapital(wallets, nextCurrency);
      setCurrency(nextCurrency);
      setWalletCount(wallets.length);
      setCapital(nextCapital);
      setUpdatedAt(new Date());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не получилось пересчитать капитал");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void dmoney.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void refreshCapital(data.session);
    });
    const { data: { subscription } } = dmoney.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void refreshCapital(nextSession);
    });
    return () => subscription.unsubscribe();
  }, [refreshCapital]);

  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => void refreshCapital(session), 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshCapital(session);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = dmoney
      .channel(`dhabits-capital-${session.user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${session.user.id}` }, () => void refreshCapital(session))
      .subscribe();

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      void dmoney.removeChannel(channel);
    };
  }, [refreshCapital, session]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    const { data, error } = await dmoney.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error("Не удалось войти в Dmoney. Проверьте почту и пароль");
      return;
    }
    setPassword("");
    setIsLoginOpen(false);
    setSession(data.session);
    await refreshCapital(data.session);
    toast.success("Dmoney подключён");
  };

  const disconnect = async () => {
    await dmoney.auth.signOut();
    setSession(null);
    setCapital(null);
    setUpdatedAt(null);
  };

  return (
    <>
      <article className="profile-metric-card is-capital">
        <div className="profile-metric-top">
          <span className="profile-metric-icon"><Landmark className="size-5" /></span>
          <div><span>Мой капитал</span><small>{session ? `${walletCount} счетов · Dmoney` : "Подключите Dmoney"}</small></div>
          {session && <button type="button" className="icon-button is-small" onClick={() => void refreshCapital(session)} aria-label="Обновить капитал"><RefreshCw className={`size-3.5 ${isLoading ? "is-spinning" : ""}`} /></button>}
        </div>
        {session ? (
          <div className="profile-metric-value">
            {isLoading && capital === null ? <LoaderCircle className="size-6 is-spinning" /> : <strong>{(capital ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} <small>{currency}</small></strong>}
            <span>{updatedAt ? `Обновлено в ${updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Обновляем данные"}</span>
          </div>
        ) : (
          <button type="button" className="app-button metric-connect-button" onClick={() => setIsLoginOpen(true)}><Link2 className="size-4" /> Подключить</button>
        )}
        <div className="profile-metric-links">
          <a href={DMONEY_SITE_URL} target="_blank" rel="noreferrer">Открыть Dmoney <ArrowUpRight className="size-3.5" /></a>
          {session && <button type="button" onClick={() => void disconnect()}><LogOut className="size-3.5" /> Отключить</button>}
        </div>
      </article>

      <FormModal title="Подключить Dmoney" isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSubmit={handleLogin} submitText="Подключить капитал">
        <p className="dmoney-login-hint">Войдите в аккаунт Dmoney один раз. Пароль отправляется напрямую в Dmoney и не сохраняется в D.habits.</p>
        <FormInput label="Почта Dmoney" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
        <FormInput label="Пароль Dmoney" value={password} onChange={setPassword} type="password" />
      </FormModal>
    </>
  );
}
