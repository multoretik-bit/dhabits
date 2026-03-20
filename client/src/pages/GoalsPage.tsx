import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { useApp, Goal } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";

export default function GoalsPage() {
  const { goals, goalFolders, habits, updateGoal, toggleGoalFolderCollapse } = useApp();

  // Progress update state
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");

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

  const renderGoals = (folderGoals: Goal[]) => (
    <div className="divide-y divide-slate-800/60">
      {folderGoals.length === 0 ? (
        <div className="px-6 py-4 text-slate-500 text-sm">В этой папке нет целей</div>
      ) : (
        folderGoals.map((goal) => {
          const range = goal.targetValue - goal.startValue;
          const progress = range > 0 ? ((goal.currentValue - goal.startValue) / range) * 100 : 0;
          const clampedProgress = Math.min(100, Math.max(0, progress));
          const linkedHabitNames = (goal.linkedHabits || [])
            .map((hId) => habits.find((h) => h.id === hId))
            .filter(Boolean)
            .map((h) => h!.name);

          return (
            <div
              key={goal.id}
              className={`px-5 py-5 border-l-4 transition-all ${goal.completed ? "opacity-60 bg-slate-900/30" : "bg-slate-900/60 hover:bg-slate-800/40"}`}
              style={{ borderLeftColor: goal.color }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-slate-200 ${goal.completed ? "line-through text-slate-400" : ""}`}>
                      {goal.name}
                    </h4>
                    {goal.completed && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Выполнено</span>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-sm text-slate-400 mb-2">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-4 flex-wrap">
                    <span className="bg-slate-800/80 px-2 py-1 rounded-md">💰 {goal.coins}</span>
                    <span className="bg-slate-800/80 px-2 py-1 rounded-md">📊 {goal.currentValue} / {goal.targetValue}</span>
                    {linkedHabitNames.length > 0 && (
                      <span className="bg-slate-800/80 px-2 py-1 rounded-md">🔗 {linkedHabitNames.join(", ")}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold tracking-wide text-slate-400">
                      <span>{goal.startValue}</span>
                      <span>{Math.round(clampedProgress)}%</span>
                      <span>{goal.targetValue}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${clampedProgress}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenUpdateProgress(goal)}
                    className="gap-1.5 text-blue-400 border-blue-900 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm"
                  >
                    <Target className="w-4 h-4" /> Шаг
                  </Button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const generalGoals = goals.filter((g) => g.folder === "general");
  const hasGeneralGoals = generalGoals.length > 0;

  return (
    <div className="px-5 pt-8 pb-4 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Цели</h2>
      </div>

      <div className="space-y-4">
        {/* General Goals */}
        {(hasGeneralGoals || goalFolders.length === 0) && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
            <div className="bg-slate-800/40 px-5 py-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold tracking-wide text-slate-300 uppercase">Общие</h3>
            </div>
            {renderGoals(generalGoals)}
          </div>
        )}

        {/* Custom Folders */}
        {goalFolders.map((folder) => {
          const folderGoals = goals.filter((g) => g.folder === folder.id);
          return (
            <div key={folder.id} className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
              <div 
                className="bg-slate-800/40 px-5 py-3 border-b border-slate-800/80 cursor-pointer flex justify-between items-center transition-colors hover:bg-slate-800/60"
                onClick={() => toggleGoalFolderCollapse(folder.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: folder.color }} />
                  <h3 className="text-sm font-bold tracking-wide text-slate-300 uppercase">{folder.name}</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">{folderGoals.length}</span>
                </div>
                <div className="text-slate-400">
                  {folder.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>
              {!folder.collapsed && renderGoals(folderGoals)}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-10 text-center shadow-sm mt-4">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Нет целей</h3>
            <p className="text-sm text-slate-400">Перейдите во вкладку 'Управление', чтобы поставить первую цель!</p>
          </div>
        )}
      </div>

      {/* Update Progress Modal */}
      <FormModal
        title="Обновить прогресс"
        isOpen={showUpdateProgress}
        onClose={() => { setShowUpdateProgress(false); setUpdatingGoalId(null); setProgressValue(""); }}
        onSubmit={handleUpdateProgress}
        submitText="Обновить"
      >
        {updatingGoalId && (() => {
          const goal = goals.find((g) => g.id === updatingGoalId);
          if (!goal) return null;
          return (
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center">
                <p className="text-sm font-medium text-slate-400 mb-1">Цель: <span className="text-slate-200 font-bold">{goal.name}</span></p>
                <p className="text-xs text-slate-500">Осталось: <span className="text-blue-400 font-bold">{goal.targetValue - goal.currentValue}</span></p>
              </div>
              <FormInput
                label="Добавить к значению (например, 5)"
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
