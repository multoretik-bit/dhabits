import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, Inbox, Lock, Key, FlaskConical } from "lucide-react";

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password" | "signup" | "sent">("email");
  const [loading, setLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Введите email");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("rate limit")) {
        toast.error("Лимит писем исчерпан. Используйте вход по паролю!");
      } else {
        toast.error(error.message);
      }
    } else {
      setStep("sent");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Введите email и пароль");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Ошибка входа: " + error.message);
    } else {
      onLogin();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Введите email и пароль");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    setLoading(false);
    if (error) {
      toast.error("Ошибка регистрации: " + error.message);
    } else {
      toast.success("Регистрация успешна! Проверьте почту для подтверждения.");
      setStep("sent");
    }
  };

  // Skip auth for emergency login
  const handleSkip = () => {
    toast.success("Вход пропущен для теста");
    onLogin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center gap-5 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full scale-150" />
              <img src="/logo.png" alt="dHabits Logo" className="relative w-20 h-20 rounded-2xl object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">dHabits</h1>
          </div>
          <p className="text-muted-foreground text-sm">Войдите, чтобы синхронизировать данные</p>
        </div>

        <div className="glass-morphism rounded-3xl p-7 shadow-2xl relative overflow-hidden">
          {/* Subtle glow inside card */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/8 blur-[60px] rounded-full pointer-events-none" />
          
          {step === "email" && (
            <form onSubmit={handleSendLink} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email адрес</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-indigo-500/60 transition-colors placeholder:text-slate-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full premium-gradient rounded-xl h-12 font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Отправить ссылку →"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("password")}
                className="w-full text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-2 pt-2"
              >
                <Lock className="w-3.5 h-3.5" /> Уже есть аккаунт и пароль? Войти
              </button>
              <button
                type="button"
                onClick={() => setStep("signup")}
                className="w-full text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5" /> Создать аккаунт с паролем
              </button>
            </form>
          )}

          {step === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-slate-300 text-sm font-medium">Email адрес</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-indigo-500/60 transition-colors placeholder:text-slate-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-slate-300 text-sm font-medium">Придумайте пароль</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-indigo-500/60 transition-colors placeholder:text-slate-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full premium-gradient rounded-xl h-12 font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Зарегистрироваться"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-slate-400 text-sm hover:text-white transition-colors"
              >
                ← Назад к входу по ссылке
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="email-password" className="text-slate-300 text-sm font-medium">Email адрес</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email-password"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-indigo-500/60 transition-colors placeholder:text-slate-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Пароль</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-12 focus:border-indigo-500/60 transition-colors placeholder:text-slate-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full premium-gradient rounded-xl h-12 font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-slate-400 text-sm hover:text-white transition-colors"
              >
                ← К магической ссылке
              </button>
            </form>
          )}

          {step === "sent" && (
            <div className="space-y-5 text-center relative z-10">
              <Inbox className="w-12 h-12 text-green-400 mx-auto" />
              <h2 className="text-white font-bold text-lg">Письмо отправлено!</h2>
              <p className="text-slate-400 text-sm">Проверьте {email} и папку спам.</p>
              <button onClick={() => setStep("email")} className="text-blue-400 text-sm">Попробовать еще раз</button>
            </div>
          )}
        </div>

        {/* Emergency SKIP Button for testing design */}
        <div className="mt-8 text-center pt-8 border-t border-white/5">
           <Button 
            onClick={handleSkip} 
            variant="ghost" 
            className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl gap-2"
           >
             <FlaskConical className="w-4 h-4" /> 
             Пропустить вход (Тест дизайна)
           </Button>
           <p className="text-[10px] text-slate-600 mt-2 px-6 italic">
             Используй если письма не приходят, чтобы увидеть как выглядят монетки и огоньки
           </p>
        </div>
      </div>
    </div>
  );
}
