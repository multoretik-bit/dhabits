import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

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

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-bold text-foreground">Settings</h2>

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
