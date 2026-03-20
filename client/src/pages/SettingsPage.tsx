import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2, RefreshCw, Cloud } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { exportBackup, importBackup } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await importBackup(file);
    if (success) {
      alert("Backup imported successfully! Reload the page to see changes.");
    } else {
      alert("Failed to import backup. Please check the file format.");
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear ALL data? This cannot be undone!")) {
      localStorage.removeItem("dhabits_data");
      window.location.reload();
    }
  };

  const { isSyncing, syncWithCloud } = useApp();

  const handleSync = async () => {
    try {
      await syncWithCloud();
      toast.success("Данные синхронизированы!");
    } catch (err) {
      toast.error("Ошибка синхронизации. Проверь интернет.");
    }
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

      {/* Data Management */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
        <p className="text-muted-foreground text-sm">
          Export your data as a JSON backup file, or import a previously exported backup.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={exportBackup} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Backup
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Backup
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
      <div className="bg-card border border-destructive/30 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <p className="text-muted-foreground text-sm">
          Permanently delete all your data. This action cannot be undone.
        </p>
        <Button onClick={handleClearData} variant="outline" className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </Button>
      </div>

      {/* About */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-2">
        <h3 className="text-lg font-semibold text-foreground">About dHabits</h3>
        <p className="text-muted-foreground text-sm">
          dHabits is a gamified habit tracker. Track your daily habits, set goals, earn coins, and spend them in the shop to customize your character.
        </p>
        <p className="text-muted-foreground text-sm">Version 1.0.0</p>
      </div>
    </div>
  );
}
