import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Target, ArrowUp, ArrowDown, LayoutGrid, ListTodo } from "lucide-react";
import { useApp, Goal, getTodayDateString, HabitFolder, Habit } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";
import HabitRow from "@/components/HabitRow";

function UnifiedCoinBadge({ coins, color, label }: { coins: number; color: string; label?: string }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl text-center shadow-sm"
      style={{ backgroundColor: `${color}25`, border: `1px solid ${color}40` }}
    >
      <img src="/coin.png" alt="coin" className="w-3.5 h-3.5 object-contain mb-0.5" />
      <span className="text-[10px] font-bold text-white leading-tight mt-0.5">{coins}{label ? `/${label}` : ''}</span>
    </div>
  );
}

export default function GoalsPage() {
  const { goals, goalFolders, habits, habitFolders, updateGoal, toggleGoalFolderCollapse, toggleHabitFolderCollapse, moveGoalUp, moveGoalDown, moveGoalFolderUp, moveGoalFolderDown } = useApp();
  const [activeTab, setActiveTab] = useState<'goals' | 'habits'>('goals');

  // Progress update state
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleName = (id: string) => setExpandedItems(p => ({...p, [id]: !p[id]}));

  const dateStr = getTodayDateString();
  const now = new Date();
  const dayOfWeek = now.getDay();

  const handleOpenUpdateProgress = (goal: Goal) => {
    setUpdatingGoalId(goal.id);
    setProgressValue("");
    setShowUpdateProgress(true);
  };

  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (updatingGoalId) {
      const goal = goals.find((g) => g.id === updatingGoalId);
      if (goal) {
        const addValue = parseFloat(progressValue) || 0;
        const newValue = goal.currentValue + addValue;
        const isCompleted = newValue >= goal.targetValue;
        updateGoal(updatingGoalId, { currentValue: newValue, completed: isCompleted });
      }
      setShowUpdateProgress(false);
      setUpdatingGoalId(null);
      setProgressValue("");
    }
  };

  const habitsForToday = useMemo(() => {
    return habits.filter((h: Habit) => h.daysOfWeek.includes(dayOfWeek));
  }, [habits, dayOfWeek]);

  const generalGoals = goals.filter((g: Goal) => g.folder === "general");
  const hasGeneralGoals = generalGoals.length > 0;

  const renderGoalsItems = (folderGoals: Goal[]) => (
    <div className="p-3 space-y-3">
      {folderGoals.length === 0 ? (
        <div className="px-6 py-6 text-slate-600 text-sm text-center italic">В этой папке пока нет целей</div>
      ) : (
        folderGoals.map((goal) => {
          const range = goal.targetValue - goal.startValue;
          const progress = range > 0 ? ((goal.currentValue - goal.startValue) / range) * 100 : 0;
          const clampedProgress = Math.min(100, Math.max(0, progress));
          const linkedHabitNames = (goal.linkedHabits || [])
            .map((hId: string) => habits.find((h: Habit) => h.id === hId))
            .filter(Boolean)
            .map((h: any) => h!.name);

          return (
            <div
              key={goal.id}
              className={`relative overflow-hidden group rounded-3xl border border-slate-800/80 bg-slate-950/40 transition-all ${goal.completed ? "opacity-60" : "hover:bg-slate-900/60"}`}
              style={{ borderLeft: `4px solid ${goal.color}` }}
            >
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity"
                style={{ background: `linear-gradient(90deg, ${goal.color} 0%, transparent 100%)` }}
              />

              <div className="relative z-10 p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UnifiedCoinBadge coins={goal.coins} color={goal.color} />
                    <span 
                      className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${goal.color}22` }}
                    >
                      {goal.emoji || "🎯"}
                    </span>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleName(goal.id); }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-bold text-slate-100 ${expandedItems[goal.id] ? "" : "truncate"} ${goal.completed ? "line-through text-slate-400" : ""}`}>
                          {goal.name}
                        </h4>
                        {goal.completed && (
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0">Завершено</span>
                        )}
                      </div>
                      <p 
                        className={`text-[10px] text-slate-500 font-medium uppercase tracking-tight mt-1 ${expandedItems[goal.id + '_desc'] ? "" : "truncate"}`}
                        onClick={(e) => { e.stopPropagation(); toggleName(goal.id + '_desc'); }}
                      >
                        {goal.description || "Нет описания"}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenUpdateProgress(goal)}
                    className="h-10 w-10 flex flex-col items-center justify-center gap-0.5 text-blue-400 hover:bg-blue-400/10 rounded-xl"
                  >
                    <Target className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase">Шаг</span>
                  </Button>
                  
                  <div className="flex flex-col gap-1 pr-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveGoalUp(goal.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveGoalDown(goal.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end text-[10px] font-bold tracking-wider uppercase">
                    <span className="text-slate-500">{goal.currentValue} / {goal.targetValue}</span>
                    <span style={{ color: goal.color }}>{Math.round(clampedProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-slate-800/40 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${clampedProgress}%`,
                        backgroundColor: goal.color,
                        boxShadow: `0 0 8px ${goal.color}66`
                      }}
                    />
                  </div>
                </div>

                {linkedHabitNames.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/40">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="opacity-50">🔗</span> {linkedHabitNames.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderGoalsList = () => (
    <div className="space-y-6">
      {/* General Goals */}
      {(hasGeneralGoals || goalFolders.length <= 1) && (
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-sm">
          <div className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/40">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              🏆 Общие цели
            </h3>
          </div>
          {renderGoalsItems(generalGoals)}
        </div>
      )}

      {/* Custom Folders */}
      {goalFolders.filter(f => f.id !== "general").map((folder: any) => {
        const folderGoals = goals.filter((g: Goal) => g.folder === folder.id);
        return (
          <div key={folder.id} className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-sm">
            <div 
              className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/40 cursor-pointer flex justify-between items-center transition-colors hover:bg-slate-800/50"
              onClick={() => toggleGoalFolderCollapse(folder.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: folder.color }} />
                <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
                  {folder.emoji || "🏆"} {folder.name}
                </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-800/60">{folderGoals.length}</span>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" onClick={() => moveGoalFolderUp(folder.id)} className="w-8 h-8 text-slate-500 hover:text-blue-400"><ArrowUp className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => moveGoalFolderDown(folder.id)} className="w-8 h-8 text-slate-500 hover:text-blue-400"><ArrowDown className="w-4 h-4" /></Button>
                <div className="text-slate-500 ml-2">
                  {folder.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>
            </div>
            {!folder.collapsed && renderGoalsItems(folderGoals)}
          </div>
        );
      })}

      {goals.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 shadow-2xl">
            <Target className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Начни достигать!</h3>
          <p className="text-sm text-slate-500 leading-relaxed px-4">
            Поставь свою первую масштабную цель во вкладке <span className="text-blue-400 font-bold">Управление</span> и двигайся к ней каждый день.
          </p>
        </div>
      )}
    </div>
  );

  const renderHabitsList = () => {
    const foldersToRender = habitFolders.map((folder: HabitFolder) => {
      const folderHabits = habitsForToday.filter((h: Habit) => h.folder === folder.id);
      return { ...folder, habits: folderHabits };
    });


    return (
      <div className="space-y-6">
        {foldersToRender.map(folder => (
          <div key={folder.id} className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-sm">
            <div 
              className="bg-slate-800/30 px-5 py-3 border-b border-slate-800/40 cursor-pointer flex justify-between items-center transition-colors hover:bg-slate-800/50"
              onClick={() => toggleHabitFolderCollapse(folder.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: folder.color }} />
                <h3 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
                  {folder.emoji || "📁"} {folder.name}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-800/60">{folder.habits.length}</span>
              </div>
              <div className="text-slate-500">
                {folder.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </div>
            {!folder.collapsed && (
              <div className="p-3 space-y-2">
                {folder.habits.map(h => (
                  <HabitRow key={h.id} habit={h} dateStr={dateStr} />
                ))}
                {folder.habits.length === 0 && (
                  <div className="px-6 py-4 text-slate-600 text-xs text-center italic">Нет привычек на сегодня в этой папке</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-5 pt-8 pb-32 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-500" />
          {activeTab === 'goals' ? 'Мои Цели' : 'Мои Привычки'}
        </h2>
        <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">
            {activeTab === 'goals' ? 'Твой путь к успеху' : 'Личный прогресс каждый день'}
        </p>
      </div>

      {/* Toggle */}
      <div className="flex p-1 bg-slate-900/80 border border-slate-800/60 rounded-2xl mb-8 relative z-10">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest
            ${activeTab === 'goals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Target className="w-3.5 h-3.5" />
          Цели
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest
            ${activeTab === 'habits' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Привычки
        </button>
      </div>

      <div className="relative z-10">
        {activeTab === 'goals' ? renderGoalsList() : renderHabitsList()}
      </div>

      {/* Update Progress Modal */}
      <FormModal
        title="Обновить прогресс"
        isOpen={showUpdateProgress}
        onClose={() => { setShowUpdateProgress(false); setUpdatingGoalId(null); setProgressValue(""); }}
        onSubmit={handleUpdateProgress}
        submitText="Записать успех"
      >
        {updatingGoalId && (() => {
          const goal = goals.find((g) => g.id === updatingGoalId);
          if (!goal) return null;
          return (
            <div className="space-y-5">
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Target className="w-20 h-20" />
                 </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Цель достигнута на:</p>
                <p className="text-xl font-black text-white uppercase tracking-tighter mb-4">{goal.name}</p>
                
                <div className="flex justify-center gap-8 mb-2">
                   <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Текущий</p>
                      <p className="text-lg font-black text-blue-400 leading-tight">{goal.currentValue}</p>
                   </div>
                   <div className="w-px h-8 bg-slate-800/60 mt-2" />
                   <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Осталось</p>
                      <p className="text-lg font-black text-slate-300 leading-tight">{Math.max(0, goal.targetValue - goal.currentValue)}</p>
                   </div>
                </div>
              </div>
              <FormInput
                label="Добавить (например, 5 единиц)"
                value={progressValue}
                onChange={setProgressValue}
                type="number"
                placeholder="5"
              />
            </div>
          );
        })()}
      </FormModal>
    </div>
  );
}
