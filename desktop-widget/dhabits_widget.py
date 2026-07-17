"""
dHabits Activity Widget

A small always-on-top desktop sidebar for Windows that tracks how you spend
your time in four categories: Работа, Учёба, Спорт and Бесполезное (idle).

Everything is local-only — no network calls, no dHabits account involved.
Data is stored in a JSON file next to this script (activity_data.json).

Run:
    pip install -r requirements.txt
    python dhabits_widget.py
"""

import json
import os
import sys
import tkinter as tk
from datetime import datetime, timedelta

try:
    from win11toast import toast
except ImportError:
    toast = None

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(APP_DIR, "activity_data.json")

CATEGORIES = [
    ("work", "Работа", "#3b82f6"),
    ("study", "Учёба", "#8100eb"),
    ("sport", "Спорт", "#06b6d4"),
    ("idle", "Бесполезное", "#dd5b5b"),
]
CATEGORY_LABELS = {key: label for key, label, _ in CATEGORIES}
CATEGORY_COLORS = {key: color for key, label, color in CATEGORIES}

IDLE_NOTIFY_THRESHOLD = timedelta(hours=2)
SLEEP_START_HOUR = 0
SLEEP_END_HOUR = 10
AUTOSAVE_INTERVAL_MS = 60_000  # persist partial minutes every 60s
TICK_INTERVAL_MS = 1000


def today_key(dt=None):
    return (dt or datetime.now()).strftime("%Y-%m-%d")


def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def save_data(data):
    tmp_path = DATA_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, DATA_FILE)


def is_sleep_window(dt=None):
    hour = (dt or datetime.now()).hour
    return SLEEP_START_HOUR <= hour < SLEEP_END_HOUR


def format_duration(delta: timedelta) -> str:
    total_seconds = int(delta.total_seconds())
    h, rem = divmod(total_seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


class ActivityWidget:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.data = load_data()

        self.current_category = "idle"
        self.session_start = datetime.now()  # when current category began (drives the notify streak)
        self.last_checkpoint = datetime.now()  # when we last credited minutes to storage
        self.idle_notified = False
        self.showing_activity = False

        self._build_ui()
        self._tick()

    # ---------------------------------------------------------------- UI --

    def _build_ui(self):
        self.root.title("dHabits Activity")
        self.root.configure(bg="#0f0b1a")
        self.root.attributes("-topmost", True)
        self.root.resizable(False, False)
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

        screen_w = self.root.winfo_screenwidth()
        self.root.geometry(f"230x360+{screen_w - 250}+60")

        header = tk.Label(
            self.root, text="dHabits Activity", fg="#e2e8f0", bg="#0f0b1a",
            font=("Segoe UI", 11, "bold"), pady=10
        )
        header.pack(fill="x")

        self.timer_label = tk.Label(
            self.root, text="00:00:00", fg="#f8fafc", bg="#0f0b1a",
            font=("Segoe UI", 22, "bold")
        )
        self.timer_label.pack(pady=(0, 2))

        self.mode_label = tk.Label(
            self.root, text=CATEGORY_LABELS["idle"], fg="#dd5b5b", bg="#0f0b1a",
            font=("Segoe UI", 12, "bold")
        )
        self.mode_label.pack(pady=(0, 12))

        self.buttons_frame = tk.Frame(self.root, bg="#0f0b1a")
        self.buttons_frame.pack(fill="x", padx=14)
        self.category_buttons = {}
        for key, label, color in CATEGORIES:
            btn = tk.Button(
                self.buttons_frame, text=label, fg="white", bg="#1c1730",
                activebackground=color, activeforeground="white",
                relief="flat", font=("Segoe UI", 10, "bold"), pady=8,
                command=lambda k=key: self.switch_category(k)
            )
            btn.pack(fill="x", pady=4)
            self.category_buttons[key] = btn

        self.toggle_btn = tk.Button(
            self.root, text="Показать активность за день", fg="#94a3b8", bg="#0f0b1a",
            activebackground="#0f0b1a", activeforeground="white", relief="flat",
            font=("Segoe UI", 9), command=self._toggle_activity_view
        )
        self.toggle_btn.pack(pady=(14, 4))

        self.activity_frame = tk.Frame(self.root, bg="#0f0b1a")
        self.activity_rows = {}
        for key, label, color in CATEGORIES:
            row = tk.Label(
                self.activity_frame, text=f"{label}: 0 мин", fg=color, bg="#0f0b1a",
                font=("Segoe UI", 10, "bold"), anchor="w"
            )
            row.pack(fill="x", padx=18, pady=3)
            self.activity_rows[key] = row

        self._refresh_buttons()

    def _refresh_buttons(self):
        for key, btn in self.category_buttons.items():
            btn.configure(bg=CATEGORY_COLORS[key] if key == self.current_category else "#1c1730")
        self.mode_label.configure(
            text=CATEGORY_LABELS[self.current_category],
            fg=CATEGORY_COLORS[self.current_category]
        )

    def _toggle_activity_view(self):
        self.showing_activity = not self.showing_activity
        if self.showing_activity:
            self.buttons_frame.pack_forget()
            self._render_activity()
            self.activity_frame.pack(fill="x", padx=14, pady=(0, 10))
            self.toggle_btn.configure(text="Назад к переключателю")
        else:
            self.activity_frame.pack_forget()
            self.buttons_frame.pack(fill="x", padx=14)
            self.toggle_btn.configure(text="Показать активность за день")

    def _render_activity(self):
        totals = dict(self.data.get(today_key(), {}))
        pending = self._pending_minutes()
        totals[self.current_category] = totals.get(self.current_category, 0) + pending
        for key, label, color in CATEGORIES:
            minutes = round(totals.get(key, 0))
            self.activity_rows[key].configure(text=f"{label}: {minutes} мин")

    # ------------------------------------------------------------ logic --

    def _pending_minutes(self) -> float:
        """Minutes elapsed in the current category since the last checkpoint (not yet persisted)."""
        return (datetime.now() - self.last_checkpoint).total_seconds() / 60.0

    def _checkpoint(self):
        """Credit elapsed minutes for the current category to today's totals."""
        now = datetime.now()
        minutes = (now - self.last_checkpoint).total_seconds() / 60.0
        if minutes > 0:
            day = today_key()
            self.data.setdefault(day, {})
            self.data[day][self.current_category] = self.data[day].get(self.current_category, 0) + minutes
            save_data(self.data)
        self.last_checkpoint = now

    def switch_category(self, key: str):
        if key == self.current_category:
            return
        self._checkpoint()
        self.current_category = key
        self.session_start = datetime.now()
        self.idle_notified = False
        self._refresh_buttons()
        if self.showing_activity:
            self._render_activity()

    def _maybe_notify_idle(self):
        if self.current_category != "idle" or self.idle_notified:
            return
        if is_sleep_window():
            return
        elapsed = datetime.now() - self.session_start
        if elapsed >= IDLE_NOTIFY_THRESHOLD:
            self.idle_notified = True
            self._send_notification(
                "Слишком много бесполезного времени",
                "Уже больше 2 часов подряд в режиме «Бесполезное». Переключитесь на работу, учёбу или спорт."
            )

    def _send_notification(self, title: str, message: str):
        if toast is not None:
            try:
                toast(title, message, duration="short")
                return
            except Exception:
                pass
        # Fallback: a simple message box if win11toast isn't available/fails.
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, message, title, 0x40)
        except Exception:
            print(f"[NOTIFY] {title}: {message}")

    def _tick(self):
        elapsed = datetime.now() - self.session_start
        self.timer_label.configure(text=format_duration(elapsed))
        self._maybe_notify_idle()

        if (datetime.now() - self.last_checkpoint).total_seconds() * 1000 >= AUTOSAVE_INTERVAL_MS:
            self._checkpoint()
            if self.showing_activity:
                self._render_activity()

        self.root.after(TICK_INTERVAL_MS, self._tick)

    def _on_close(self):
        self._checkpoint()
        self.root.destroy()


def main():
    if sys.platform != "win32":
        print("Этот виджет рассчитан на Windows (уведомления и автозапуск специфичны для Windows).")
    root = tk.Tk()
    ActivityWidget(root)
    root.mainloop()


if __name__ == "__main__":
    main()
