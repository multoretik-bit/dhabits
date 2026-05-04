import { useApp } from "@/contexts/AppContext";
import { getTodayDateString } from "@/contexts/AppContext";

export default function StatsPage() {
  const { habits, goals, coins } = useApp();

  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => {
    const today = getTodayDateString();
    return !!(h.completedDates && h.completedDates[today]);
  }).length;
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const avgStreak = totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  // Completion rate for the last 7 days
  const getLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    });
  };

  const last7Days = getLast7Days();
  const dailyStats = last7Days.map((dateStr) => {
    const dayOfWeek = new Date(dateStr).getDay();
    const scheduledHabits = habits.filter((h) => h.daysOfWeek.includes(dayOfWeek));
    const completedHabits = scheduledHabits.filter((h) => !!(h.completedDates && h.completedDates[dateStr]));
    return {
      date: dateStr,
      label: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }),
      scheduled: scheduledHabits.length,
      completed: completedHabits.length,
      rate: scheduledHabits.length > 0 ? Math.round((completedHabits.length / scheduledHabits.length) * 100) : 0,
    };
  });

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-4xl mx-auto pb-28">
      <div className="pt-2 pb-2">
        <h2 className="text-2xl font-bold text-foreground">Статистика</h2>
        <p className="text-sm text-muted-foreground mt-1">Анализ вашей продуктивности</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-indigo-400 mb-1">{completedToday}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Выполнено сегодня</div>
          <div className="text-[10px] text-slate-500 mt-0.5">из {totalHabits} всего</div>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 text-4xl font-black text-yellow-500 mb-1">
            <img src="/coin.png" alt="coin" className="w-8 h-8 object-contain" /> {coins}
          </div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Всего Монет</div>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-orange-500 mb-1 flex items-center justify-center gap-1">
            <span>🔥</span> {longestStreak}
          </div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Лучший стрик</div>
          <div className="text-[10px] text-slate-500 mt-0.5">в среднем: {avgStreak} дней</div>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-emerald-400 mb-1">{completedGoals}<span className="text-2xl text-slate-500">/{totalGoals}</span></div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Целей Достигнуто</div>
        </div>
      </div>

      {/* Last 7 Days */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-6">Последние 7 дней</h3>
        <div className="space-y-4">
          {dailyStats.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-12 text-xs text-muted-foreground font-black uppercase tracking-widest">{day.label}</div>
              <div className="flex-1 bg-white/5 border border-white/5 rounded-full h-3 relative overflow-hidden">
                <div
                  className="h-3 rounded-full bg-indigo-500 transition-all shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  style={{ width: `${day.rate}%` }}
                />
              </div>
              <div className="w-24 text-xs font-bold text-muted-foreground text-right">
                {day.completed}/{day.scheduled} <span className="text-indigo-400 ml-1">{day.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Habits by Streak */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-6">Стрики привычек</h3>
        {habits.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока нет привычек.</p>
        ) : (
          <div className="space-y-3">
            {[...habits]
              .sort((a, b) => b.streak - a.streak)
              .map((habit) => (
                <div key={habit.id} className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl transition-all hover:bg-white/10" style={{ borderLeft: `4px solid ${habit.color}` }}>
                  <span className="text-2xl bg-black/20 p-2 rounded-xl">{habit.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-foreground mb-0.5">{habit.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {habit.unitsTracking ? `${habit.units} ${habit.progressUnit} сегодня` : 'Обычная'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20">
                    <span className="text-orange-500 text-sm">🔥</span>
                    <span className="font-black text-orange-400">{habit.streak}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Goals Progress */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-6">Прогресс по Целям</h3>
        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока нет целей.</p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const range = goal.targetValue - goal.startValue;
              const progress = range > 0 ? ((goal.currentValue - goal.startValue) / range) * 100 : 0;
              const clampedProgress = Math.min(100, Math.max(0, progress));
              return (
                <div key={goal.id} className="space-y-2 bg-white/5 border border-white/5 p-4 rounded-2xl" style={{ borderLeft: `4px solid ${goal.color}` }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-foreground">{goal.name}</span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{goal.currentValue} / {goal.targetValue}</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all relative"
                      style={{ width: `${clampedProgress}%`, backgroundColor: goal.color, boxShadow: `0 0 10px ${goal.color}80` }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-right mt-1" style={{ color: goal.color }}>{Math.round(clampedProgress)}% выполнено</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
