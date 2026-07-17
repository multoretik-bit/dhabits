import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Edit2, ListTodo, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, type Task } from "@/contexts/AppContext";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import CompletionBurst from "./CompletionBurst";

export default function TaskRow({ task, dateStr, isCondensed, showTime = false, onEdit, onDelete }: { task: Task; dateStr: string; isCondensed?: boolean; showTime?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const { completeTask, moveTaskUp, moveTaskDown, toggleSubtask } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const completed = Boolean(task.completedDates?.[dateStr]);
  const isOverdue = Boolean(task.overdueSince && !completed);
  const color = task.color || "#315cff";
  const subtasks = task.subtasks ?? [];
  const completedSubtasks = subtasks.filter((item) => item.completed).length;

  const handleComplete = () => {
    if (!completed && task.coins) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 600);
    }
    completeTask(task.id, dateStr);
  };

  return (
    <article className={cn("task-row-wrap", isCondensed && "is-condensed")}>
      <div className={cn("task-row", completed && "is-completed")} style={{ borderLeftColor: completed ? `${color}66` : color }} onClick={handleComplete}>
        <CompletionBurst show={celebrate} color={color} />
        <AnimatePresence>
          {celebrate && Boolean(task.coins) && <motion.span initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -24 }} exit={{ opacity: 0 }} className="reward-float">+{task.coins}</motion.span>}
        </AnimatePresence>
        <motion.span key={completed ? "done" : "pending"} initial={{ scale: .7 }} animate={{ scale: 1 }} transition={spring.bouncy} className="item-emoji" style={{ backgroundColor: `${color}14` }}>
          {completed ? <Check className="size-4" /> : task.emoji || "📋"}
        </motion.span>
        <div className="item-copy">
          <div className="flex min-w-0 items-center gap-2">
            <span className="item-title truncate">{task.title}</span>
            {(showTime || task.time) && <span className="time-badge">{task.time || (task.isAllDay ? "Весь день" : "Без времени")}</span>}
            {isOverdue && <span className="overdue-badge" title={`Перенесено с ${task.overdueSince}`}>Просрочено</span>}
          </div>
          {subtasks.length > 0 && (
            <div className="subtask-progress">
              <span><i style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }} /></span>
              <small>{completedSubtasks}/{subtasks.length}</small>
            </div>
          )}
        </div>
        {Boolean(task.coins) && (
          <span className="task-reward" title={`${task.coins} монет за выполнение`}>
            <img src="/illustrations/reward-coin-v3.svg" alt="" />
            <strong>{task.coins}</strong>
          </span>
        )}
        <div className="task-actions" onClick={(event) => event.stopPropagation()}>
          {subtasks.length > 0 && <button onClick={() => setExpanded((value) => !value)} aria-label="Показать подзадачи"><ListTodo className="size-4" /></button>}
          {!completed && !isCondensed && (
            <span className="reorder-controls">
              <button onClick={() => moveTaskUp(task.id)} aria-label="Переместить задачу выше"><ArrowUp className="size-3" /></button>
              <button onClick={() => moveTaskDown(task.id)} aria-label="Переместить задачу ниже"><ArrowDown className="size-3" /></button>
            </span>
          )}
          {onEdit && <button onClick={onEdit} aria-label="Редактировать"><Edit2 className="size-4" /></button>}
          {onDelete && <button onClick={onDelete} className="danger-action" aria-label="Удалить"><Trash2 className="size-4" /></button>}
        </div>
      </div>
      <AnimatePresence>
        {expanded && subtasks.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="subtask-list">
            {subtasks.map((subtask) => (
              <button key={subtask.id} onClick={() => toggleSubtask(task.id, subtask.id)} className={cn("subtask-item", subtask.completed && "is-completed")}>
                <span>{subtask.completed && <Check className="size-3" />}</span>
                {subtask.title}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
