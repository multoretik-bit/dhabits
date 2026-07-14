import { useState } from "react";
import { useApp, Task } from "@/contexts/AppContext";
import { Check, ListTodo, ArrowUp, ArrowDown, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import CompletionBurst from "./CompletionBurst";

export default function TaskRow({ task, dateStr, isCondensed, onEdit, onDelete }: { task: Task; dateStr: string; isCondensed?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const { completeTask, moveTaskUp, moveTaskDown, toggleSubtask } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const completed = !!(task.completedDates && task.completedDates[dateStr]);
  const taskColor = task.color || "#3b82f6";

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const handleComplete = () => {
    if (!completed && task.coins) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 600);
    }
    completeTask(task.id, dateStr);
  };

  return (
    <div className={cn("mb-3", isCondensed && "mb-2")}>
      <div
        className={cn(
          "relative w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left overflow-hidden cursor-pointer hover-lift shadow-sm",
          completed ? "opacity-60 bg-slate-900/40 border border-white/5" : "glass-card hover:border-blue-500/30",
          isCondensed && "p-2 rounded-xl"
        )}
        style={{
          borderLeft: completed ? `3px solid ${taskColor}44` : `3px solid ${taskColor}`,
          background: completed ? "rgba(15,23,42,0.4)" : `linear-gradient(135deg, ${taskColor}12 0%, rgba(15,23,42,0.6) 100%)`
        }}
        onClick={handleComplete}
      >
        <CompletionBurst show={celebrate} color={taskColor} />
        <AnimatePresence>
          {celebrate && !!task.coins && (
            <motion.span
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -24, scale: 1.1 }}
              exit={{ opacity: 0, y: -36 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute left-12 top-1 z-20 text-sm font-black pointer-events-none"
              style={{ color: "var(--coin)" }}
            >
              +{task.coins}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span
          key={completed ? "done" : "pending"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.bouncy}
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-xl text-xl",
            isCondensed ? "w-8 h-8 text-lg" : "w-10 h-10",
            completed ? "bg-slate-800" : `${taskColor}22`
          )}
          style={{ backgroundColor: completed ? "#1e293b" : `${taskColor}22` }}
        >
          {completed ? <Check className="w-4 h-4 text-slate-500" /> : (task.emoji || "📋")}
        </motion.span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "block font-bold leading-snug",
              isCondensed ? "text-xs" : "text-sm",
              completed ? "line-through text-slate-500" : "text-slate-100"
            )}>
              {task.title}
            </span>
            {task.time && !isCondensed && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md">
                {task.time}
              </span>
            )}
          </div>
          {hasSubtasks && (
            <div className="flex items-center gap-2 mt-1">
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                  <div 
                    className="h-full bg-blue-500/50 transition-all duration-500" 
                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  />
               </div>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                 {completedSubtasks}/{totalSubtasks}
               </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {hasSubtasks && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-blue-400 transition-colors"
            >
              <ListTodo className={cn("w-4 h-4 transition-transform", expanded && "text-blue-400")} />
            </button>
          )}
          {!completed && !isCondensed && (
            <div className="flex flex-col gap-0.5">
              <button onClick={(e) => { e.stopPropagation(); moveTaskUp(task.id); }} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); moveTaskDown(task.id); }} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          )}
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-blue-400 transition-colors ml-1">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasSubtasks && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn("pt-2 pb-1 pr-4 flex flex-col gap-2", isCondensed ? "pl-10" : "pl-12")}>
              {task.subtasks?.map(st => (
                <div 
                  key={st.id} 
                  className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => toggleSubtask(task.id, st.id)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    st.completed ? "bg-blue-600 border-blue-600" : "border-slate-700 bg-slate-950"
                  )}>
                    {st.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    st.completed ? "text-slate-500 line-through" : "text-slate-300"
                  )}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
