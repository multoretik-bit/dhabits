import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { defaultShopItems } from "@/lib/defaultShopItems";
import { supabase } from "@/lib/supabase";
import { syncSave, syncLoad } from "@/lib/sync";

// Color palette for folders/goals/blocks
export const FOLDER_COLORS = [
  { name: "cyan", border: "#00d9ff", text: "#00d9ff", bg: "rgba(0, 217, 255, 0.1)" },
  { name: "blue", border: "#0066ff", text: "#0066ff", bg: "rgba(0, 102, 255, 0.1)" },
  { name: "purple", border: "#cc00ff", text: "#cc00ff", bg: "rgba(204, 0, 255, 0.1)" },
  { name: "green", border: "#00cc00", text: "#00cc00", bg: "rgba(0, 204, 0, 0.1)" },
  { name: "yellow", border: "#ffcc00", text: "#ffcc00", bg: "rgba(255, 204, 0, 0.1)" },
  { name: "red", border: "#ff0000", text: "#ff0000", bg: "rgba(255, 0, 0, 0.1)" },
  { name: "pink", border: "#ff00ff", text: "#ff00ff", bg: "rgba(255, 0, 255, 0.1)" },
  { name: "orange", border: "#ff6600", text: "#ff6600", bg: "rgba(255, 102, 0, 0.1)" },
];

export function getFolderColor(index: number) {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
}

// Helper to get today's date string in YYYY-MM-DD format
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  folder: string;
  daysOfWeek: number[];
  blockId: string;
  streak: number;
  coinsPerComplete: number;
  completedDates: Record<string, boolean>;
  completed?: boolean;
  lastCompletedDate?: string;
  initialStreak?: number;
  units: number;
  coinsPerUnit?: number;
  progressUnit?: string;
  unitsTracking: boolean;
}

export interface HabitBlock {
  id: string;
  name: string;
  collapsed: boolean;
  habits: Habit[];
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
}

export interface Task {
  id: string;
  title: string;
  emoji: string;
  blockId?: string;
  daysOfWeek: number[]; // [] = every day
  isAllDay: boolean;
  color: string;
  completedDates: Record<string, boolean>;
}


export function getCurrentBlock(blocks: HabitBlock[], now: Date): HabitBlock | null {
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  return blocks.find((b) => {
    if (!b.startTime || !b.endTime) return false;
    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);
    return total >= sh * 60 + sm && total < eh * 60 + em;
  }) ?? null;
}

export function getNextBlock(blocks: HabitBlock[], now: Date): HabitBlock | null {
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  const upcoming = blocks
    .filter((b) => {
      if (!b.startTime) return false;
      const [sh, sm] = b.startTime.split(":").map(Number);
      return sh * 60 + sm > total;
    })
    .sort((a, b) => {
      const [ash, asm] = a.startTime!.split(":").map(Number);
      const [bsh, bsm] = b.startTime!.split(":").map(Number);
      return ash * 60 + asm - (bsh * 60 + bsm);
    });
  return upcoming[0] ?? null;
}

export interface HabitFolder {
  id: string;
  name: string;
  emoji?: string;
  color: string;
  collapsed: boolean;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  description: string;
  linkedHabits: string[];
  coins: number;
  streak: number;
  folder: string;
  completed: boolean;
  startValue: number;
  targetValue: number;
  currentValue: number;
  color: string;
}

export interface GoalFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
  collapsed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: "reward" | "character" | "background" | "vehicle";
  folder: string;
  purchased: boolean;
  assetPath?: string;
  slot?: "head" | "body" | "hands" | "feet" | "accessory" | "background" | "vehicle";
}

export interface CharacterState {
  head?: string;
  body?: string;
  hands?: string;
  feet?: string;
  accessory?: string;
  background?: string;
  vehicle?: string;
}

export interface ShopFolder {
  id: string;
  name: string;
  collapsed: boolean;
}

interface AppContextType {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  habits: Habit[];
  blocks: HabitBlock[];
  habitFolders: HabitFolder[];
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string, dateStr?: string) => void;
  isHabitCompletedToday: (habit: Habit) => boolean;
  moveHabit: (habitId: string, targetBlockId: string, targetIndex: number) => void;
  addBlock: (block: HabitBlock) => void;
  updateBlock: (id: string, block: Partial<HabitBlock>) => void;
  deleteBlock: (id: string) => void;
  toggleBlockCollapse: (id: string) => void;
  addHabitFolder: (folder: HabitFolder) => void;
  updateHabitFolder: (id: string, folder: Partial<HabitFolder>) => void;
  deleteHabitFolder: (id: string) => void;
  goals: Goal[];
  goalFolders: GoalFolder[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalFolder: (folder: GoalFolder) => void;
  updateGoalFolder: (id: string, folder: Partial<GoalFolder>) => void;
  deleteGoalFolder: (id: string) => void;
  toggleGoalFolderCollapse: (id: string) => void;
  shopItems: ShopItem[];
  shopFolders: ShopFolder[];
  characterState: CharacterState;
  addShopItem: (item: ShopItem) => void;
  updateShopItem: (id: string, item: Partial<ShopItem>) => void;
  deleteShopItem: (id: string) => void;
  purchaseItem: (id: string) => boolean;
  addShopFolder: (folder: ShopFolder) => void;
  deleteShopFolder: (id: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: keyof CharacterState) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<boolean>;
  addProgressToHabit: (habitId: string, amount: number) => void;
  resetProgressForHabit: (habitId: string) => void;
  addUnitsToHabit: (habitId: string, amount: number) => void;
  resetUnitsForHabit: (habitId: string) => void;
  moveHabitUp: (habitId: string) => void;
  moveHabitDown: (habitId: string) => void;
  moveHabitFolderUp: (folderId: string) => void;
  moveHabitFolderDown: (folderId: string) => void;
  moveGoalUp: (goalId: string) => void;
  moveGoalDown: (goalId: string) => void;
  moveGoalFolderUp: (folderId: string) => void;
  moveGoalFolderDown: (folderId: string) => void;
  moveBlockUp: (blockId: string) => void;
  moveBlockDown: (blockId: string) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, dateStr?: string) => void;
  isTaskCompletedToday: (task: Task) => boolean;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  isSyncing: boolean;
  syncWithCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function migrateHabit(habit: any): Habit {
  if (!habit.completedDates) {
    const completedDates: Record<string, boolean> = {};
    if (habit.completed === true && habit.lastCompletedDate) {
      completedDates[habit.lastCompletedDate] = true;
    }
    return { ...habit, completedDates, completed: undefined };
  }
  return habit as Habit;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(0);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [blocks, setBlocks] = useState<HabitBlock[]>([]);
  const [habitFolders, setHabitFolders] = useState<HabitFolder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalFolders, setGoalFolders] = useState<GoalFolder[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopFolders, setShopFolders] = useState<ShopFolder[]>([]);
  const [characterState, setCharacterState] = useState<CharacterState>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedData = storage.getData();
    let folders = savedData.habitFolders || [];
    const generalFolder = folders.find((f: any) => f.id === "general");
    if (!generalFolder) {
      folders = [{ id: "general", name: "Общие", color: "#94a3b8", collapsed: false }, ...folders];
    }
    setCoins(savedData.coins || 0);
    const migratedHabits = (savedData.habits || []).map(migrateHabit);
    setHabits(migratedHabits);
    setBlocks(savedData.blocks || []);
    setHabitFolders(folders);

    let gFolders = savedData.goalFolders || [];
    if (!gFolders.find((f: any) => f.id === "general")) {
      gFolders = [{ id: "general", name: "Общие", emoji: "🏆", color: "#94a3b8", collapsed: false }, ...gFolders];
    }
    setGoals(savedData.goals || []);
    setGoalFolders(gFolders);
    const savedShopItems = savedData.shopItems;
    if (savedShopItems && savedShopItems.length > 0) {
      const savedIds = new Set(savedShopItems.map((i: ShopItem) => i.id));
      const newDefaults = defaultShopItems.filter((d) => !savedIds.has(d.id));
      setShopItems([...savedShopItems, ...newDefaults]);
    } else {
      setShopItems(defaultShopItems);
    }
    setShopFolders(savedData.shopFolders || []);
    setCharacterState(savedData.characterState || {});
    setTasks(savedData.tasks || []);

    // Initial cloud sync
    setIsSyncing(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const remoteData = await syncLoad(session.user.id) as any;
          if (remoteData) {
            const localLastUpdated = savedData.lastUpdated || 0;
            const remoteLastUpdated = remoteData.lastUpdated || 0;
            
            // If remote is newer OR local is effectively empty/new
            const isLocalEmpty = !savedData.habits?.length && !savedData.tasks?.length && (savedData.coins || 0) === 0;
            
            if (isLocalEmpty || (remoteLastUpdated && new Date(remoteLastUpdated) > new Date(localLastUpdated))) {
              console.log("Applying remote data", remoteData);
              setCoins(remoteData.coins || 0);
              setHabits((remoteData.habits || []).map(migrateHabit));
              setBlocks(remoteData.blocks || []);
              setHabitFolders(remoteData.habitFolders || []);
              setGoals(remoteData.goals || []);
              setGoalFolders(remoteData.goalFolders || []);
              setShopItems(remoteData.shopItems || []);
              setShopFolders(remoteData.shopFolders || []);
              setCharacterState(remoteData.characterState || {});
              setTasks(remoteData.tasks || []);
              storage.saveData(remoteData);
            }
          }
        } catch (err) {
          console.error("Initial sync fetch failed", err);
        }
      }
      setIsSyncing(false);
    });
  }, []);

  const isHabitCompletedToday = (habit: Habit): boolean => {
    const today = getTodayDateString();
    return !!(habit.completedDates && habit.completedDates[today]);
  };

  const saveAllData = (
    newCoins: number,
    newHabits: Habit[],
    newBlocks: HabitBlock[],
    newHabitFolders: HabitFolder[],
    newGoals: Goal[],
    newGoalFolders: GoalFolder[],
    newShopItems: ShopItem[],
    newShopFolders: ShopFolder[],
    newCharacterState: CharacterState,
    newTasks: Task[]
  ) => {
    const dataObj = {
      coins: newCoins,
      habits: newHabits,
      blocks: newBlocks,
      habitFolders: newHabitFolders,
      goals: newGoals,
      goalFolders: newGoalFolders,
      shopItems: newShopItems,
      shopFolders: newShopFolders,
      characterState: newCharacterState,
      tasks: newTasks,
      progress: {},
      streaks: {},
      folders: [],
      shop: [],
      character: {},
      lastUpdated: new Date().toISOString(),
    };
    storage.saveData(dataObj);
    
    // Skip remote save if we are currently downloading remote data
    if (isSyncing) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await syncSave(session.user.id, dataObj);
      }
    });
  };

  const syncWithCloud = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const remoteData = await syncLoad(session.user.id) as any;
      if (remoteData) {
        setCoins(remoteData.coins || 0);
        setHabits((remoteData.habits || []).map(migrateHabit));
        setBlocks(remoteData.blocks || []);
        setHabitFolders(remoteData.habitFolders || []);
        setGoals(remoteData.goals || []);
        setGoalFolders(remoteData.goalFolders || []);
        setShopItems(remoteData.shopItems || []);
        setShopFolders(remoteData.shopFolders || []);
        setCharacterState(remoteData.characterState || {});
        setTasks(remoteData.tasks || []);
        storage.saveData(remoteData);
      }
    } catch (err) {
      console.error("Manual sync failed", err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const addCoins = (amount: number) => {
    const newCoins = Math.round((coins + amount) * 100) / 100;
    setCoins(newCoins);
    saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const spendCoins = (amount: number): boolean => {
    if (coins < amount) return false;
    const newCoins = Math.round((coins - amount) * 100) / 100;
    setCoins(newCoins);
    saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    return true;
  };

  const addHabit = (habit: Habit) => {
    const newHabits = [...habits, habit];
    setHabits(newHabits);
    saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    const newHabits = habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
    setHabits(newHabits);
    saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const deleteHabit = (id: string) => {
    const newHabits = habits.filter((h) => h.id !== id);
    const newBlocks = blocks.map((b) => ({ ...b, habits: b.habits.filter((h) => h.id !== id) }));
    setHabits(newHabits);
    setBlocks(newBlocks);
    saveAllData(coins, newHabits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const completeHabit = (id: string, dateStr?: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const targetDate = dateStr || getTodayDateString();
    const isCompletedOnDate = !!(habit.completedDates && habit.completedDates[targetDate]);
    if (!isCompletedOnDate) {
      const newCompletedDates = { ...(habit.completedDates || {}), [targetDate]: true };
      const newStreak = habit.streak + 1;
      const newCoins = Math.round((coins + habit.coinsPerComplete) * 100) / 100;
      const newHabits = habits.map((h) =>
        h.id === id ? { ...h, completedDates: newCompletedDates, streak: newStreak, lastCompletedDate: targetDate } : h
      );
      setHabits(newHabits);
      setCoins(newCoins);
      saveAllData(newCoins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    } else {
      const newCompletedDates = { ...(habit.completedDates || {}) };
      delete newCompletedDates[targetDate];
      const newStreak = Math.max(0, habit.streak - 1);
      const newCoins = Math.round((coins - habit.coinsPerComplete) * 100) / 100;
      const newHabits = habits.map((h) =>
        h.id === id ? { ...h, completedDates: newCompletedDates, streak: newStreak } : h
      );
      setHabits(newHabits);
      setCoins(newCoins);
      saveAllData(newCoins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveHabit = (habitId: string, targetBlockId: string, targetIndex: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const updatedHabits = habits.map((h) => (h.id === habitId ? { ...h, blockId: targetBlockId } : h));
    const newBlocks = blocks.map((block) => {
      let newHabits = block.habits.filter((h) => h.id !== habitId);
      if (block.id === targetBlockId) {
        const updatedHabit = updatedHabits.find((h) => h.id === habitId);
        if (updatedHabit) newHabits.splice(targetIndex, 0, updatedHabit);
      }
      return { ...block, habits: newHabits };
    });
    setHabits(updatedHabits);
    setBlocks(newBlocks);
    saveAllData(coins, updatedHabits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const addBlock = (block: HabitBlock) => {
    const newBlocks = [...blocks, block];
    setBlocks(newBlocks);
    saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const updateBlock = (id: string, updates: Partial<HabitBlock>) => {
    const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBlocks(newBlocks);
    saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const toggleBlockCollapse = (id: string) => {
    updateBlock(id, { collapsed: !blocks.find((b) => b.id === id)?.collapsed });
  };

  const addHabitFolder = (folder: HabitFolder) => {
    const newFolders = [...habitFolders, folder];
    setHabitFolders(newFolders);
    saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const updateHabitFolder = (id: string, updates: Partial<HabitFolder>) => {
    const newFolders = habitFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setHabitFolders(newFolders);
    saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const deleteHabitFolder = (id: string) => {
    const newFolders = habitFolders.filter((f) => f.id !== id);
    setHabitFolders(newFolders);
    saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const addGoal = (goal: Goal) => {
    const newGoals = [...goals, goal];
    setGoals(newGoals);
    saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const newGoals = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    setGoals(newGoals);
    saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const deleteGoal = (id: string) => {
    const newGoals = goals.filter((g) => g.id !== id);
    setGoals(newGoals);
    saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks);
  };

  const addGoalFolder = (folder: GoalFolder) => {
    const newFolders = [...goalFolders, folder];
    setGoalFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks);
  };

  const updateGoalFolder = (id: string, updates: Partial<GoalFolder>) => {
    const newFolders = goalFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setGoalFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks);
  };

  const deleteGoalFolder = (id: string) => {
    const newFolders = goalFolders.filter((f) => f.id !== id);
    setGoalFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks);
  };

  const toggleGoalFolderCollapse = (id: string) => {
    updateGoalFolder(id, { collapsed: !goalFolders.find((f) => f.id === id)?.collapsed });
  };

  const addShopItem = (item: ShopItem) => {
    const newItems = [...shopItems, item];
    setShopItems(newItems);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks);
  };

  const updateShopItem = (id: string, updates: Partial<ShopItem>) => {
    const newItems = shopItems.map((i) => (i.id === id ? { ...i, ...updates } : i));
    setShopItems(newItems);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks);
  };

  const deleteShopItem = (id: string) => {
    const newItems = shopItems.filter((i) => i.id !== id);
    setShopItems(newItems);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks);
  };

  const purchaseItem = (id: string): boolean => {
    const item = shopItems.find((i) => i.id === id);
    if (!item || item.purchased || coins < item.price) return false;
    const newCoins = Math.round((coins - item.price) * 100) / 100;
    const newItems = shopItems.map((i) => (i.id === id ? { ...i, purchased: true } : i));
    setCoins(newCoins);
    setShopItems(newItems);
    saveAllData(newCoins, habits, blocks, habitFolders, goals, goalFolders, newItems, shopFolders, characterState, tasks);
    return true;
  };

  const addShopFolder = (folder: ShopFolder) => {
    const newFolders = [...shopFolders, folder];
    setShopFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, newFolders, characterState, tasks);
  };

  const deleteShopFolder = (id: string) => {
    const newFolders = shopFolders.filter((f) => f.id !== id);
    setShopFolders(newFolders);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, newFolders, characterState, tasks);
  };

  const equipItem = (itemId: string) => {
    const item = shopItems.find((i) => i.id === itemId);
    if (!item || !item.slot) return;
    const newCharacterState = { ...characterState, [item.slot]: itemId };
    setCharacterState(newCharacterState);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, newCharacterState, tasks);
  };

  const unequipItem = (slot: keyof CharacterState) => {
    const newCharacterState = { ...characterState };
    delete newCharacterState[slot];
    setCharacterState(newCharacterState);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, newCharacterState, tasks);
  };

  const exportBackup = () => {
    const blob = storage.exportBackup();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dhabits_backup_${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addUnitsToHabit = (habitId: string, amount: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit && habit.unitsTracking && amount > 0) {
      const newUnits = habit.units + amount;
      const coinsEarned = (habit.coinsPerUnit || 0) * amount;
      updateHabit(habitId, { units: newUnits });
      if (coinsEarned > 0) {
        addCoins(coinsEarned);
      }
    }
  };

  const resetUnitsForHabit = (habitId: string) => {
    updateHabit(habitId, { units: 0 });
  };

  const addProgressToHabit = addUnitsToHabit;
  const resetProgressForHabit = resetUnitsForHabit;

  const importBackup = async (file: File): Promise<boolean> => {
    const success = await storage.importBackup(file);
    if (success) {
      const savedData = storage.getData();
      setCoins(savedData.coins || 0);
      const migratedHabits = (savedData.habits || []).map(migrateHabit);
      setHabits(migratedHabits);
      setBlocks(savedData.blocks || []);
      setHabitFolders(savedData.habitFolders || []);
      setGoals(savedData.goals || []);
      setGoalFolders(savedData.goalFolders || []);
      setShopItems(savedData.shopItems || []);
      setShopFolders(savedData.shopFolders || []);
      setCharacterState(savedData.characterState || {});
      setTasks(savedData.tasks || []);
    }
    return success;
  };

  const isTaskCompletedToday = (task: Task): boolean => {
    const today = getTodayDateString();
    return !!(task.completedDates && task.completedDates[today]);
  };

  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const newTasks = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks);
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter((t) => t.id !== id);
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks);
  };

  const completeTask = (id: string, dateStr?: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const targetDate = dateStr || getTodayDateString();
    const isCompleted = !!(task.completedDates && task.completedDates[targetDate]);
    const newCompletedDates = { ...task.completedDates };
    if (isCompleted) {
      delete newCompletedDates[targetDate];
    } else {
      newCompletedDates[targetDate] = true;
    }
    const newTasks = tasks.map((t) => (t.id === id ? { ...t, completedDates: newCompletedDates } : t));
    setTasks(newTasks);
    saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks);
  };

  const moveTaskUp = (taskId: string) => {
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx > 0) {
      const newTasks = [...tasks];
      [newTasks[idx], newTasks[idx - 1]] = [newTasks[idx - 1], newTasks[idx]];
      setTasks(newTasks);
      saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks);
    }
  };

  const moveTaskDown = (taskId: string) => {
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx < tasks.length - 1) {
      const newTasks = [...tasks];
      [newTasks[idx], newTasks[idx + 1]] = [newTasks[idx + 1], newTasks[idx]];
      setTasks(newTasks);
      saveAllData(coins, habits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, newTasks);
    }
  };

  const moveHabitUp = (habitId: string) => {
    const idx = habits.findIndex((h) => h.id === habitId);
    if (idx > 0) {
      const newHabits = [...habits];
      [newHabits[idx], newHabits[idx - 1]] = [newHabits[idx - 1], newHabits[idx]];
      setHabits(newHabits);
      saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveHabitDown = (habitId: string) => {
    const idx = habits.findIndex((h) => h.id === habitId);
    if (idx < habits.length - 1) {
      const newHabits = [...habits];
      [newHabits[idx], newHabits[idx + 1]] = [newHabits[idx + 1], newHabits[idx]];
      setHabits(newHabits);
      saveAllData(coins, newHabits, blocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveHabitFolderUp = (folderId: string) => {
    const idx = habitFolders.findIndex((f) => f.id === folderId);
    if (idx > 0) {
      const newFolders = [...habitFolders];
      [newFolders[idx], newFolders[idx - 1]] = [newFolders[idx - 1], newFolders[idx]];
      setHabitFolders(newFolders);
      saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveHabitFolderDown = (folderId: string) => {
    const idx = habitFolders.findIndex((f) => f.id === folderId);
    if (idx < habitFolders.length - 1) {
      const newFolders = [...habitFolders];
      [newFolders[idx], newFolders[idx + 1]] = [newFolders[idx + 1], newFolders[idx]];
      setHabitFolders(newFolders);
      saveAllData(coins, habits, blocks, newFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveGoalUp = (goalId: string) => {
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx > 0) {
      const newGoals = [...goals];
      [newGoals[idx], newGoals[idx - 1]] = [newGoals[idx - 1], newGoals[idx]];
      setGoals(newGoals);
      saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveGoalDown = (goalId: string) => {
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx < goals.length - 1) {
      const newGoals = [...goals];
      [newGoals[idx], newGoals[idx + 1]] = [newGoals[idx + 1], newGoals[idx]];
      setGoals(newGoals);
      saveAllData(coins, habits, blocks, habitFolders, newGoals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveGoalFolderUp = (folderId: string) => {
    const idx = goalFolders.findIndex((f) => f.id === folderId);
    if (idx > 0) {
      const newFolders = [...goalFolders];
      [newFolders[idx], newFolders[idx - 1]] = [newFolders[idx - 1], newFolders[idx]];
      setGoalFolders(newFolders);
      saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveGoalFolderDown = (folderId: string) => {
    const idx = goalFolders.findIndex((f) => f.id === folderId);
    if (idx < goalFolders.length - 1) {
      const newFolders = [...goalFolders];
      [newFolders[idx], newFolders[idx + 1]] = [newFolders[idx + 1], newFolders[idx]];
      setGoalFolders(newFolders);
      saveAllData(coins, habits, blocks, habitFolders, goals, newFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveBlockUp = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx > 0) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
      setBlocks(newBlocks);
      saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  const moveBlockDown = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
      setBlocks(newBlocks);
      saveAllData(coins, habits, newBlocks, habitFolders, goals, goalFolders, shopItems, shopFolders, characterState, tasks);
    }
  };

  return (
    <AppContext.Provider
      value={{
        coins,
        addCoins,
        spendCoins,
        habits,
        blocks,
        habitFolders,
        addHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        isHabitCompletedToday,
        moveHabit,
        addBlock,
        updateBlock,
        deleteBlock,
        toggleBlockCollapse,
        addHabitFolder,
        updateHabitFolder,
        deleteHabitFolder,
        goals,
        goalFolders,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalFolder,
        updateGoalFolder,
        deleteGoalFolder,
        toggleGoalFolderCollapse,
        shopItems,
        shopFolders,
        addShopItem,
        updateShopItem,
        deleteShopItem,
        purchaseItem,
        addShopFolder,
        deleteShopFolder,
        exportBackup,
        importBackup,
        addProgressToHabit,
        resetProgressForHabit,
        addUnitsToHabit,
        resetUnitsForHabit,
        characterState,
        equipItem,
        unequipItem,
        moveHabitUp,
        moveHabitDown,
        moveHabitFolderUp,
        moveHabitFolderDown,
        moveGoalUp,
        moveGoalDown,
        moveGoalFolderUp,
        moveGoalFolderDown,
        moveBlockUp,
        moveBlockDown,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        isTaskCompletedToday,
        moveTaskUp,
        moveTaskDown,
        isSyncing,
        syncWithCloud,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
