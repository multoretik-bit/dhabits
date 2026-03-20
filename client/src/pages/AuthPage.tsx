import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "token">("email");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Введите email");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Код отправлен! Проверьте почту (и папку спам)");
      setStep("token");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Введите код из письма");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      toast.error("Неверный или устаревший код. Попробуйте снова.");
    } else {
      toast.success("Вход выполнен!");
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">dHabits</h1>
          <p className="text-slate-400 text-sm">Синхронизация между устройствами</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email адрес</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-medium transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Получить код →"}
              </Button>
              <p className="text-center text-slate-500 text-xs">
                Мы отправим 6-значный код на вашу почту
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center gap-2 text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3 mb-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm">Код отправлен на <span className="font-semibold">{email}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token" className="text-slate-300 text-sm font-medium">Код из письма</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    className="pl-10 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl h-12 text-center text-2xl tracking-[0.5em] font-mono"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="text-slate-500 text-xs">Проверьте папку «Спам», если не пришло</p>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-medium transition-all"
                disabled={loading || token.length < 6}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
              </Button>
              <button
                type="button"
                className="w-full text-slate-400 hover:text-slate-200 text-sm transition-colors"
                onClick={() => { setStep("email"); setToken(""); }}
              >
                ← Изменить email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
