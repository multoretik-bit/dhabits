# Adds a shortcut to the current user's Startup folder so the widget
# launches automatically when Windows starts (no console window).
# Run this once from PowerShell: .\install_autostart.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonwPath = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source
if (-not $PythonwPath) {
    $PythonwPath = (Get-Command python.exe).Source -replace 'python\.exe$', 'pythonw.exe'
}

$StartupDir = [Environment]::GetFolderPath("Startup")
$ShortcutPath = Join-Path $StartupDir "dHabits Activity Widget.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $PythonwPath
$Shortcut.Arguments = "`"$ScriptDir\dhabits_widget.py`""
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "dHabits Activity Widget"
$Shortcut.Save()

Write-Host "Готово: ярлык создан в $ShortcutPath"
Write-Host "Виджет будет запускаться автоматически при входе в Windows."
