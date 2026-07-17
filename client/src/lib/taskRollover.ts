export type RollableTask = {
  specificDate?: string;
  completedDates?: Record<string, boolean>;
  overdueSince?: string;
};

export function rollOverOverdueTasks<T extends RollableTask>(tasks: T[], today: string): T[] {
  let changed = false;

  const nextTasks = tasks.map((task) => {
    const scheduledDate = task.specificDate;
    if (!scheduledDate || scheduledDate >= today || task.completedDates?.[scheduledDate]) return task;

    changed = true;
    return {
      ...task,
      specificDate: today,
      overdueSince: task.overdueSince || scheduledDate,
    };
  });

  return changed ? nextTasks : tasks;
}
