import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, RefreshCw, Cloud, Lock, ShieldAlert, Code } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { exportBackup, importBackup, isSyncing, forceSyncFromCloud, forcePushToCloud } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importBackup(file);
    if (success) {
      toast.success("Бэкап импортирован!");
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
    <div className="p-5 sm:p-6 space-y-6 max-w-2xl mx-auto pb-28">
      {/* Page Header */}
      <div className="pt-2 pb-4">
        <h2 className="text-2xl font-bold text-foreground">Настройки</h2>
        <p className="text-sm text-muted-foreground mt-1">Управление данными и аккаунтом</p>
      </div>

      {/* Cloud Sync */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Cloud className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Синхронизация</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Управление данными в облаке</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Button 
              onClick={forcePushToCloud} 
              disabled={isSyncing}
              className="w-full h-13 gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
            >
              <Upload className={`w-5 h-5 ${isSyncing ? "animate-bounce" : ""}`} />
              Отправить в облако ⬆️
            </Button>
            <p className="text-[10px] text-muted-foreground text-center px-4">
              Заменит данные в облаке текущими данными с этого устройства.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/5">
            <Button 
              onClick={() => {
                if(confirm("Это сотрет текущие данные на ЭТОМ устройстве. Продолжить?")) {
                  forceSyncFromCloud();
                }
              }} 
              disabled={isSyncing}
              variant="outline"
              className="w-full h-13 gap-3 border-white/10 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              <Download className={`w-5 h-5 ${isSyncing ? "animate-bounce" : ""}`} />
              Загрузить из облака ⬇️
            </Button>
            <p className="text-[10px] text-muted-foreground text-center px-4">
              Скачает ваши последние данные из облака на это устройство.
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <Lock className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Безопасность</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Установите пароль для быстрого входа без почты</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium ml-1">Новый пароль</label>
            <input 
              type="password" 
              placeholder="Минимум 6 символов" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-slate-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            disabled={passLoading}
            variant="outline"
            className="w-full h-11 rounded-xl border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50 hover:text-violet-300 transition-all"
          >
            {passLoading ? "Обновление..." : "Установить пароль"}
          </Button>
        </form>
      </div>

      {/* Data Management */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-foreground">Управление данными</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Экспортируйте свои данные в JSON файл или импортируйте ранее созданный бэкап.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={exportBackup} variant="outline" className="gap-2 rounded-xl border-white/10 hover:border-white/20 hover:bg-white/5 text-foreground">
            <Download className="w-4 h-4" />
            Экспорт бэкапа
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2 rounded-xl border-white/10 hover:border-white/20 hover:bg-white/5 text-foreground"
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
      <div className="glass-card rounded-2xl p-5 space-y-4 border-red-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-base font-bold text-destructive">Опасная зона</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Это действие невозможно отменить</p>
          </div>
        </div>
        <Button onClick={handleClearData} variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 rounded-xl transition-all">
          <Trash2 className="w-4 h-4" />
          Очистить все данные
        </Button>
      </div>

      {/* About */}
      <div className="glass-card rounded-2xl p-5 space-y-2">
        <h3 className="text-base font-bold text-foreground">О dHabits</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          dHabits — геймифицированный трекер привычек. <span className="text-indigo-400 font-medium">Версия 1.2.0</span>
        </p>
      </div>
    </div>
  );
}
