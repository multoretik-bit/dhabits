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
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-bold text-foreground">Statistics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-accent">{completedToday}</div>
          <div className="text-sm text-muted-foreground mt-1">Completed Today</div>
          <div className="text-xs text-muted-foreground">of {totalHabits} total</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">💰 {coins}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Coins</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-orange-500">🔥 {longestStreak}</div>
          <div className="text-sm text-muted-foreground mt-1">Longest Streak</div>
          <div className="text-xs text-muted-foreground">avg: {avgStreak} days</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-500">{completedGoals}/{totalGoals}</div>
          <div className="text-sm text-muted-foreground mt-1">Goals Completed</div>
        </div>
      </div>

      {/* Last 7 Days */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Last 7 Days</h3>
        <div className="space-y-3">
          {dailyStats.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-10 text-sm text-muted-foreground font-medium">{day.label}</div>
              <div className="flex-1 bg-muted rounded-full h-4 relative overflow-hidden">
                <div
                  className="h-4 rounded-full bg-accent transition-all"
                  style={{ width: `${day.rate}%` }}
                />
              </div>
              <div className="w-24 text-sm text-muted-foreground text-right">
                {day.completed}/{day.scheduled} ({day.rate}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Habits by Streak */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Habit Streaks</h3>
        {habits.length === 0 ? (
          <p className="text-muted-foreground text-sm">No habits yet.</p>
        ) : (
          <div className="space-y-3">
            {[...habits]
              .sort((a, b) => b.streak - a.streak)
              .map((habit) => (
                <div key={habit.id} className="flex items-center gap-4 border-l-4 pl-4" style={{ borderLeftColor: habit.color }}>
                  <span className="text-xl">{habit.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{habit.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {habit.unitsTracking && `${habit.units} ${habit.progressUnit} tracked`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">🔥</span>
                    <span className="font-bold text-foreground">{habit.streak}</span>
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Goals Progress */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Goals Progress</h3>
        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No goals yet.</p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const range = goal.targetValue - goal.startValue;
              const progress = range > 0 ? ((goal.currentValue - goal.startValue) / range) * 100 : 0;
              const clampedProgress = Math.min(100, Math.max(0, progress));
              return (
                <div key={goal.id} className="space-y-2 border-l-4 pl-4" style={{ borderLeftColor: goal.color }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">{goal.currentValue} / {goal.targetValue}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${clampedProgress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">{Math.round(clampedProgress)}% complete</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
