import React, { useMemo } from 'react';
import { useApp, Task } from '@/contexts/AppContext';
import { formatDateToDateString, getDayName, getMonthName } from '@/lib/dateUtils';
import { Plus } from 'lucide-react';
import TaskRow from './TaskRow';

export default function TaskCalendarFeed({ onCreateTask, onEditTask, onDeleteTask, daysCount = 30 }: { onCreateTask: (dateStr: string) => void; onEditTask?: (task: Task) => void; onDeleteTask?: (task: Task) => void; daysCount?: number }) {
  const { tasks } = useApp();

  const daysList = useMemo(() => {
    const list = [];
    const now = new Date();
    now.setHours(0,0,0,0);
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      list.push(d);
    }
    return list;
  }, [daysCount]);

  return (
    <div className="space-y-6 relative z-10">
      {daysList.map((day, index) => {
        const dateStr = formatDateToDateString(day);
        const dayOfWeek = day.getDay();
        const isToday = index === 0;

        // filter tasks
        const dayTasks = tasks.filter(t => {
          if (t.specificDate) return t.specificDate === dateStr;
          return t.daysOfWeek && t.daysOfWeek.includes(dayOfWeek);
        });

        return (
          <div key={dateStr} className="glass-card rounded-[24px] p-4 flex flex-col relative overflow-hidden transition-all hover:-translate-y-0.5">
            {isToday && (
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-orange-500/15 text-orange-300 text-[10px] font-bold uppercase tracking-wide rounded-bl-2xl border-b border-l border-orange-300/10 shadow-sm">
                Сегодня
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4 pl-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-white/5 shadow-md" style={isToday ? { border: '1px solid rgba(59, 130, 246, 0.5)', background: 'rgba(30, 58, 138, 0.2)' } : {}}>
                 <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">{getDayName(day)}</span>
                 <span className="text-lg font-black text-white leading-none">{day.getDate()}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-200 capitalize">{getMonthName(day)}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dayTasks.length} {dayTasks.length === 1 ? 'задача' : (dayTasks.length > 1 && dayTasks.length < 5 ? 'задачи' : 'задач')}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {dayTasks.length > 0 ? (
                dayTasks.map(task => (
                  <TaskRow 
                    key={`${task.id}-${dateStr}`} 
                    task={task} 
                    dateStr={dateStr} 
                    isCondensed 
                    onEdit={onEditTask ? () => onEditTask(task) : undefined}
                    onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
                  />
                ))
              ) : (
                <div className="py-4 px-4 rounded-xl bg-black/20 border border-dashed border-white/5 text-center">
                  <span className="text-xs font-bold text-slate-600">Задач нет</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => onCreateTask(dateStr)}
              className="w-full py-3 rounded-xl border border-dashed border-indigo-500/30 text-indigo-400 font-bold text-xs uppercase tracking-widest hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Запланировать
            </button>
          </div>
        );
      })}
    </div>
  );
}
