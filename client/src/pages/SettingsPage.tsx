import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, RefreshCw, Cloud, Lock, ShieldAlert, Code } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { exportBackup, importBackup, isSyncing, syncWithCloud, forceSyncFromCloud } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importBackup(file);
    if (success) {
      toast.success("Бэкап импортирован! Перезагрузите страницу.");
    } else {
      toast.error("Ошибка импорта бэкапа.");
    }
  };

  const handleClearData = () => {
    if (confirm("Вы уверены? Все данные будут удалены безвозвратно!")) {
      localStorage.removeItem("dhabits_data");
      window.location.reload();
    }
  };

  const handleSync = async () => {
    try {
      await syncWithCloud();
      toast.success("Данные синхронизированы!");
    } catch (err) {
      toast.error("Ошибка синхронизации. Проверь интернет.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Пароль должен быть не менее 6 символов");
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Пароль успешно установлен!");
      setNewPassword("");
    }
    setPassLoading(false);
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto pb-24">
      <h2 className="text-3xl font-bold text-foreground">Настройки</h2>

      {/* Cloud Sync */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Cloud className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Облачная синхронизация</h3>
            <p className="text-muted-foreground text-xs">Подключите все устройства к вашему аккаунту</p>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm leading-relaxed">
          Ваши данные автоматически сохраняются в облаке. Если вы зашли с нового устройства, нажмите кнопку ниже, чтобы загрузить последние изменения.
        </p>

        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-6 rounded-xl transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Синхронизация..." : "Синхронизировать сейчас"}
        </Button>
      </div>

      {/* Diagnostics */}
      <div className="bg-card border border-amber-500/20 rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Диагностика синхронизации</h3>
            <p className="text-muted-foreground text-xs">Если данные не появляются на другом устройстве</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono italic">
              <span>USER ID:</span>
              <span className="text-slate-400 select-all">{userId || "загрузка..."}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono italic">
              <span>SYNC STATUS:</span>
              <span className={userId ? "text-green-500" : "text-red-500"}>{userId ? "ПОДКЛЮЧЕНО" : "ОШИБКА"}</span>
            </div>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed italic">
            Если синхронизация все равно не работает, возможно, база данных Supabase не настроена. Нажмите кнопку ниже, чтобы получить скрипт для починки.
          </p>

          <Button 
            variant="ghost" 
            onClick={() => setShowSql(!showSql)}
            className="w-full gap-2 text-amber-400 hover:text-amber-300 hover:bg-amber-400/5 rounded-xl text-xs h-10"
          >
            <Code className="w-4 h-4" />
            {showSql ? "Скрыть SQL скрипт" : "Показать SQL скрипт для починки"}
          </Button>

          {showSql && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[11px] text-slate-400">
                Скопируйте этот код и вставьте его в SQL Editor вашего проекта Supabase:
              </p>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto font-mono whitespace-pre select-all shadow-inner">
{`-- 1. Создание таблицы
create table if not exists public.user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 2. Включение безопасности
alter table public.user_data enable row level security;

-- 3. Настройка прав доступа (пересоздание политики)
drop policy if exists "Users can manage their own data" on public.user_data;
create policy "Users can manage their own data" 
  on public.user_data 
  for all 
  using (auth.uid() = user_id);

-- 4. Включение Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table user_data;`}
              </pre>
            </div>
          )}

          <div className="pt-2 space-y-4">
            <Button 
              onClick={forceSyncFromCloud} 
              disabled={isSyncing}
              variant="outline"
              className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl py-6"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              Принудительно загрузить из облака
            </Button>
            
            <div className="space-y-2">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">Журнал синхронизации</h4>
              <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 divide-y divide-slate-800/30 overflow-hidden">
                {useApp().syncLogs.length === 0 ? (
                  <div className="p-3 text-center text-[10px] text-slate-600 italic">Событий пока нет...</div>
                ) : (
                  useApp().syncLogs.map((log, i) => (
                    <div key={i} className="p-2.5 flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-slate-500 font-mono">{log.time}</span>
                        <span className={
                          log.status === 'success' ? "text-emerald-400" :
                          log.status === 'error' ? "text-red-400" :
                          "text-blue-400 animate-pulse"
                        }>{log.event}</span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        log.status === 'success' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" :
                        log.status === 'error' ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" :
                        "bg-blue-500 animate-pulse"
                      }`} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-2">
              (Внимание: сотрет текущие данные на ЭТОМ устройстве и заменит их на облачные)
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Lock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Безопасность</h3>
            <p className="text-muted-foreground text-xs">Установите пароль для быстрого входа без почты</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium ml-1">Новый пароль</label>
            <input 
              type="password" 
              placeholder="Минимум 6 символов" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            disabled={passLoading}
            variant="outline"
            className="w-full h-12 rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
          >
            {passLoading ? "Обновление..." : "Установить пароль"}
          </Button>
        </form>
      </div>

      {/* Data Management */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Управление данными</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Экспортируйте свои данные в JSON файл или импортируйте ранее созданный бэкап.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={exportBackup} variant="outline" className="gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            Экспорт бэкапа
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <Upload className="w-4 h-4" />
            Импорт бэкапа
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/20 rounded-lg p-6 space-y-4 shadow-sm">
        <h3 className="text-lg font-semibold text-destructive">Опасная зона</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Удалить все данные. Это действие невозможно отменить.
        </p>
        <Button onClick={handleClearData} variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl">
          <Trash2 className="w-4 h-4" />
          Очистить все данные
        </Button>
      </div>

      {/* About */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-2 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">О dHabits</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          dHabits — это геймифицированный трекер привычек. Версия 1.2.0
        </p>
      </div>
    </div>
  );
}
